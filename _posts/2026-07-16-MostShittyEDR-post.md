---
layout: post
title: "MostShittyEDR: Building a Terrible EDR to Learn Bypassing"
---

<img height="150" align="left" src="/MostShittyEDR/static/logo.png"> Endpoint Detection and Response tools are the closest thing the blue team has to omniscience. They sit inside every process, tap into the kernel, and watch every syscall. And yet red teamers bypass them every day. The fastest way to understand why is to build one yourself, deliberately badly, and then try to break it. That is exactly what MostShittyEDR is: an intentionally vulnerable EDR agent written in Nim that you can study, run, and defeat.

The project has evolved into a full challenge platform with **36 challenges across 9 categories**, each one illuminating a specific weakness in how endpoint agents detect threats.

- [What is an EDR?](#what-is-an-edr)
- [How EDRs Work Under the Hood](#how-edrs-work-under-the-hood)
- [MostShittyEDR: The Agent](#mostshittyedr-the-agent)
- [Detection Rules and Their Weaknesses](#detection-rules-and-their-weaknesses)
- [The Challenge Lab](#the-challenge-lab)
- [Challenge Categories](#challenge-categories)
- [Quick Start](#quick-start)

## What is an EDR?

An EDR is an agent that runs on a host and watches everything: processes created, commands executed, files touched, network connections opened, and memory allocated. Unlike a classic antivirus that checks files against a signature database, an EDR correlates behavior across time to catch threats that have never been seen before.

<pre class="mermaid">
graph TD
    A[Process created] --> B[EDR Agent intercepts]
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
| Agent | User mode coordinator running on the endpoint |
| Sensors | Kernel callbacks, API hooks, ETW providers |
| Telemetry | Raw event stream sent to the cloud backend |
| Detection logic | Behavioral rules and ML models that produce verdicts |

## How EDRs Work Under the Hood

Modern EDRs earn their visibility through two complementary layers: kernel mode sensors and user mode hooks.

### Kernel Callbacks

Windows exposes a set of notification APIs that allow kernel drivers to register callbacks for process, thread, and image load events. These callbacks fire before execution reaches user mode, which makes them much harder to bypass than anything that lives in ring 3.

<pre class="mermaid">
flowchart LR
    P[New process] --> KM[Kernel mode]
    KM --> CB1[PsSetCreateProcessNotifyRoutineEx]
    KM --> CB2[PsSetCreateThreadNotifyRoutine]
    KM --> CB3[PsSetLoadImageNotifyRoutine]
    CB1 --> EDR[EDR kernel driver]
    CB2 --> EDR
    CB3 --> EDR
    EDR --> verdict{Verdict}
    verdict --> allow[Resume]
    verdict --> block[Deny / kill]
</pre>

Filesystem minifilters intercept I/O at the Filter Manager layer. Each vendor registers at a specific altitude number that determines when their driver runs relative to others. CrowdStrike sits at 321410, SentinelOne at 389040.

### User Mode API Hooking

For visibility into what a process does at runtime, EDRs inject a DLL into every new process and overwrite the first bytes of critical `ntdll.dll` functions with a jump to their own inspection code. The original syscall stub looks like this:

```asm
mov r10, rcx
mov eax, [syscall number]
syscall
ret
```

After hooking, the first bytes become a detour:

```asm
jmp  [EDR inspection routine]
; original bytes saved in a trampoline
```

This gives the EDR a chance to examine arguments before the call transitions to the kernel. The problem is that anything running in the same process can see and undo those hooks.

### ETW and Threat Intelligence

Event Tracing for Windows is the structured telemetry backbone. The `Microsoft-Windows-Threat-Intelligence` provider fires events after syscalls transition to ring 0, which makes it immune to user land patching. It covers the memory operations most associated with injection: `NtAllocateVirtualMemory`, `NtWriteVirtualMemory`, and `NtMapViewOfSection`. Access requires a PPL-AM protected process with an ELAM signed driver, which is why ETW-TI is one of the last things to fall in an escalating bypass chain.

## MostShittyEDR: The Agent

MostShittyEDR skips the kernel driver and the DLL injection entirely. The agent runs in user mode and uses the Toolhelp32 API to enumerate all running processes at a configurable polling interval. Each snapshot is checked against nine detection rules.

<pre class="mermaid">
sequenceDiagram
    participant A as EDR Agent
    participant W as Windows Toolhelp32
    participant P as Running Processes
    loop Every polling interval
        A->>W: CreateToolhelp32Snapshot
        W->>A: Process list
        A->>P: Check each entry
        P->>A: Name + command line + PID
        A->>A: Apply rules 1 through 9
        A->>A: Kill or alert
    end
</pre>

The polling architecture is itself the first weakness. Any process that starts and finishes between two snapshots is invisible to the agent. This is not a bug; it is the architectural limitation that polling based user mode monitoring inherits by design.

## Detection Rules and Their Weaknesses

The agent ships nine detection rules, all of which are documented and all of which are bypassable:

| Rule | Detection Method | Response | Bypassable |
|------|-----------------|----------|:----------:|
| 1 | Process name blacklist (12 entries, case sensitive) | Block and kill | Yes |
| 2 | Command line keyword search (12 patterns, no deobfuscation) | Block and kill | Yes |
| 3 | Reconnaissance command detection (13 tools) | Alert only, result discarded | Yes |
| 4 | LSASS dump detection (tool name AND keyword, both required) | Block and kill | Yes |
| 5 | PowerShell flag analysis (powershell.exe only) | Alert only | Yes |
| 6 | Hash based detection (SHA256) | Block and kill | Yes |
| 7 | Hooked API import detection | Alert only | Yes |
| 8 | ETW integrity checks | Block and kill | Yes |
| 9 | PE structure analysis | Alert only | Yes |

Rule 6 deserves a special mention: the hash database ships empty, which means SHA256 detection is completely non functional out of the box. Rule 3 detects reconnaissance activity but discards the result without triggering any block. These are intentional teaching moments.

## The Challenge Lab

> **Can you bypass the agent?**
> MostShittyEDR implements nine detection rules with documented weaknesses.
> Your mission: evade detection while running your payloads.

The challenge platform at [benjitrapp.github.io/MostShittyEDR](https://benjitrapp.github.io/MostShittyEDR/) wraps the agent in an interactive learning environment with 36 challenges, full solutions, and supplementary reading on EDR internals, API hooking, and ETW manipulation.

From the lab you can browse [Challenges](https://benjitrapp.github.io/MostShittyEDR/challenges/), read the [EDR Explained](https://benjitrapp.github.io/MostShittyEDR/edr-explained) primer, study the [Architecture](https://benjitrapp.github.io/MostShittyEDR/architecture) deep dive, or work through the solutions at your own pace.

## Challenge Categories

<pre class="mermaid">
mindmap
  root((MostShittyEDR))
    Process Name Evasion
      4 challenges
      Easy
      Rule 1
    Command Line Obfuscation
      5 challenges
      Easy to Medium
      Rules 2 3 5
    Process Monitoring Bypass
      5 challenges
      Medium
      Architecture and Rule 4
    Execution Evasion
      4 challenges
      Medium to Hard
      Architecture and Rule 5
    Advanced Bypass
      2 challenges
      Easy to Hard
      Architecture and Rule 6
    API Hook Evasion
      4 challenges
      Rule 7
    ETW Bypass
      4 challenges
      Rule 8
    Signature Bypass
      4 challenges
      Rule 6
    Packer and PE Evasion
      4 challenges
      Rule 9
</pre>

| Category | Challenges | Difficulty | Target Rule |
|----------|:----------:|:----------:|-------------|
| Process Name Evasion | 4 | Easy | Rule 1: static blacklist bypass via renaming and tool substitution |
| Command Line Obfuscation | 5 | Easy to Medium | Rules 2, 3, 5: environment variables, carets, encoding |
| Process Monitoring Bypass | 5 | Medium | Architecture: exploit polling gaps and living off the land |
| Execution Evasion | 4 | Medium to Hard | Architecture and Rule 5: alternative PowerShell hosts |
| Advanced Bypass | 2 | Easy to Hard | Architecture and Rule 6: parent PID spoofing and hash detection |
| API Hook Evasion | 4 | Medium to Hard | Rule 7: dynamic resolution and direct syscalls |
| ETW Bypass | 4 | Hard | Rule 8: session manipulation and provider tampering |
| Signature Bypass | 4 | Medium | Rule 6: byte patching and hash collision |
| Packer and PE Evasion | 4 | Hard | Rule 9: PE structure camouflage |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/BenjiTrapp/MostShittyEDR.git

# Build the agent
make build

# Run in detection only mode
.\edr_agent.exe --verbose --no-kill

# Run with a custom polling interval (milliseconds)
.\edr_agent.exe --verbose --no-kill --interval 500
```

The `--no-kill` flag enables alert only mode so you can observe detections without the agent terminating processes. Use it while learning; remove it once you want to feel the full weight of a block.

---

If the AMSI layer interests you as well, the companion project [MostShittyAV](https://benjitrapp.github.io/2026/02/15/MostShittyAV-post.html) covers 43 AMSI bypass challenges across 6 categories.

**Explore the code and contribute:** [MostShittyEDR on GitHub](https://github.com/BenjiTrapp/MostShittyEDR)

**Try the challenge lab:** [MostShittyEDR Platform](https://benjitrapp.github.io/MostShittyEDR/)
