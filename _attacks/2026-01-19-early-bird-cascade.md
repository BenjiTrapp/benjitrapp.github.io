---
layout: attack
title: Early Bird & Early Cascade Injection
---

<img height="150" align="left" src="/images/early-logo.png"> Modern Endpoint Detection & Response (EDR) products rely heavily on user‑mode API hooking to monitor process behavior. However, there is a critical window during process initialization where these hooks are not yet active. Adversaries exploit this by using "early" injection techniques to execute code before the security instrumentation can initialize.

This article examines two significant methods for achieving this: the classic **Early Bird Injection** and the more advanced **Early Cascade Injection**.

**Related posts in this blog:** [Understanding and Attacking EDRs](https://benjitrapp.github.io/attacks/2024-08-21-edr-and-malware/) | [Detecting EDR Hooks](https://benjitrapp.github.io/attacks/2026-06-19-edr-hook-detection/) | [EDR Bypass Roadmap](https://benjitrapp.github.io/attacks/2026-01-18-EDR-bypass-roadmap/) | [Hell's Gate, Heaven's Gate & Tartarus Gate](https://benjitrapp.github.io/attacks/2026-01-19-hells-heaven-tartarus-gate/) | [Threadless Injection & Process Ghosting](https://benjitrapp.github.io/attacks/2026-05-17-threadless-injection-process-ghosting/) | [ETW-TI Deep Dive](https://benjitrapp.github.io/defenses/2026-06-19-etw-ti/)


## Early Bird Injection

Early Bird Injection is a stealthy variation of [Asynchronous Procedure Call (APC)](https://learn.microsoft.com/en-us/windows/win32/sync/asynchronous-procedure-calls) injection. It targets a process in its infancy to ensure the malicious payload runs before the EDR's user-mode hooks are in place.

![](/images/EarlyBirdFlow.jpg)

### Core Idea

The technique exploits the state of a process created with the `CREATE_SUSPENDED` flag. Because the main thread has not yet started, it provides a perfect environment to stage an APC.

1. **Create Suspended Process:** A legitimate process, such as `svchost.exe`, is started in a suspended state.
2. **Allocate & Write:** Memory is allocated in the target process, and the shellcode is written to that space.
3. **Queue APC:** The `QueueUserAPC` function points the main thread to the shellcode. API is also discussed [here](https://benjitrapp.github.io/attacks/2024-06-07-red-windows-api/#queueuserapc)
4. **Resume Thread:** When the thread resumes, the system triggers the APC immediately, executing the malicious code before the thread reaches its original entry point.

This technique has been used by several malware families, including **TurnedUp** (APT33), **Carberp**, and **DorkBot**.

## Early Cascade Injection

Developed by Outflank, **Early Cascade Injection** is a novel evolution designed to be even stealthier than Early Bird. While Early Bird relies on suspicious APC queuing, Early Cascade integrates into the natural DLL loading flow of a process.

![](/images/EarlyCascadeFlow.png)

### Core Idea

Early Cascade targets the `LdrInitializeThunk` function in `ntdll.dll`. This function is responsible for initializing the process environment and loading essential DLLs.

1. **Intercept LdrInitializeThunk:** The technique hooks or manipulates the `LdrLoadDll` function during the initialization phase.
2. **DLL Load Cascade:** The malicious code or DLL is injected as part of the normal module loading process.
3. **Bypass EDR Initialization:** Most EDRs initialize their hooks after `kernel32.dll` and `kernelbase.dll` are loaded. Early Cascade strikes before this point.

By avoiding cross-process APCs and minimizing remote interaction, this technique blends in with legitimate process startup behavior.

## Quick Comparison

| Feature | Early Bird Injection | Early Cascade Injection |
|:---|:---|:---|
| **MITRE ATT&CK** | [T1055.004](https://attack.mitre.org/techniques/T1055/004/) (APC Injection) | [T1055](https://attack.mitre.org/techniques/T1055/) (Process Injection) |
| **Primary Mechanism** | Queues an APC to a suspended thread | Intercepts `LdrInitializeThunk` |
| **Remote Interaction** | Uses `QueueUserAPC` (higher risk) | Minimizes remote interaction |
| **Stealth Strategy** | Executes before main thread | Blends with DLL loading cascade |
| **Common Use** | APTs and banking trojans | Red Team tools (Outflank C2, ShovelNG) |

## Defensive Relevance

Both techniques exploit the fact that EDR hooks are installed **after** process initialization completes. This means user-mode hook detection (as described in the [EDR Hook Detection Scanner](https://benjitrapp.github.io/attacks/2026-06-19-edr-hook-detection/)) will show hooks are present in steady-state -- but the injected code already executed before those hooks were active.

Detecting these techniques requires visibility beyond standard user-mode hooks. Defenders should implement:

* **Kernel-mode Monitoring:** Monitor DLL load sequences and early-stage thread activity from the kernel. The [ETW-TI provider](https://benjitrapp.github.io/defenses/2026-06-19-etw-ti/) fires `EtwTiLogAllocExecVm` and `EtwTiLogReadWriteVm` events from kernel callbacks regardless of hook state -- catching the `VirtualAllocEx` + `WriteProcessMemory` calls that both techniques require.
* **Behavioral Analysis:** Baselining process startup to detect unusual patterns, such as `CREATE_SUSPENDED` followed by memory allocation and APC queuing.
* **Memory Scanning:** Scanning for anomalous modules or shellcode that may have been loaded during the initialization phase.
* **Process Creation Callbacks:** `PsSetCreateProcessNotifyRoutineEx` fires before user-mode initialization begins, giving kernel-mode EDR components early visibility into the spawned process.

## References

* Outflank: [Introducing Early Cascade Injection](https://outflank.nl/blog/2024/10/15/introducing-early-cascade-injection/) 
* Outflank: [EarlyCascade Extension and More](https://outflank.nl/blog/2024/11/07/earlycascade-extension-and-more/)
* Cyberbit: [New 'Early Bird' Code Injection Technique Discovered](https://www.cyberbit.com/blog/endpoint-security/new-early-bird-code-injection-technique-discovered/)
* xbzon.sh: [Mythic C2 with EarlyBird Injection](https://xbzon.sh/posts/mythic-earlybird/)
* Red Team Notes: [Early Bird APC Queue Injection](https://www.ired.team/offensive-security/code-injection-process-injection/early-bird-apc-queue-injection)


