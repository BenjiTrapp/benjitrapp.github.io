---
layout: post
title: "MostShittyEDR: Building a Terrible EDR to Learn Bypassing"
---

<img height="150" align="left" src="/MostShittyEDR/static/logo.png"> Endpoint Detection and Response tools are the closest thing the blue team has to omniscience. They sit inside every process, tap into the kernel, and watch every syscall. And yet red teamers bypass them every day. The fastest way to understand why is to build one yourself, deliberately badly, and then try to break it. That is exactly what MostShittyEDR is: an intentionally vulnerable EDR written in Nim that runs both as a user mode agent and, optionally, with a full kernel driver that provides real time process callbacks, LSASS handle protection, and hardware enforced kill.

The project has grown into a full challenge platform with **42 challenges across 11 categories**, spanning everything from trivial blacklist renames all the way to BYOVD kernel attacks and IOCTL abuse.

- [What is an EDR?](#what-is-an-edr)
- [How EDRs Work Under the Hood](#how-edrs-work-under-the-hood)
- [MostShittyEDR: Dual Mode Architecture](#mostshittyedr-dual-mode-architecture)
- [Detection Rules and Their Weaknesses](#detection-rules-and-their-weaknesses)
- [Kernel Driver Mode](#kernel-driver-mode)
- [The Challenge Lab](#the-challenge-lab)
- [Challenge Categories](#challenge-categories)
- [Quick Start](#quick-start)
- [Further Reading](#further-reading)

## What is an EDR?

An EDR is an agent that runs on a host and watches everything: processes created, commands executed, files touched, network connections opened, and memory allocated. Unlike a classic antivirus that checks files against a signature database, an EDR correlates behavior across time to catch threats that have never been seen before.

<pre class="mermaid">
graph TD
    A[Process created] --> B[EDR intercepts]
    B --> C{Detection Logic}
    C --> D[Process name blacklist]
    C --> E[Command line keywords]
    C --> F[Behavioral heuristics]
    C --> G[API hook telemetry]
    C --> H[ETW events]
    D --> I{Verdict}
    E --> I
    F --> I
    G --> I
    H --> I
    I --> J[Block and kill]
    I --> K[Alert only]
    I --> L[Allow]
</pre>

The four core building blocks of any commercial EDR are:

| Component | Role |
|-----------|------|
| Agent | Coordinator running on the endpoint, in user mode or with a kernel driver |
| Sensors | Kernel callbacks, API hooks, ETW providers |
| Telemetry | Raw event stream sent to the cloud backend |
| Detection logic | Behavioral rules and ML models that produce verdicts |

## How EDRs Work Under the Hood

Modern EDRs earn their visibility through two complementary layers: kernel mode sensors and user mode hooks.

### Kernel Callbacks

Windows exposes a set of notification APIs that allow kernel drivers to register callbacks for process, thread, and image load events. These callbacks fire before execution reaches user mode, which makes them significantly harder to bypass than anything living in ring 3.

<pre class="mermaid">
flowchart LR
    P[New process] --> KM[Kernel mode]
    KM --> CB1[PsSetCreateProcessNotifyRoutineEx]
    KM --> CB2[PsSetCreateThreadNotifyRoutine]
    KM --> CB3[ObRegisterCallbacks]
    CB1 --> DRV[EDR kernel driver]
    CB2 --> DRV
    CB3 --> DRV
    DRV --> verdict{Verdict}
    verdict --> allow[Resume]
    verdict --> block[Deny creation]
</pre>

Filesystem minifilters intercept I/O at the Filter Manager layer. Each vendor registers at a specific altitude number that determines when their driver runs relative to others. CrowdStrike sits at 321410, SentinelOne at 389040.

### User Mode API Hooking

EDRs inject a DLL into every new process and overwrite the first bytes of critical `ntdll.dll` functions with a jump to their own inspection code. Before hooking, a call flows straight from user space into the kernel via the syscall stub. After hooking the first bytes of that stub are replaced with a jump to the EDR inspection routine, which examines arguments and then forwards the call through a saved trampoline.

<pre class="mermaid">
sequenceDiagram
    participant App as Application
    participant ntdll as ntdll.dll stub
    participant Kernel as Kernel ring 0

    Note over App,Kernel: Without hook
    App->>ntdll: call NtWriteVirtualMemory
    ntdll->>Kernel: syscall instruction
    Kernel-->>App: return

    Note over App,Kernel: With EDR inline hook
    App->>ntdll: call NtWriteVirtualMemory
    ntdll->>ntdll: jmp to EDR inspection routine
    ntdll->>ntdll: EDR inspects arguments
    ntdll->>ntdll: jmp back via trampoline
    ntdll->>Kernel: syscall instruction
    Kernel-->>App: return
</pre>

Anything running in the same process can see and undo those hooks, which is why techniques like Hell's Gate, Heaven's Gate, and direct syscalls exist. See [Hell's Gate, Heaven's Gate and Tartarus Gate](/attacks/2026-01-19-hells-heaven-tartarus-gate/) for a deep dive, and [Hunting the Watchers](/attacks/2026-06-19-edr-hook-detection/) to learn how to enumerate what is actually hooked.

### ETW and Threat Intelligence

Event Tracing for Windows is the structured telemetry backbone. The `Microsoft-Windows-Threat-Intelligence` provider fires events after syscalls transition to ring 0, making it immune to user land patching. It covers the memory operations most associated with injection: `NtAllocateVirtualMemory`, `NtWriteVirtualMemory`, and `NtMapViewOfSection`. Breaking this telemetry layer is covered in [Breaking ETW and EDR](/attacks/2024-02-11-offensive-etw/).

## MostShittyEDR: Dual Mode Architecture

MostShittyEDR ships two operating modes. Pick user mode to keep things simple, or add the kernel driver to raise the bar on every challenge category.

<pre class="mermaid">
graph TB
    subgraph KernelLayer["Kernel Driver mode"]
        CB1["PsSetCreateProcessNotifyRoutineEx"]
        CB2["PsSetCreateThreadNotifyRoutine"]
        CB3["ObRegisterCallbacks: LSASS handle guard"]
        EQ["Event Queue FIFO"]
        BR["Block Rules up to 64"]
        IRP["Pending IRP single slot"]
        CB1 --> EQ
        CB2 --> EQ
        CB3 --> EQ
        BR -->|deny creation| CB1
        EQ --> IRP
    end

    subgraph IOCTL["IOCTL Interface via MostShittyEDR device"]
        I1["WAIT_FOR_EVENT 0x222000"]
        I2["KILL_PROCESS 0x222004"]
        I3["ADD_BLOCK_RULE 0x222008"]
        I4["CLEAR_RULES 0x22200C"]
        I5["SIGNAL_LSASS 0x222010"]
    end

    subgraph AgentLayer["Nim Agent edr_agent.exe"]
        Rules["Rules 1 to 9"]
        ETW["ETW Telemetry"]
        Sigs["Hash Signatures"]
        Hooks["Hook Profiles"]
    end

    IRP -->|overlapped I/O| I1
    I1 -->|EDR EVENT struct| AgentLayer
    AgentLayer -->|EdrCommand struct| I2
    AgentLayer -->|BlockRuleEntry struct| I3
</pre>

| | User mode default | Kernel mode with driver |
|---|---|---|
| **Monitoring** | Toolhelp32 polling with 500 ms gaps | Kernel callbacks with no gaps |
| **Process blocking** | Kill after detection | Deny creation before the process starts |
| **LSASS protection** | Keyword matching only | Handle permission stripping via ObRegisterCallbacks |
| **Process termination** | TerminateProcess in user mode | ZwTerminateProcess from ring 0 |
| **Evasion difficulty** | Easy through timing or elevation | Significantly harder, kernel access required |
| **Requirements** | None | WDK, test signing enabled, Administrator |

## Detection Rules and Their Weaknesses

The agent ships nine detection rules. All of them are documented, and all of them are bypassable:

| Rule | Detection Method | Response | Bypassable |
|------|-----------------|----------|:----------:|
| 1 | Process name blacklist with 12 entries, case sensitive | Block and kill | Yes |
| 2 | Command line keyword search with 12 patterns, no deobfuscation | Block and kill | Yes |
| 3 | Reconnaissance command detection covering 13 tools | Alert only, result discarded | Yes |
| 4 | LSASS dump detection requiring tool name AND keyword, both conditions | Block and kill | Yes |
| 5 | PowerShell flag analysis for powershell.exe only, not pwsh.exe | Block and kill | Yes |
| 6 | SHA256 hash detection via optional signature file | Block and kill | Yes |
| 7 | Hooked API import detection via EDR hook profiles | Alert only | Yes |
| 8 | ETW session integrity check with hardcoded session name | Block and kill | Yes |
| 9 | PE structure analysis checking packer signatures and header integrity | Alert only | Yes |

Rule 3 deserves a callout: it detects reconnaissance activity and then discards the result without triggering any block. Rule 5 only inspects processes named `powershell.exe`, so `pwsh.exe` and any alternative PowerShell host sail through completely undetected.

## Kernel Driver Mode

Starting the agent with `--driver` connects it to the kernel driver device `\\.\MostShittyEDR` and switches from polling to event driven monitoring. The driver registers kernel callbacks and pushes events to the agent via overlapped I/O. The agent in turn pushes block rules down into the kernel, which can deny process creation before the process ever starts.

The driver also installs an `ObRegisterCallbacks` hook that strips `PROCESS_VM_READ` and `PROCESS_QUERY_INFORMATION` from handles to LSASS, making credential dumping significantly harder to perform with standard tooling.

### Intentional Weaknesses in Kernel Mode

The driver ships with its own set of intentional problems that form the basis of the two hardest challenge categories:

- The device object has no access control list, so any process regardless of privilege can send IOCTLs directly to `\\.\MostShittyEDR`
- The single slot event delivery can be monopolized, creating a denial of service that blinds the agent
- Block rules are capped at 64 entries and can be cleared by anyone who can reach the device

These weaknesses mirror real world BYOVD scenarios where a vulnerable or misconfigured driver becomes the attacker's lever against the very security product protecting the host. The [Phantom in the Ring](/attacks/2026-06-24-byovd-ioctl-edr-killer/) post covers BYOVD, IOCTL hunting, and EDR killing from kernel space in detail. For the broader picture of how evasion techniques have evolved, [The EDR Bypass Roadmap](/attacks/2026-01-18-EDR-bypass-roadmap/) and [Understanding and Attacking EDRs](/attacks/2024-08-21-edr-and-malware/) cover the full stack.

## The Challenge Lab

> **Can you bypass the EDR?**
> MostShittyEDR implements detection patterns found in real world EDR products, with nine rules in user mode and a kernel driver that raises the bar considerably.
> Your mission: execute tools and commands without being detected or killed.

The challenge platform at [benjitrapp.github.io/MostShittyEDR](https://benjitrapp.github.io/MostShittyEDR/) wraps the agent in an interactive learning environment with 42 challenges, full solutions, and supplementary reading on EDR internals, API hooking, ETW manipulation, and BYOVD attacks.

## Challenge Categories

<pre class="mermaid">
mindmap
  root((MostShittyEDR))
    User Mode Rules
      Process Name Evasion
        4 challenges Easy
        Rule 1
      Command Line Obfuscation
        5 challenges Easy to Medium
        Rules 2 3 5
      Process Monitoring Bypass
        5 challenges Medium
        Architecture and Rule 4
      Execution Evasion
        4 challenges Medium to Hard
        Architecture and Rule 5
      Advanced Bypass
        2 challenges Easy to Hard
        Architecture and Rule 6
      API Hook Evasion
        4 challenges Medium to Hard
        Rule 7
      ETW Bypass
        4 challenges Hard
        Rule 8
      Signature Bypass
        4 challenges Easy to Hard
        Rule 6
      Packer and PE Evasion
        4 challenges Medium to Hard
        Rule 9
    Kernel Mode
      BYOVD and Kernel Attacks
        3 challenges Hard
        Kernel Driver
      IOCTL Abuse
        3 challenges Medium
        Kernel Driver
</pre>

| Category | Challenges | Difficulty | Target |
|----------|:----------:|:----------:|--------|
| Process Name Evasion | 4 | Easy | Rule 1: static blacklist bypass via renaming and substitution |
| Command Line Obfuscation | 5 | Easy to Medium | Rules 2, 3, 5: environment variables, carets, encoding |
| Process Monitoring Bypass | 5 | Medium | Architecture: exploit polling gaps and living off the land |
| Execution Evasion | 4 | Medium to Hard | Architecture and Rule 5: alternative PowerShell hosts |
| Advanced Bypass | 2 | Easy to Hard | Architecture and Rule 6: parent PID spoofing and hash evasion |
| API Hook Evasion | 4 | Medium to Hard | Rule 7: dynamic resolution and direct syscalls |
| ETW Bypass | 4 | Easy to Hard | Rule 8: session manipulation and EtwEventWrite patching |
| Signature Bypass | 4 | Easy to Hard | Rule 6: byte patching to change the SHA256 hash |
| Packer and PE Evasion | 4 | Medium to Hard | Rule 9: PE structure camouflage |
| BYOVD and Kernel Attacks | 3 | Hard | Kernel driver: callback removal, ETW-TI blinding via EDRSandblast and NimBlackout |
| IOCTL Abuse | 3 | Medium | Kernel driver: direct IOCTL access, event queue monopolization, rule injection |

## Quick Start

```powershell
# Clone the repository
git clone https://github.com/BenjiTrapp/MostShittyEDR.git

# Install dependencies and build
make build

# Run in detection only mode
.\edr_agent.exe --verbose --no-kill

# Run with SHA256 signature file
.\edr_agent.exe --verbose --signatures signatures/malware_hashes.txt

# Run with a real EDR hook profile for Rule 7
.\edr_agent.exe --verbose --profile crowdstrike

# Run with kernel driver (requires loaded driver and Administrator)
.\edr_agent.exe --driver --verbose
```

The `--no-kill` flag enables alert only mode. Use it while learning; remove it once you want to feel the full weight of a block. The `--driver` flag requires the kernel driver to be installed and running with test signing enabled.

## Further Reading

The blog has a set of posts that complement the challenge categories directly:

| Topic | Post |
|-------|------|
| BYOVD and IOCTL based EDR killing | [Phantom in the Ring](/attacks/2026-06-24-byovd-ioctl-edr-killer/) |
| Full EDR bypass strategy and API subversion | [The EDR Bypass Roadmap](/attacks/2026-01-18-EDR-bypass-roadmap/) |
| EDR internals: hooking, syscalls, kernel bypass | [Understanding and Attacking EDRs](/attacks/2024-08-21-edr-and-malware/) |
| Offensive ETW: breaking telemetry | [Breaking ETW and EDR](/attacks/2024-02-11-offensive-etw/) |
| Enumerating and detecting user mode hooks | [Hunting the Watchers](/attacks/2026-06-19-edr-hook-detection/) |
| Hell's Gate, Heaven's Gate and Tartarus Gate | [Direct Syscall Techniques](/attacks/2026-01-19-hells-heaven-tartarus-gate/) |

---

If the AMSI layer interests you as well, the companion project [MostShittyAV](https://benjitrapp.github.io/2026/02/15/MostShittyAV-post.html) covers 43 AMSI bypass challenges across 6 categories.

**Explore the code and contribute:** [MostShittyEDR on GitHub](https://github.com/BenjiTrapp/MostShittyEDR)

**Try the challenge lab:** [MostShittyEDR Platform](https://benjitrapp.github.io/MostShittyEDR/)
