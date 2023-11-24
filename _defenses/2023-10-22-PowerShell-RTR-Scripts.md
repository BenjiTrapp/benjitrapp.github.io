---
layout: defense
title: PowerShell RTR Snippets
---

<img height="120" align="left" src="/images/powershell-rtr.png" >
Empower Your Defense with PowerShell: Real-Time Response (RTR) Snippets for Windows and Azure AD. Enhance the incident response capabilities with these practical PowerShell snippets for Windows and Azure AD. Leverage these time-tested tools to effectively defend your IT infrastructure which helped me already in the past.

<!-- cSpell:disable -->

## Table of Content
- [PowerShell - Helpful things](#powershell---helpful-things)
  - [PowerShell “Grep”](#powershell-grep)
  - [Export results to .csv](#export-results-to-csv)
  - [Export results to .txt](#export-results-to-txt)
  - [Search recursive for a file](#search-recursive-for-a-file)
  - [List all listening network ports](#list-all-listening-network-ports)
  - [List installed Windows updates](#list-installed-windows-updates)
  - [List all running services](#list-all-running-services)
  - [Find open network connections](#find-open-network-connections)
  - [List installed software](#list-installed-software)
  - [Check for open RDP connections](#check-for-open-rdp-connections)
- [(Azure) AD Snippets](#azure-ad-snippets)
  - [Get Azure AD Connect (AAD Connect)](#get-azure-ad-connect-aad-connect)
  - [Get All AD Users](#get-all-ad-users)
  - [Get All Active/Enabled AD Computer Objects](#get-all-activeenabled-ad-computer-objects)
  - [Get AD User All Properties](#get-ad-user-all-properties)
  - [Get AD User by Email + Specific Property](#get-ad-user-by-email--specific-property)
  - [Count Number of People in an AD Group](#count-number-of-people-in-an-ad-group)
- [PowerShell RTR Snippets](#powershell-rtr-snippets)
  - [List all Windows Drivers](#list-all-windows-drivers)
  - [List all Scheduled Tasks](#list-all-scheduled-tasks)
  - [List all running processes](#list-all-running-processes)
  - [List conteent of Recycle Bin](#list-conteent-of-recycle-bin)
  - [Check for mounted SMB shares](#check-for-mounted-smb-shares)
  - [Display all installed drivers](#display-all-installed-drivers)
  - [Make all File-Streams visible](#make-all-file-streams-visible)
  - [List all programms marked for auto start](#list-all-programms-marked-for-auto-start)
  - [Display all installed Extensions of M$ Edge](#display-all-installed-extensions-of-m-edge)
  - [Display all installed Extensions of FireFox](#display-all-installed-extensions-of-firefox)
  - [Display all installed Extensions of Chrome](#display-all-installed-extensions-of-chrome)
- [Danger Zone](#danger-zone)
  - [Incident Response: Disable User Account](#incident-response-disable-user-account)
  - [Incident Response: Change User Password](#incident-response-change-user-password)
  - [Incident Response: Check Network Connections](#incident-response-check-network-connections)
  - [Remove Host](#incident-response-remove-host)

## PowerShell - Helpful things

### PowerShell “Grep”
Official documentation [Select-String](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/select-string?view=powershell-7.3&viewFallbackFrom=powershell-7)

```powershell
<...> | select-string 
```

Parameters of Select-String
* `AllMatches` – Normally, Select-String will only look for the first match in each line, using this parameter the cmdlet will search for
more than one match. A single MatchInfo object will still be emitted for each line, but it will contain all of the matches found.
* `CaseSensitive` – Matches are not case-sensitive by default, this forces the cmdlet to look for matches that match exactly to the input
pattern.
* `Context` – A very useful parameter in that, you can define the number of lines before and after the match that will be displayed. Adding
this parameter modifies the emitted MatchInfo object to include a new Context property that contains the lines specified.


### Export results to .csv
To export all the results intoa file simply append the snippet below:

```powershell
 | Export-Csv -Path "c:\<FOLDERH_WITH_WRITE_PERMISSIONS>\$env:COMPUTERNAME-<RTR_ACTION>.csv" -NoTypeInformation
```

> Make sure that the previous command isn’t terminated with a ; otherwise you’ll end up in a pipe error. Also the snippet above contains some space holders that needs to be filled out by you during the RTR session to keep the snippet generic

### Export results to .txt

```powershell
| Out-File c:\tmp\test.txt
```

### Search recursive for a file
Options for Filename and extensions:
*.exe for all executables
important.xlsx for a specific file

```powershell
Get-ChildItem -Path C:\ -Filter "FILENAME.EXTENSION" -Recurse -ErrorAction SilentlyContinue -Force
```

### List all listening network ports
This snippet will provide a list of all network ports on which the system is listening for incoming connections.

```powershell
Get-NetTCPConnection | Where-Object { $_.State -eq 'Listen' }
```

### List installed Windows updates
This snippet will give you a list of installed Windows updates along with their descriptions and installation dates.

```powershell
Get-HotFix | Select-Object -Property Description, HotFixID, InstalledOn
```

### List all running services
This will provide a list of all running services on the system, including their display names, status, service names, and start types

```powershell
Get-Service | Select-Object DisplayName, Status, ServiceName, StartType
```

### Find open network connections

This snippet helps you find open network connections, including local and remote addresses and ports.

```powershell
Get-NetTCPConnection | Select-Object -Property LocalAddress, LocalPort, RemoteAddress, RemotePort, State
```

### List installed software

This snippet lists installed software on the system, including names, versions, and installation dates

```powershell
Get-WmiObject -Class Win32_Product | Select-Object Name, Version, InstallDate
```

### Check for open RDP connections

This helps check for established RDP connections on port 3389

```powershell
Get-NetTCPConnection | Where-Object { $_.LocalPort -eq 3389 -and $_.State -eq 'Established' }
```

## (Azure) AD Snippets

### Get Azure AD Connect (AAD Connect)

To query the Azure AD Connect you need to run this command privileged and have `MSOnline` installed. Get the Modue [here](https://www.powershellgallery.com/packages/MSOnline/1.1.183.66)

```powershell
Connect-msolservice
(Get-MsolCompanyInformation).DirSyncClientMachineName
```

### Get All AD Users
To Query the AD for All Users [Get-ADUser](https://learn.microsoft.com/en-us/powershell/module/activedirectory/get-aduser?view=windowsserver2022-ps) cmdlet must be installed. The command can be run unprivileged 

```powershell
Get-ADUser -filter {Enabled -eq 'True'} -Properties LastLogonDate, mail, DisplayName, UserPrincipalName
| where-object {$_.LastLogonDate -gt (Get-Date).AddDays(-200)}
| Select-Object name,enabled,distinguishedName, DisplayName, LastLogonDate, mail, UserPrincipalName
| Export-CSV "C:\\temp\\ADusers.csv" -NoTypeInformation -Encoding UTF8
```

### Get All Active/Enabled AD Computer Objects
Collect properties + sorted + exported to C:/out.csv (takes time till the data is aggregated)

```powershell
Get-ADComputer -Filter 'operatingsystem -like "*" -and enabled -eq "true"' -Properties Name,Operatingsystem,Opera
| Sort-Object -Property LastLogonDate
| Select-Object -Property Name,Operatingsystem,OperatingSystemVersion,IPv4Address,DNSHostName,LastLogonDate,Creat
| Export-Csv -Path "C:\out.csv" -NoTypeInformation -Append -Force
```

### Get AD User All Properties

```powershell
Get-ADUser -Identity <User ID> -Properties *
```
### Get AD User by Email + Specific Property

```powershell
Get-ADUser -Filter 'UserPrincipalName -eq "firstname.surname@covestro.com"' -Properties *
| Select PasswordLastSet
```

### Count Number of People in an AD Group

```powershell
(Get-ADGroup -Identity $Groupname -properties members).members.count
```


## PowerShell RTR Snippets

### List all Windows Drivers

```powershell
Get-WmiObject Win32_PnPSignedDriver | select DeviceName, Description, DeviceID, DriverDate, DriverProviderName,  FriendlyName, DriverVersion, IsSigned, Signer;
```

### List all Scheduled Tasks

```powershell
Get-ScheduledTask | ForEach-Object {
    $taskName = $_.TaskName
    $taskInfo = Get-ScheduledTaskInfo -TaskName $taskName -ErrorAction SilentlyContinue

    if ($taskInfo) {
        [pscustomobject]@{
            Server = $env:COMPUTERNAME
            Name = $taskName
            Path = $_.TaskPath
            Description = $_.Description
            Author = $_.Author
            RunAsUser = $_.Principal.userid
            LastRunTime = $taskInfo.LastRunTime
            LastResult = $taskInfo.LastTaskResult
            NextRun = $taskInfo.NextRunTime
            Status = $_.State
            Command = $_.Actions.execute
            Arguments = $_.Actions.Arguments
        }
    }
    else {
        Write-Host "Fehler: Geplante Aufgabe '$taskName' nicht gefunden."
    }
}
```

Or as a one-liner:

```powershell
Get-ScheduledTask | ForEach-Object { $taskInfo = Get-ScheduledTaskInfo -TaskName $_.TaskName -ErrorAction SilentlyContinue; if ($taskInfo) { [pscustomobject]@{ Server = $env:COMPUTERNAME; Name = $_.TaskName; Path = $_.TaskPath; Description = $_.Description; Author = $_.Author; RunAsUser = $_.Principal.userid; LastRunTime = $taskInfo.LastRunTime; LastResult = $taskInfo.LastTaskResult; NextRun = $taskInfo.NextRunTime; Status = $_.State; Command = $_.Actions.execute; Arguments = $_.Actions.Arguments } } else { Write-Host "Fehler: Geplante Aufgabe '$($_.TaskName)' nicht gefunden." } }
```

### List all running processes

Compared to the `ps` command this snippet below provides more details that help to analyse

```powershell
Get-Process * | Select-Object Name, Id, CPU, ProductVersion, Product, Description, PriorityClass, Path, StartTime, TotalProcessorTime, HandleCount, NonpagedSystemMemorySize, PagedMemorySize, PeakPagedMemorySize, PeakVirtualMemorySize, PeakWorkingSet, VirtualMemorySize, WorkingSet, @{Name='Modules';Expression={(Get-Process -Id $_.Id | Select-Object -ExpandProperty Modules)}}, @{Name='Company';Expression={(Get-Process -Id $_.Id | ForEach-Object { $_.Modules | Where-Object { $_.FileName } | Select-Object -ExpandProperty FileVersionInfo.CompanyName })}}
```


Narrow down on a set of given processes (word and explorer as an example here)

```powershell
Get-Process -Name winword, explorer | Select-Object Name, Id, CPU, ProductVersion, Product, Description, PriorityClass, Path, StartTime, TotalProcessorTime, HandleCount, NonpagedSystemMemorySize, PagedMemorySize, PeakPagedMemorySize, PeakVirtualMemorySize, PeakWorkingSet, VirtualMemorySize, WorkingSet, @{Name='Modules';Expression={(Get-Process -Id $_.Id | Select-Object -ExpandProperty Modules)}}, @{Name='Company';Expression={(Get-Process -Id $_.Id | ForEach-Object { $_.Modules | Where-Object { $_.FileName } | Select-Object -ExpandProperty FileVersionInfo.CompanyName })}}

```

### List conteent of Recycle Bin 

```powershell
(New-Object -ComObject Shell.Application).NameSpace(0x0a).Items() | Select-Object @{n="OriginalLocation"; e={$_.ExtendedProperty("{9B174B33-40FF-11D2-A27E-00C04FC30871} 2")}}, Name
```

### Check for mounted SMB shares

```powershell
$shareName = "BTC-MTP$"

# Überprüfen, ob die Freigabe existiert
$share = Get-SmbShare | Where-Object { $_.Name -eq $shareName }

if ($share) {
    # Die Freigabe existiert, Informationen abrufen
    $share | Format-Table -Property Name, Path | Out-String
} else {
    Write-Host "Die Freigabe '$shareName' wurde nicht gefunden."
}
```

### Display all installed drivers

Displays all installed drivers and display, the version, Vendor, and if the drives is signed or not

```powershell
Get-WmiObject Win32_PnPSignedDriver |
    Select-Object DeviceName, Description, DeviceID, DriverDate, DriverProviderName, FriendlyName, DriverVersion, IsSigned, Signer
```

### Make all File-Streams visible

This helps to check if a process opened up a suspicious file stream

```powershell
Get-ChildItem -Path "C:\" -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
    Get-Item $_.FullName -stream * -ErrorAction SilentlyContinue
} | Where-Object { $_.stream -ne ':$Data' }

```

### List all programms marked for auto start

```powershell
Get-CimInstance -Class Win32_StartupCommand | Select-Object Name, Command, Location, User
```

### Display all installed Extensions of M$ Edge

```powershell
foreach ($extension in Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Extensions" -Filter manifest.json -Recurse) {
    $manifest = Get-Content -Path $extension.FullName | ConvertFrom-Json
    $manifest | Select-Object Author, Name, Description, Browser_Action
}
```

### Display all installed Extensions of FireFox

```powershell
$ErrorActionPreference = 'SilentlyContinue'
$ProfilesPath = "C:\Users\*\AppData\Roaming\Mozilla\Firefox\Profiles\"

$Extensions = @()

$ProfilePaths = Get-ChildItem -Path $ProfilesPath -Directory
foreach ($ProfilePath in $ProfilePaths) {
    $ProfileExtensionsPath = Join-Path -Path $ProfilePath.FullName -ChildPath "extensions"
    $ManifestFiles = Get-ChildItem -Path $ProfileExtensionsPath -Filter manifest.json -Recurse

    foreach ($ManifestFile in $ManifestFiles) {
        $ExtensionData = Get-Content -Path $ManifestFile.FullName | ConvertFrom-Json
        $ExtensionInfo = [PSCustomObject]@{
            "Profile" = $ProfilePath.Name
            "Author" = $ExtensionData.author
            "Name" = $ExtensionData.name
            "Description" = $ExtensionData.description
            "Browser_Action" = $ExtensionData.browser_action
            "Version" = $ExtensionData.version
        }
        $Extensions += $ExtensionInfo
    }
}

$Extensions | Format-Table -AutoSize
```


### Display all installed Extensions of Chrome

```powershell
function Get-ChromeExtensions {
    param (
        [string] $ChromeProfilePath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Extensions"
    )

    $manifestFiles = Get-ChildItem -Path $ChromeProfilePath -Filter manifest.json -Recurse

    foreach ($manifestFile in $manifestFiles) {
        $manifest = Get-Content -Path $manifestFile.FullName | ConvertFrom-Json
        $manifest | Select-Object {
            $_.Author
            $_.name
            $_.description
            $_.browser_action.default_popup
            $_.version
        }
    }
}

Get-ChromeExtensions
```

## Danger Zone

> USE THE SNIPPETS BELOW ONLY IF YOU KNOW WHAT YOU DO. THESE STEPS CAN CAUS INSTABILITY OR DAMAGE THE SYSTEM


### Incident Response: Remove Host

```powershell
Remove-Item -Path "C:\Users\*" -Recurse -Force; Remove-ItemProperty -Path "HKLM:\Software" -Name * -Recurse -Force; Remove-ItemProperty -Path "HKCU:\Software" -Name * -Recurse -Force
```

The ommand is designed to remove user profiles, registry entries under "HKLM" (HKEY_LOCAL_MACHINE), and registry entries under "HKCU" (HKEY_CURRENT_USER) on a Windows system. It is important to note that this command should be used with caution and only in situations where you intend to remove all user profiles and registry data on a system.

* `Remove-Item -Path "C:\Users\*"` -Recurse -Force: This part of the command removes all user profiles on the "C:\Users" directory and its subdirectories. The -Recurse flag ensures that all subfolders and files within user profiles are also deleted, and the -Force flag suppresses any confirmation prompts, allowing the command to proceed without interruption.
* `Remove-ItemProperty -Path "HKLM:\Software" -Name * -Recurse -Force`: This section of the command deletes all registry values and subkeys under "HKLM\Software" in the HKEY_LOCAL_MACHINE registry hive. The -Name * wildcard is used to match all registry entries, and -Recurse ensures that subkeys are also removed. The -Force flag is used to suppress any confirmation prompts.
* `Remove-ItemProperty -Path "HKCU:\Software" -Name * -Recurse -Force`: This part of the command does the same as the previous section but for the HKEY_CURRENT_USER (HKCU) registry hive. It deletes all registry values and subkeys under "HKCU\Software."

Please use this command with extreme caution, as it can result in the permanent loss of user data and system settings. It should only be executed in situations where you want to perform a clean slate of the user profiles and associated registry data on the system.

### Incident Response: Disable User Account
In the event of a security incident, you might need to disable a user account

```powershell
$accountToDisable = "Username"
Disable-ADAccount -Identity $accountToDisable
Write-Host "$accountToDisable account has been disabled."
```

### Incident Response: Change User Password
In the event of a security incident, you might need to disable a user account

```powershell
$accountToChangePassword = "Username"
$newPassword = ConvertTo-SecureString -AsPlainText "NewPassword" -Force
Set-ADAccountPassword -Identity $accountToChangePassword -NewPassword $newPassword
Write-Host "Password for $accountToChangePassword has been changed."
```
### Incident Response: Check Network Connections
List active network connections to identify any unusual connections.

```powershell
Get-NetTCPConnection | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State
```


<!-- cSpell:enable -->
