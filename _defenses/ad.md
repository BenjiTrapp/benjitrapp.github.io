# CCDC Notes
**Log Review Cheatsheet**
[Critical Log Review Checklist for Security Incidents](https://zeltser.com/security-incident-log-review-checklist/)

**Hardening GPO Reference**
[UT Windows Hardening Checklist](https://security.utexas.edu/os-hardening-checklist/windows-r2)

**CLI**
[Windows Command Line Cheat Sheet](https://wiki.sans.blue/Tools/pdfs/windows-command-line-sheet.pdf)
[PowerShell Cheat Sheet](https://wiki.sans.blue/Tools/pdfs/PowerShellCheatSheet_v41.pdf)

## Report Resources
incident report form: https://www.sans.org/media/score/incident-forms/IH-Identification.pdf
change report form: https://www.pvamu.edu/its/wp-content/uploads/sites/46/change-management-request-form_fill.pdf

## Windows Endpoint Checklist
Priority|Task|Method|Procedure
--|--|--|--|
High|Enable host-based firewalls|GUI|wf.msc > RClick Windows Advanced... > Properties > ON
High|Reset default passwords for AD user accounts|CLI/Script|`Set-ADAccountPassword`/[Script Reset password for all specified users](https://gallery.technet.microsoft.com/scriptcenter/Reset-password-for-all-412fbc72)
High|Reset local admin passwords|CLI|`net user <user> <pass>`
High|Install important patches|GUI|Windows Update
High|Deploy vendor endpoint protection|GUI|Windows Defender, AppLocker, etc.
Medium|Disable SMBv1|GUI|[Detect Enable and Disable SMB versions in windows](https://support.microsoft.com/en-us/help/2696547/how-to-detect-enable-and-disable-smbv1-smbv2-and-smbv3-in-windows-and)
Medium|Begin regular monitoring with TCPView, Process Explorer, Regmon, or scheduled tasks|GUI|Sysinternals
Medium|Disable Unnecessary Services|CLI/GUI|start with `netstat -anob`/resmon.exe
Medium|Manage host-based firewalls via policy|GUI|[Managing Windows Firewall with GPOs](https://itconnect.uw.edu/wares/msinf/ous/guide/firewallgpo/)
Low|Deploy sysmon|GUI|[Sysinternals Sysmon suspicious activity guide – Windows Security](https://blogs.technet.microsoft.com/motiba/2017/12/07/sysinternals-sysmon-suspicious-activity-guide/)
Low|Deploy centralized Windows logging|GUI|WEFFLES
Low|Custom audit configurations|GPO|Google it
Low|Configure LAPS for local admin passwords|GUI|[Microsoft LAPS](https://technet.microsoft.com/en-us/mt227395.aspx)

## Considerations
- Service/software inventory: which ports are used? is software up to date? is it securely configured?
- Network and local user inventory: are network accounts being used across multiple assets? 
- System inventory: are new systems appearing? are current systems reachable?

## Powershell/Windows Shell

### List Firewall Rules
#### Get all rules beginning with a string
`Get-NetFirewallRule -DisplayGroup Remote*` 

#### Get all inbound rules beginning with a string
`Get-NetFirewallRule -Action Allow -Enabled False -Direction Inbound -DisplayGroup Network* | select DisplayName, DisplayGroup`

### User Account Administration
#### Change AD user account password:
`Set-ADAccountPassword -Identity <sAMAccountName> -Reset -NewPassword <password>`

#### Change local user account password:
`net user <username> <newpass>`

### Active Directory
#### Create GPO report:

```powershell
Import-Module ActiveDirectory
Import-Module GroupPolicy

# identify the DC
$dc = Get-ADDomainController -Discover -Service PrimaryDC

# use this to generate HTML report for single GPO
Get-GPOReport -Name "A Group Policy Object" -Domain awesome.lab -Server $dc -ReportType HTML -Path C:\Users\Person\Desktop\GPOreport.html

# use this to generate HTML report for all GPOs in the domain
Get-GPOReport -All -Domain awesome.lab -Server $dc -ReportType HTML -Path C:\Users\Person\Desktop\AllGPOreport.html
```

### Event Logs
### Display local event logs 
`eventquery.vbs | more`
`eventquery.vbs /L Security | more`

### Search for a specific event ID
`wevtutil qe security /q:”*[System[(EventID=1102)]]” /c:5 /f:text /rd:true`

>/q: Specifies the query. The only thing you really need to change in here is the EventID, just replace it for the one you want. You can use truth operators in here as well as query specific alert levels.
>/c: specifies the number of events to display. (If you place nothing here, it will find all matching events)
>/f: Specifies the output type, by default it uses XML which can be difficult to read.
>/rd: This takes True or False. Set this to true in order to see the newest logs first.

### Services, Processes, and Ports
#### List running processes and output to file
tasklist > c:\processes.txt

#### wmic query examples from stack overflow
```bash
# Name and account for all services:
wmic service get name,startname

# started services only:
wmic service where started=true get  name, startname

# services with specific pattern in name:
wmic service where 'name like "%sql%"' get  name, startname

# nicely formatted as html table (and then opened in your browser):
(wmic service where 'name like "%sql%"' get  name, startname /format:htable >out.html) && out.html

# Full syntax here: https://msdn.microsoft.com/en-us/library/aa394531%28v=vs.85%29.aspx
```


#### List listening ports/connections, PIDs, files responsible
`netstat -anob`

#### Resource monitor
**resmon.exe** - the above plus process names and firewall rule status for the service/application

### File Integrity
Computes the cryptographic hash of a given file. Algorithms are: MD2 MD4 MD5 SHA1 SHA256 SHA384 SHA512.
`certutil -hashfile C:\path\to\file SHA256`

## Nix Handy Stuff
`netstat -tunapl` - listening ports and processes
`ps auxf` - process tree view
`cat /etc/passwd` - list users