---
layout: defense
title: Threat Hunting with Sysmon
---

<img height="150" align="left" src="/images/sysmon-threat-hunting.png" > 
In today's threat landscape, understanding how attackers operate within a system is crucial. Leveraging Windows and Sysmon event codes can help detect and prevent attacks before they cause significant damage. This guide focuses on the most relevant Windows Event Codes for logons, process creation, and privileged access, as well as Sysmon Event Codes for tracking file changes, process injections, and network activity. Combined with practical hunting queries for ELK and Splunk, this serves as a hands-on reference for defenders actively hunting threats in their environment.

## Key Windows Event Codes

A more detailed version of [Windows Event Codes](https://benjitrapp.github.io/defenses/2023-05-01-windows-events/) can be found within my blog. Nevertheless I want to repeat it here to set it in a different context, that will help in the hunting steps later. These are the most important Windows Event Codes for tracking suspicious activities:

| Event ID | Description | Why It's Useful |
| :------- | :---------- | :-------------- |
| 4104 | PowerShell Script Block Logging | Captures PowerShell script execution for detecting malicious scripts |
| 4624 | Successful Logon | Tracks all successful logins to detect unauthorized access |
| 4625 | Failed Logon | Logs failed login attempts, useful for detecting brute-force attacks |
| 4648 | Logon with Explicit Credentials | Detects lateral movement or credential abuse |
| 4672 | Special Privileges Assigned to New Logon | Tracks privileged account activity |
| 4688 | Process Creation | Logs process creation including command-line arguments |
| 4697 | Service Installation (Privileged) | Detects privilege escalation via service installation |
| 4698 | Scheduled Task Created | Detects persistence via scheduled tasks |
| 4699 | Scheduled Task Deleted | Detects cleanup after persistence |
| 4703 | Audit Policy Change | Monitors changes to audit policies |
| 4719 | System Audit Policy Changed | Detects attempts to disable or modify logging |
| 4720 | User Account Created | Detects unauthorized account creation for persistence |
| 4725 | User Account Disabled | Tracks removal of access privileges |
| 4728 | Member Added to Security-Enabled Global Group | Detects unauthorized privilege escalation |
| 4732 | User Added to Privileged Group | Detects privilege escalation via group membership |
| 4735 | Security-Enabled Global Group Changed | Monitors unauthorized group policy changes |
| 4740 | Account Lockout | Detects brute-force attacks |
| 4756 | Member Added to Security-Enabled Universal Group | Detects unauthorized privilege escalation |
| 4767 | Account Unlocked | Identifies attackers regaining access |
| 4769 | Kerberos Service Ticket Requested | Detects Pass-the-Ticket attacks |
| 4770 | Kerberos Service Ticket Renewed | Monitors suspicious ticket renewal activity |
| 4771 | Kerberos Pre-Authentication Failed | Identifies brute-force or credential theft |
| 4776 | NTLM Authentication Request | Detects pass-the-hash attacks |
| 4778 | Session Reconnected | Detects session hijacking |
| 4782 | Password Hash Accessed | Detects credential dumping |
| 4798 | Local Group Membership Enumeration | Detects reconnaissance activity |
| 4964 | Special Groups Logon Tracking | Tracks privileged account usage |
| 5025 | Firewall Service Stopped | Detects firewall disabling |
| 5031 | Windows Firewall Blocked an Application | Detects network-based threats |
| 5038 | Code Integrity Check Failed | Detects tampered or unauthorized drivers |
| 5058 | Key File Operation | Detects unauthorized crypto operations |
| 5140 | Network Share Accessed | Detects lateral movement and data exfiltration |
| 5142 | Network Share Created | Detects data exfiltration paths |
| 5143 | Network Share Deleted | Detects track-covering after exfiltration |
| 5145 | File Share Access | Tracks lateral movement via shared resources |
| 6416 | Code Integrity Violation | Detects DLL hijacking or unauthorized execution |
| 7036 | Service Status Changed | Detects attacks modifying critical services |
| 7045 | Service Installed | Detects persistence via new services |
| 1000 | Application Error | Detects system instability from malware |
| 1074 | System Shutdown/Reboot | Tracks unexpected reboots |
| 1102 | Security Log Cleared | Detects log tampering to cover tracks |

---

## Sysmon Event Codes

Below are the Sysmon Event Codes essential for advanced threat hunting:

| Event ID | Description | Why It's Useful |
| :------- | :---------- | :-------------- |
| 1 | Process Creation | Logs every new process, helping identify suspicious executables |
| 3 | Network Connection | Tracks network connections made by processes for detecting C2 |
| 5 | Process Termination | Tracks lifecycle of malicious processes |
| 6 | Driver Loaded | Detects rootkits or unauthorized kernel drivers |
| 7 | Image Load | Detects DLL hijacking or injection via suspicious DLL loads |
| 8 | CreateRemoteThread | Detects process injection via remote thread creation |
| 9 | RawAccessRead | Detects low-level disk access (e.g., ransomware) |
| 10 | Process Access | Detects credential theft or process hollowing |
| 11 | File Creation | Detects malware or scripts dropped onto a system |
| 12 | Registry Object Added/Deleted | Identifies persistence via registry |
| 13 | Registry Value Set | Detects registry-based persistence techniques |
| 15 | File Create Stream Hash | Identifies files used to execute malware |
| 17 | Pipe Created | Detects malicious IPC techniques |
| 18 | Pipe Connected | Detects malware components communicating |
| 19 | WMI Event Filter | Detects WMI-based persistence and lateral movement |
| 20 | WMI Event Consumer Activity | Detects WMI persistence mechanisms |
| 22 | DNS Query | Detects C2 beaconing and suspicious domain lookups |
| 23 | File Deletion | Tracks attacker cleanup activities |
| 24 | Clipboard Change | Detects clipboard hijacking |
| 25 | Process Tampering | Detects in-memory injection and process hollowing |
| 26 | File Delete Logged | Tracks cleanup activity post-attack |

---

## Common Threat Hunting Techniques

### 1. Detecting Malicious PowerShell Activity

PowerShell is the most abused living-off-the-land binary on Windows. Attackers leverage its .NET integration, in-memory execution capabilities, and deep OS access to download payloads (`IEX (New-Object Net.WebClient).DownloadString()`), execute shellcode, and perform reconnaissance — all without dropping a single file to disk. The `-EncodedCommand` flag allows Base64-encoded payloads to bypass naive command-line string detection. Script Block Logging (Event 4104) decodes these blocks before execution, giving defenders visibility into the actual code being run regardless of obfuscation layers.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 4104 | Windows | Script block content — look for obfuscated strings, `IEX`, `Invoke-Expression` |
| 4688 | Windows | Process creation — how was `powershell.exe` launched? Check for `-enc`, `-nop`, `-w hidden` |

### 2. Monitoring Privileged Account Access

Privileged accounts (Domain Admins, local Administrators, service accounts with `SeDebugPrivilege`) are the primary target for any attacker who has gained initial access. A compromised privileged account allows unrestricted lateral movement, data access, and persistence. Monitoring logon events for these accounts — especially outside business hours, from unexpected source IPs, or using unusual logon types (e.g., Type 10 for RDP, Type 3 for network) — is one of the highest-value detection strategies available.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 4624 | Windows | Successful logons — unexpected accounts, unusual hours, or foreign IPs |
| 4625 | Windows | Failed logons — repeated failures suggest brute-force attempts |
| 4672 | Windows | Special privileges assigned — tracks when admin-level accounts authenticate |

### 3. Identifying Lateral Movement

Once attackers compromise a single host, they pivot to other systems using stolen credentials or tokens. Techniques include `runas /netonly`, PsExec, WMI remote execution, and pass-the-hash via NTLM. Event 4648 fires when a process explicitly provides credentials different from the logged-on user — a strong signal that someone is authenticating to a remote resource with harvested credentials. Correlating this with NTLM authentication events on domain controllers reveals the full lateral movement path.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 4648 | Windows | Explicit credential logon — `runas` or tools using alternate credentials |
| 4776 | Windows | NTLM authentication — pass-the-hash attempts against domain controllers |

### 4. Tracking Process Injection

Process injection allows attackers to execute arbitrary code within the address space of a legitimate process (e.g., `svchost.exe`, `explorer.exe`), inheriting its security context and evading process-based allowlists. Common techniques include classic DLL injection via `CreateRemoteThread`, process hollowing (unmapping a suspended process's memory and replacing it), and APC queue injection. Sysmon Event 8 captures the cross-process thread creation that underpins most injection variants, while Event 10 reveals the memory access operations (typically `PROCESS_VM_WRITE | PROCESS_VM_OPERATION`) that precede code execution.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 8 | Sysmon | `CreateRemoteThread` — one process creating a thread in another |
| 10 | Sysmon | Process access — memory read/write into another process (e.g., LSASS) |
| 4688 | Windows | Parent-child relationship — is the injecting process legitimate? |

### 5. Detecting Persistence via Services

Windows services run as SYSTEM by default and start automatically at boot, making them an ideal persistence mechanism. Attackers use `sc.exe create` or direct registry writes to `HKLM\SYSTEM\CurrentControlSet\Services` to install malicious services that survive reboots. Event 7045 logs service installations in the System log, capturing the service name, binary path, and account — allowing defenders to identify services pointing to unusual executables in `Temp` directories or using obfuscated command-line arguments.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 7045 | Windows | New service installed — unexpected service names or paths |
| 4697 | Windows | Privileged service installation — services installed with SYSTEM rights |
| 1 | Sysmon | Process creation — what process created the service? |

### 6. Monitoring File and Registry Changes

The Windows registry and filesystem are the two primary locations where persistence, configuration changes, and payload staging occur. Registry `Run`/`RunOnce` keys, Image File Execution Options (IFEO) debugger values, COM object hijacks, and AppInit_DLLs all provide autostart extensibility that attackers abuse. On the filesystem side, dropping executables or scripts into `C:\Windows\Tasks`, `%AppData%\Startup`, or `System32` provides execution at logon or boot. Monitoring creation and modification events across both surfaces catches persistence at installation time rather than at execution.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 11 | Sysmon | File creation — executables or scripts dropped in `Temp`, `AppData`, or `Tasks` |
| 12/13 | Sysmon | Registry add/modify — `Run` keys, services, IFEO, or COM hijacks |
| 4663 | Windows | Object access — reads/writes to sensitive files or directories |

### 7. Detecting Command-and-Control (C2) Activity

After gaining a foothold, malware must communicate with attacker infrastructure to receive commands and exfiltrate data. C2 channels range from simple HTTPS beacons (blending with legitimate traffic on port 443) to DNS tunneling (encoding data in subdomain labels), custom protocols on high ports, and traffic over legitimate services like Slack or Telegram. Sysmon's DNS and network connection events provide process-level attribution — you can see exactly which binary is making the connection, enabling detection even when the traffic itself appears benign at the network layer.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 22 | Sysmon | DNS queries — unusual domains, high frequency, long subdomains (tunneling) |
| 3 | Sysmon | Network connections — outbound to rare ports or foreign IPs |
| 5140 | Windows | Network share access — SMB lateral movement paired with C2 |

### 8. Identifying Suspicious Scheduled Tasks

The Windows Task Scheduler (`schtasks.exe` / Task Scheduler COM API) allows code execution at defined triggers — boot, logon, time intervals, or system events. Attackers use scheduled tasks for persistence (MITRE T1053.005) because they execute with configurable privileges, survive reboots, and can be created remotely. Event 4698 captures the full XML task definition including the action (command/arguments), trigger, and security principal, enabling defenders to identify tasks with encoded PowerShell, unusual binary paths, or execution as SYSTEM.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 4698 | Windows | Task creation — unexpected task names, encoded commands in actions |
| 4699 | Windows | Task deletion — cleanup after persistence established |
| 1 | Sysmon | Process creation — what spawned `schtasks.exe`? |

### 9. Monitoring User Account Activity

Creating local or domain accounts is a straightforward persistence technique — even if the initial access vector is remediated, a backdoor account provides re-entry. Attackers also add compromised accounts to privileged groups (Domain Admins, Enterprise Admins, local Administrators) to escalate privileges without needing to exploit a vulnerability. In mature environments, account provisioning follows defined workflows; any account creation or group modification outside those workflows is immediately suspicious.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 4720 | Windows | Account created — new accounts outside of provisioning workflows |
| 4732 | Windows | Added to privileged group — unexpected additions to Administrators/Domain Admins |
| 4647 | Windows | User logoff — correlate session length with suspicious activity windows |

### 10. Tracking Malicious Script Execution

Beyond PowerShell, Windows ships with multiple script interpreters: `wscript.exe` (Windows Script Host for VBScript/JScript), `cscript.exe` (console variant), and `mshta.exe` (HTML Applications). These are legitimate binaries signed by Microsoft, making them ideal for bypassing application whitelisting. Attackers deliver `.vbs`, `.js`, `.hta`, or `.wsf` files via phishing, and the script interpreter handles download, decode, and execution of subsequent payloads — all without compiling a binary.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 1 | Sysmon | Process creation — `wscript.exe`, `cscript.exe`, `mshta.exe` spawned |
| 7 | Sysmon | Image load — unusual DLLs loaded by scripting engines |

### 11. Detecting Process Hollowing

Process hollowing (MITRE T1055.012) creates a legitimate process in a suspended state, unmaps its original code using `NtUnmapViewOfSection`, writes malicious code into the now-empty address space, and resumes execution. The result is malicious code running under the identity of a trusted process (e.g., `svchost.exe`) with its PID and image name in Task Manager appearing benign. Detection relies on observing the sequence: process creation in suspended state → cross-process memory write → thread resume, visible through Sysmon's process access and thread creation events.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 10 | Sysmon | Process access — suspicious memory access patterns (write + execute) |
| 8 | Sysmon | Remote thread creation — thread injected into a hollowed process |
| 4688 | Windows | Process tree — legitimate parent spawning suspicious child? |

### 12. Monitoring WMI Abuse

Windows Management Instrumentation (WMI) provides a powerful, built-in mechanism for system management — and for attackers, fileless persistence. WMI event subscriptions consist of a filter (trigger condition), consumer (action to execute), and binding. An attacker can create a subscription that executes a PowerShell payload every time a user logs on or at fixed intervals, with no files on disk and no scheduled task visible in the GUI. The subscription data lives in the WMI repository (`C:\Windows\System32\wbem\Repository`), making it invisible to most filesystem-based scans.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 19 | Sysmon | WMI filter created — event subscriptions for persistence triggers |
| 20 | Sysmon | WMI consumer activity — consumers executing scripts or binaries |
| 1 | Sysmon | Process creation — processes launched by `wmiprvse.exe` |

### 13. Detecting Ransomware Activity

Ransomware typically follows a predictable file-level pattern: enumerate target files → read original content → write encrypted content to a new file (often with an appended extension like `.locked` or `.enc`) → delete the original. This creates a burst of file creation events followed by file deletion events across many directories in rapid succession. Detecting this pattern early — especially when a single process is responsible for thousands of file operations in sensitive directories — provides a narrow window to isolate the affected host before encryption completes.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 11 | Sysmon | File creation — mass creation of new encrypted files (unusual extensions) |
| 23 | Sysmon | File deletion — original files being deleted after encryption |
| 4656/4663 | Windows | Object access — bulk access to sensitive directories |

### 14. Detecting Credential Dumping

The LSASS process (`lsass.exe`) holds plaintext passwords, NTLM hashes, and Kerberos tickets for all active sessions in memory. Tools like Mimikatz, `procdump.exe` (creating a minidump), or the built-in `comsvcs.dll` MiniDump export can extract these credentials, enabling pass-the-hash, pass-the-ticket, and golden ticket attacks. Detection focuses on identifying processes that open a handle to LSASS with memory read permissions (`PROCESS_VM_READ` — access mask `0x1010` or full access `0x1FFFFF`), which is abnormal for everything except AV/EDR and CSRSS.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 10 | Sysmon | Process access to `lsass.exe` — `GrantedAccess` of `0x1010` or `0x1FFFFF` |
| 1 | Sysmon | Process creation — `mimikatz.exe`, `procdump.exe`, `comsvcs.dll` MiniDump |
| 4672 | Windows | Elevated privileges — accounts used during the dumping process |

### 15. Detecting Network Scanning

Reconnaissance is a prerequisite for lateral movement. Attackers use tools like `nmap`, `masscan`, or even native `Test-NetConnection` to identify live hosts, open ports, and accessible services. The telltale sign is a single process making TCP SYN connections (or UDP probes) to many destination IPs on the same port, or to many ports on a single host, within a short time window. This fan-out pattern is anomalous for legitimate applications, which typically communicate with a small set of known endpoints.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 3 | Sysmon | Network connections — single process connecting to many hosts rapidly |
| 5140 | Windows | Share access — enumeration of shares across multiple machines |
| 22 | Sysmon | DNS queries — reverse lookups or sequential IP resolution patterns |

### 16. Monitoring DLL Injection and Hijacking

DLL hijacking exploits the Windows DLL search order: when an application loads a DLL without specifying a full path, Windows searches the application directory first, then `System32`, and so on. By placing a malicious DLL with the expected name in a higher-priority search path, attackers achieve code execution within a trusted process. DLL sideloading is a variant where a legitimate, signed application is bundled with a malicious DLL it naturally loads. Sysmon Event 7 logs every DLL load with the full path, allowing defenders to flag loads from unexpected directories.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 7 | Sysmon | Image load — DLLs loaded from unusual paths (`Temp`, `Downloads`, user dirs) |
| 1 | Sysmon | Process creation — the process responsible for the suspicious load |
| 10 | Sysmon | Process access — memory manipulation between processes |

### 17. Detecting Data Exfiltration

The final objective of many intrusions is data theft. Exfiltration methods range from simple SMB file copies to internal staging servers, to HTTPS uploads to cloud storage, to covert channels like DNS tunneling (encoding data in TXT record queries) or ICMP payloads. Detection requires correlating data access events (who accessed which files) with network events (where did that data go). A single process reading hundreds of files from a file server followed by large outbound transfers to an external IP is a high-confidence exfiltration indicator.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 5140 | Windows | Network share access — bulk reads from file servers |
| 3 | Sysmon | Network connections — large outbound transfers to uncommon destinations |
| 22 | Sysmon | DNS queries — long encoded subdomains indicating DNS tunneling |

### 18. Monitoring Application Whitelisting Bypass

Application whitelisting (AppLocker, WDAC) restricts execution to approved binaries. Attackers bypass these controls using Living-off-the-Land Binaries (LOLBins) — Microsoft-signed executables with unintended functionality. `certutil.exe` can download files, `mshta.exe` executes arbitrary JavaScript, `regsvr32.exe` loads remote COM scriptlets, and `rundll32.exe` can execute DLL exports with attacker-controlled arguments. Since these binaries are signed and trusted, they pass whitelisting checks while performing malicious actions.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 1 | Sysmon | Process creation — LOLBins (`certutil`, `mshta`, `regsvr32`, `rundll32`) |
| 7 | Sysmon | Image load — DLLs sideloaded by trusted binaries |
| 11 | Sysmon | File creation — new executables dropped to bypass whitelists |

### 19. Tracking Phishing-Based Attacks

Phishing remains the most common initial access vector. When a user opens a malicious Office document or HTML attachment, the application (e.g., `winword.exe`, `outlook.exe`) spawns child processes to execute the payload — typically `cmd.exe`, `powershell.exe`, or a script interpreter. This parent-child relationship is highly anomalous: legitimate use of Word or Outlook rarely spawns command interpreters. Monitoring process creation with these parent images provides early detection of exploitation and macro-based attacks before the payload establishes persistence.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 1 | Sysmon | Process creation — child processes of `outlook.exe` or `winword.exe` |
| 3 | Sysmon | Network connections — outbound from attachment-spawned processes |
| 22 | Sysmon | DNS queries — resolution of domains embedded in phishing payloads |

### 20. Detecting Brute Force Attacks

Brute force and password spraying target authentication endpoints to guess valid credentials. Brute force tries many passwords against one account; password spraying tries one or two common passwords against many accounts (avoiding lockout thresholds). Both generate clusters of failed authentication events (4625 for NTLM, 4771 for Kerberos) from a single source IP within a short time window. Kerberos status code `0x18` specifically indicates "wrong password" (vs. `0x6` for "unknown principal"), helping distinguish password guessing from account enumeration.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 4625 | Windows | Failed logons — many failures in a short window from one source |
| 4771 | Windows | Kerberos pre-auth failed — status `0x18` indicates wrong password |
| 3 | Sysmon | Network connections — repeated auth attempts from the same IP |

### 21. Tracking Exploitation Frameworks

Frameworks like Cobalt Strike, Metasploit, Sliver, and Empire provide attackers with out-of-the-box capabilities for payload generation, C2 communication, lateral movement, and privilege escalation. They exhibit characteristic behaviors: beacon processes with regular callback intervals, shellcode injection into sacrificial processes, named pipe communication (e.g., `\\.\pipe\msagent_*` for Cobalt Strike), and staged payload downloads. While mature attackers customize their tooling, default configurations leave detectable patterns in process creation, network connections, and file drops.

| Event ID | Source | What to Look For |
| :------- | :----- | :--------------- |
| 1 | Sysmon | Process creation — known tool names or suspicious spawning patterns |
| 11 | Sysmon | File creation — payload/shellcode drops in staging directories |
| 3 | Sysmon | Network connections — beaconing patterns to C2 infrastructure |

---

## Hunting Queries

The following queries can be used in ELK (KQL) and Splunk (SPL) to actively hunt for threats. Each query includes an explanation of what it detects and why it matters.

### Detecting Encoded PowerShell Execution

Attackers frequently use Base64-encoded PowerShell commands to obfuscate their payloads and bypass basic string-matching detections. Hunting for `encodedcommand` in process creation events catches this evasion technique.

**ELK (KQL):**

```
winlog.event_id: 4688 AND process.name: "powershell.exe" AND process.command_line: *encodedcommand*
```

**Splunk (SPL):**

```
index=windows EventCode=4688 NewProcessName="*powershell.exe" CommandLine="*encodedcommand*"
| table _time, Computer, ParentProcessName, CommandLine
```

---

### Suspicious Outbound HTTPS Connections

C2 frameworks commonly use port 443 to blend with legitimate HTTPS traffic. Filtering out internal IPs reveals processes making external encrypted connections that warrant investigation.

**ELK (KQL):**

```
winlog.event_id: 3 AND destination.port: 443 AND NOT source.ip: "192.168.0.0/16" AND NOT source.ip: "10.0.0.0/8"
```

**Splunk (SPL):**

```
index=sysmon EventCode=3 DestinationPort=443 NOT SourceIp="192.168.*" NOT SourceIp="10.*"
| stats count by Image, DestinationIp, DestinationPort
| sort -count
```

---

### Detecting Mimikatz Execution

Mimikatz is the de facto credential dumping tool. While sophisticated attackers rename the binary, detecting the original name catches less mature threats and validates that your logging pipeline works.

**ELK (KQL):**

```
winlog.event_id: 1 AND process.name: "mimikatz.exe"
```

**Splunk (SPL):**

```
index=sysmon EventCode=1 Image="*mimikatz*"
| table _time, Computer, User, ParentImage, CommandLine
```

---

### Scheduled Task Creation

Scheduled tasks are a top persistence mechanism. Monitoring task creation helps identify attackers establishing footholds that survive reboots.

**ELK (KQL):**

```
winlog.event_id: 4698
```

**Splunk (SPL):**

```
index=windows EventCode=4698
| table _time, Computer, SubjectUserName, TaskName, TaskContent
```

---

### Registry Run Key Modification

The `CurrentVersion\Run` registry keys execute programs at every logon. Attackers abuse these keys for persistence. Monitoring modifications catches this classic technique.

**ELK (KQL):**

```
winlog.event_id: 13 AND registry.path: *CurrentVersion\\Run*
```

**Splunk (SPL):**

```
index=sysmon EventCode=13 TargetObject="*CurrentVersion\\Run*"
| table _time, Computer, Image, TargetObject, Details
```

---

### Service Installation for Persistence

New service installations with administrative privileges are a common persistence and privilege escalation vector. Most legitimate services are installed during software deployment windows, making out-of-band installations suspicious.

**ELK (KQL):**

```
winlog.event_id: 7045
```

**Splunk (SPL):**

```
index=windows EventCode=7045
| table _time, Computer, ServiceName, ImagePath, ServiceType, StartType
| where StartType="auto start"
```

---

### Lateral Movement via Explicit Credentials

When attackers move laterally, they often authenticate using explicit credentials (e.g., `runas /netonly`). This query surfaces those events, especially targeting high-value accounts.

**ELK (KQL):**

```
winlog.event_id: 4648 AND winlog.event_data.TargetUserName: "Administrator"
```

**Splunk (SPL):**

```
index=windows EventCode=4648 TargetUserName="Administrator"
| stats count by SubjectUserName, TargetServerName, ProcessName
| sort -count
```

---

### Remote Thread Injection into System Processes

Process injection via `CreateRemoteThread` into system processes like `svchost.exe` or `lsass.exe` is a hallmark of advanced malware. Legitimate software rarely creates remote threads in these processes.

**ELK (KQL):**

```
winlog.event_id: 8 AND winlog.event_data.TargetImage: (*svchost.exe OR *lsass.exe)
```

**Splunk (SPL):**

```
index=sysmon EventCode=8 (TargetImage="*svchost.exe" OR TargetImage="*lsass.exe")
| table _time, Computer, SourceImage, TargetImage, StartFunction
```

---

### Brute Force Detection

Multiple failed logons in a short window from the same source strongly indicate brute-force activity. This query aggregates failures to surface offending accounts and machines.

**ELK (KQL):**

```
winlog.event_id: 4625
```

**Splunk (SPL):**

```
index=windows EventCode=4625
| stats count by TargetUserName, IpAddress, WorkstationName
| where count > 10
| sort -count
```

---

### DLL Load from Unusual Paths

Legitimate DLLs load from `System32` or program directories. DLLs loading from `Temp`, `Downloads`, or user profile directories are highly suspicious and may indicate DLL hijacking or sideloading.

**ELK (KQL):**

```
winlog.event_id: 7 AND (file.path: *\\Temp\\* OR file.path: *\\Downloads\\*)
```

**Splunk (SPL):**

```
index=sysmon EventCode=7 (ImageLoaded="*\\Temp\\*" OR ImageLoaded="*\\Downloads\\*")
| table _time, Computer, Image, ImageLoaded, Signed, Signature
| where Signed="false"
```

---

### C2 via DNS - Unusual Query Patterns

DNS is a common exfiltration and C2 channel. Long subdomain strings or queries to known-bad domains indicate DNS tunneling or beaconing. This query helps surface unusual resolution patterns.

**ELK (KQL):**

```
winlog.event_id: 22 AND NOT dns.question.name: (*.microsoft.com OR *.windows.com OR *.windowsupdate.com)
```

**Splunk (SPL):**

```
index=sysmon EventCode=22 NOT QueryName="*.microsoft.com" NOT QueryName="*.windows.com"
| stats count by Image, QueryName
| where count > 50
| sort -count
```

---

### File Deletion in Sensitive Directories

Attackers often delete tools and payloads after execution to evade forensic analysis. Monitoring file deletions in temp or staging directories catches this cleanup behavior.

**ELK (KQL):**

```
winlog.event_id: 23 AND file.path: (*\\Temp\\* OR *\\Windows\\Tasks\\*)
```

**Splunk (SPL):**

```
index=sysmon EventCode=23 (TargetFilename="*\\Temp\\*" OR TargetFilename="*\\Windows\\Tasks\\*")
| table _time, Computer, Image, TargetFilename, User
```

---

### LSASS Memory Access (Credential Dumping)

Direct access to the LSASS process memory is the primary method for credential dumping. Outside of AV/EDR products, very few legitimate tools access LSASS. This is a high-fidelity detection.

**ELK (KQL):**

```
winlog.event_id: 10 AND winlog.event_data.TargetImage: *lsass.exe AND NOT winlog.event_data.SourceImage: (*csrss.exe OR *MsMpEng.exe)
```

**Splunk (SPL):**

```
index=sysmon EventCode=10 TargetImage="*lsass.exe" NOT SourceImage="*csrss.exe" NOT SourceImage="*MsMpEng.exe"
| table _time, Computer, SourceImage, GrantedAccess, CallTrace
| where GrantedAccess="0x1010" OR GrantedAccess="0x1FFFFF"
```

---

### Pass-the-Hash / Kerberos Failures

Repeated Kerberos pre-authentication failures indicate credential stuffing, password spraying, or pass-the-hash attempts. Aggregating by target account reveals which accounts are under attack.

**ELK (KQL):**

```
winlog.event_id: 4771 AND winlog.event_data.Status: "0x18"
```

**Splunk (SPL):**

```
index=windows EventCode=4771 Status="0x18"
| stats count by TargetUserName, IpAddress
| where count > 5
| sort -count
```

---

### Security Log Cleared

Clearing the security log is a strong indicator of an attacker attempting to destroy evidence. This should always trigger an alert in production environments.

**ELK (KQL):**

```
winlog.event_id: 1102
```

**Splunk (SPL):**

```
index=windows EventCode=1102
| table _time, Computer, SubjectUserName, SubjectDomainName
```

---

### Unexpected System Shutdown or Reboot

Unexpected reboots may indicate an attacker restarting a system to load a rootkit, clear volatile memory, or complete a destructive action. Correlating with other suspicious activity adds context.

**ELK (KQL):**

```
winlog.event_id: 1074
```

**Splunk (SPL):**

```
index=windows EventCode=1074
| table _time, Computer, User, Process, Reason
```

---

### WMI Persistence Detection

WMI event subscriptions provide fileless persistence that survives reboots without touching the filesystem. Attackers use WMI filters and consumers to trigger malicious actions on events like user logon or time intervals.

**ELK (KQL):**

```
winlog.event_id: 19 OR winlog.event_id: 20
```

**Splunk (SPL):**

```
index=sysmon (EventCode=19 OR EventCode=20)
| table _time, Computer, EventType, Operation, User, Name, Destination
```

---

### LOLBins Execution from Unusual Parent Processes

Living-off-the-Land Binaries (LOLBins) like `certutil.exe`, `mshta.exe`, `regsvr32.exe`, or `rundll32.exe` are frequently abused by attackers. When these are spawned by unexpected parents (e.g., `outlook.exe`, `winword.exe`), it strongly suggests exploitation or social engineering.

**ELK (KQL):**

```
winlog.event_id: 1 AND process.name: (certutil.exe OR mshta.exe OR regsvr32.exe OR rundll32.exe) AND process.parent.name: (outlook.exe OR winword.exe OR excel.exe)
```

**Splunk (SPL):**

```
index=sysmon EventCode=1 (Image="*certutil.exe" OR Image="*mshta.exe" OR Image="*regsvr32.exe" OR Image="*rundll32.exe") (ParentImage="*outlook.exe" OR ParentImage="*winword.exe" OR ParentImage="*excel.exe")
| table _time, Computer, User, ParentImage, Image, CommandLine
```

---

### Detecting DCSync Attacks

DCSync attacks use directory replication privileges to extract password hashes from domain controllers. Monitoring for replication requests from non-DC machines is critical for detecting this technique.

**ELK (KQL):**

```
winlog.event_id: 4662 AND winlog.event_data.Properties: *1131f6ad*
```

**Splunk (SPL):**

```
index=windows EventCode=4662 Properties="*1131f6ad*"
| table _time, SubjectUserName, ObjectName, Computer
| where NOT Computer IN ("DC01", "DC02")
```

---

### Named Pipe Abuse for C2 Communication

Cobalt Strike and other frameworks use named pipes for inter-process communication and beaconing. Unusual pipe names (especially those matching known patterns like `msagent_*` or `MSSE-*`) are strong indicators of compromise.

**ELK (KQL):**

```
winlog.event_id: 17 AND winlog.event_data.PipeName: (\\msagent* OR \\MSSE-* OR \\postex* OR \\status_*)
```

**Splunk (SPL):**

```
index=sysmon EventCode=17 (PipeName="\\msagent*" OR PipeName="\\MSSE-*" OR PipeName="\\postex*" OR PipeName="\\status_*")
| table _time, Computer, Image, PipeName, User
```

---

> The combination of Windows Security Events and Sysmon telemetry provides layered visibility into attacker behavior. Deploy Sysmon with a well-tuned configuration (such as [SwiftOnSecurity's sysmon-config](https://github.com/SwiftOnSecurity/sysmon-config)) and forward events to your SIEM to operationalize these hunting techniques.
