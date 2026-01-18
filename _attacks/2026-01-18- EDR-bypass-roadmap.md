---
layout: attack
title: The EDR Bypass Roadmap: Technical Evolution & API Subversion
---

<img height="150" align="left" src="/images/edr-bypass-timeline.png"> The battle for the endpoint is won or lost in telemetry. This has been increasingly recognised by the security community, with projects such as [EDR Telemetry](https://www.edr-telemetry.com/) aiming to systematically compare and improve EDR visibility.  

This timeline breaks down the evolution of evasion—from early Windows API abuse to modern hardware- and behavior-level subversion—mapped against the **MITRE ATT&CK®** framework and aligned with my research into [**Windows APIs**](https://benjitrapp.github.io/attacks/2024-06-07-red-windows-api/) and [**ETW (Event Tracing for Windows)**](https://benjitrapp.github.io/defenses/2024-02-11-etw/).

---

## Phase 1: The Foundation (2010–2015)
**Strategy:** Exploiting trust by utilizing legitimate Windows mechanisms for code placement.

### 2012–2013: Injection Primitives & API Abuse

Early EDR solutions primarily monitored **high-level Windows APIs** with limited context or correlation. This made classic injection primitives highly effective, particularly when combined with trusted parent processes.

Common techniques included:

- **Classic DLL Injection**
  - `OpenProcess`
  - `VirtualAllocEx`
  - `WriteProcessMemory`
  - `CreateRemoteThread`

These APIs are discussed in detail in my [Windows API offensive overview](https://benjitrapp.github.io/attacks/2024-06-07-red-windows-api/), where their abuse patterns and detection blind spots are broken down.

- **Process Hollowing (RunPE)**
- **Manual DLL Mapping**
  - Avoiding Import Address Table (IAT) hooks
  - Bypassing loader-based telemetry

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

Stephen Fewer’s **Reflective DLL Loading** introduced a new paradigm: executing DLLs without invoking the Windows loader. By avoiding `LoadLibrary`, attackers could bypass many API hooks and loader callbacks.

While still heavily used in modern C2 frameworks, reflective loading has increasingly shifted toward:
- Position Independent Code (PIC)
- Shellcode-only loaders

This evolution mirrors the detection trends discussed in the Windows API series above.

---

## Phase 2: The Hooking Wars (2015–2017)
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

- Detecting hooks by comparing in-memory vs. on-disk bytes
- Loading clean DLL copies
- Restoring original syscall stubs

- **Manual Unhooking**  
  Overwriting hooked `.text` sections with clean bytes.

```cpp
// Example: Overwriting ntdll hooks with a clean buffer
DWORD oldProtect;

VirtualProtect(pNtOpenProcess, 5, PAGE_EXECUTE_READWRITE, &oldProtect);
memcpy(pNtOpenProcess, "\x4c\x8b\xd1\xb8\x26", 5); // Original bytes
VirtualProtect(pNtOpenProcess, 5, oldProtect, &oldProtect);
```

---

## Phase 3: The Syscall Revolution (2017–2019)
**Strategy:** Bypassing the hooked middleman (`ntdll.dll`) entirely.

### 2017: Direct Syscalls

Direct syscalls removed EDR visibility by transitioning directly to kernel mode, bypassing all userland hooks.

- **Direct Syscalls ([T1106](https://attack.mitre.org/techniques/T1106/))**

```asm
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

---

## Phase 4: Indirect Syscalls & Stack Integrity (2019–2021)
**Strategy:** Preserving legitimate execution context.

As EDRs began analysing call stacks, indirect syscalls ensured execution appeared to originate from trusted modules.

- ROP/JOP syscall gadgets
- Stack pivoting
- Return address spoofing

These techniques laid the groundwork for modern call stack spoofing and sleep obfuscation.

---

## Phase 5: The ETW & Memory Evasion Era (2020–2022)
**Strategy:** Blinding telemetry pipelines.

As defenders shifted toward [**ETW**](https://benjitrapp.github.io/defenses/2024-02-11-etw/), attackers responded with:

- Provider patching
- Session hijacking
- Trace tampering

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

- **Vectored Exception Handling (VEH)**  
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

---

## Technical Summary & API Matrix

| Phase | Technique | API Cross-Reference | MITRE TID |
|------|----------|--------------------|-----------|
| **Foundation** | Process Injection | `CreateRemoteThread`, `WriteProcessMemory` | T1055 |
| **Hooking** | DLL Unhooking | `NtOpenProcess` | T1055.001 |
| **Syscalls** | Direct / Indirect | `NtAllocateVirtualMemory` | T1106 |
| **Tracing** | ETW Patching | `EtwEventWrite` | T1562.006 |
| **Modern** | VEH Execution | `AddVectoredExceptionHandler` | T1562.001 |

---

## Conclusion

EDR bypass research has consistently demonstrated one truth: **visibility gaps define opportunity**. As detection shifts from APIs to behavior, and from userland to kernel and hardware, attackers adapt by abusing trust, context, and execution semantics.

Understanding this evolution—grounded in Windows internals and telemetry design—is essential for both red teams and defenders navigating the modern endpoint arms race.
