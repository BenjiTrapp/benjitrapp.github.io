---
layout: post
title: Transportable Detonation Chamber - Malware Detonation Lab in a Box
---

<img height="200" align="left" src="/images/tdc-logo.png"> The Transportable Detonation Chamber (TDC) is a pre-configured Windows 11 VM for malware detonation testing against multiple EDR solutions. It ships with a unified dark-themed Web UI, real-time Sigma/YARA/IOC detection, kernel ETW telemetry, and supports both Windows (Hyper-V) and macOS Apple Silicon (QEMU/UTM). The goal: spin up an isolated analysis environment in minutes, detonate samples, and observe detection coverage across multiple engines simultaneously.




## The Problem

Testing malware samples against EDR solutions typically requires maintaining multiple VMs, manually installing and configuring detection tools, and correlating outputs across disparate interfaces. This is time-consuming, error-prone, and makes it hard to get a holistic view of detection coverage for a given sample. You end up context-switching between Sysmon logs, YARA scanners, ETW traces, and sandbox results without a unified picture.

## The Solution

TDC packages everything into a single Vagrant-provisioned VM with a unified web interface on port 9000. Submit a sample, and watch as multiple detection engines analyze it in parallel while a single dashboard aggregates all findings. One command to spin up, one interface to view everything.

## Architecture

The system runs multiple core services inside the VM, each handling a different layer of analysis:

```
┌─────────────────────────────────────────────────────────────────┐
│  Windows 11 VM (Hyper-V / QEMU)                                 │
│                                                                  │
│  ┌────────────┐   ┌────────────────┐   ┌────────────┐          │
│  │  Web UI    │   │ DetonatorAgent │   │ LitterBox  │          │
│  │  :9000     │──▶│  :8080         │   │  :1337     │          │
│  └────────────┘   └────────────────┘   └────────────┘          │
│       │                  │                   │                   │
│       └──────────────────▼───────────────────┘                  │
│                  ┌────────────────┐                              │
│                  │    Fibratus    │  Kernel ETW                  │
│                  └────────────────┘                              │
│                  ┌────────────────┐                              │
│                  │   Rustinel     │  Sigma + YARA + IOC          │
│                  └────────────────┘                              │
│                  ┌────────────────┐                              │
│                  │    Sysmon      │  Event Log                   │
│                  └────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow:**

1. Sample submitted via Web UI is forwarded to DetonatorAgent + LitterBox
2. DetonatorAgent executes the sample and returns the PID
3. LitterBox runs static (YARA, CheckPlz, Stringnalyzer) + dynamic (PE-Sieve, Moneta, HollowsHunter, RedEdr) analysis
4. Fibratus captures kernel-level ETW events for the process
5. Rustinel matches events against Sigma + YARA rules + IOC hashes
6. Web UI aggregates alerts from all engines into a unified timeline

| Service | Port | Purpose | Technology |
|---------|------|---------|-----------|
| **Web UI** | 9000 | Unified dashboard & API gateway | Python / Flask |
| **DetonatorAgent** | 8080 | Executes malware samples, returns PID | .NET 8.0 |
| **LitterBox** | 1337 | Static + dynamic analysis sandbox | Python / Flask |
| **Fibratus** | 8180 | Kernel ETW telemetry & behavior rules | Go |
| **Rustinel** | — | Sigma/YARA/IOC real-time detection | Rust |
| **Sysmon** | — | Windows event logging | Sysinternals |
| **Hunt-Sleeping-Beacons** | — | Sleeping C2 beacon callstack scanner | C++ / MSVC |
| **theZoo-WebUI** | 8888 | Malware sample browser | PHP |

## Detection Engines

| Engine | Technology | Capabilities |
|--------|-----------|-------------|
| **Rustinel** | Rust + ETW | 20 Sigma rules, 717 YARA rules, IOC hash matching, real-time NDJSON alerts |
| **Fibratus** | Go + Kernel ETW | Process/file/registry/network telemetry, behavior rules |
| **Sysmon** | Sysinternals | Event logging (process creation, network, file, registry, image loads) |
| **LitterBox** | Python | Static (YARA, strings) + Dynamic (PE-Sieve, Moneta, HollowsHunter, RedEdr) |

Detection rule coverage includes 14 process_creation rules (encoded PowerShell, schtasks, LOLBins, credential dumping), 3 registry_event rules (Run key persistence, Defender tampering, WDigest), plus task_creation, ps_script, and service_creation rules.

## Web UI

The single-page dark-themed interface aggregates telemetry from all engines across seven tabs:

### Dashboard

Stats strip showing alerts by severity, active processes, service health, loaded rules, and available tools. Six service health cards provide at-a-glance status for all detection components, and a recent activity feed shows detection alerts with severity coloring and rule names.

![Dashboard - Unified view with stats, health cards, and activity feed]({{ site.baseurl }}/images/tdc-dashboard.png)

### Tracing & Detection

Real-time ETW event console with process filtering, timeline visualization, and click-through to full detail panels including raw JSON, ATT&CK tags, and related processes.

![Rustinel real-time analysis showing detection alerts]({{ site.baseurl }}/images/tdc-rustinel-analysis.png)

![Rustinel detection detail view with rule matches and severity]({{ site.baseurl }}/images/tdc-rustinel-analysis-details.png)

### Process Graph

Interactive process relationship visualization with 5 layout modes (Force-directed, Hierarchical, Radial, Circular, Grid), zoom controls, search by name/PID, time-range filtering, and detail panels for each process node.

### Scanner

ThreatCheck + DefenderCheck integration identifies the exact bytes triggering Defender/AMSI detection. Results show detection status, byte offset of the trigger, and link directly to the hex editor for inspection.

### Hex Editor & Binary Analysis

Full binary file viewer with drag-and-drop upload, data inspector (Int8/16/32/64, Float32/64, ASCII, UTF-16), and deep PE/ELF analysis capabilities.

![Hex Editor with binary viewer and data inspector]({{ site.baseurl }}/images/tdc-hex-editor.png)

### PE Analysis

Parses full PE structure including DOS/File/Optional headers, section table with entropy bars, security feature detection (ASLR/DEP/SEH/CFG), suspicious import categorization, packer identification, and RWX section flagging.

![PE Header Analyzer showing security features and section details]({{ site.baseurl }}/images/tdc-pe-header-analyzer.png)

![PE Analyzer - text header section with entropy visualization]({{ site.baseurl }}/images/tdc-pe-analyzer-text-header-section.png)

### Submit & Detonation

Multi-target sample detonation with stage-by-stage progress tracking (Upload, Execute, Static, Dynamic, EDR). Supports DetonatorAgent only, LitterBox only, or both targets simultaneously.

![Mimikatz detonation showing multi-stage pipeline progress]({{ site.baseurl }}/images/tdc-mimikatz-detonation.png)

## Analysis Capabilities

Beyond basic detection, TDC provides deep binary analysis:

- **PE Header Analysis** — DOS/File/Optional headers, section table with entropy bars, ASLR/DEP/SEH/CFG detection
- **ELF Binary Analysis** — ELF32/64 header, program headers, section table, dynamic linking, symbol imports/exports
- **ELF Security Audit** — PIE, NX stack, RELRO (Full/Partial), stack canary, Fortify, stripped detection
- **Entropy Visualization** — Per-section Shannon entropy with color coding (red >= 7.0 indicates packed/encrypted)
- **Packer Identification** — UPX, Themida, VMProtect, ASPack, MPRESS via section name matching
- **Suspicious Import Detection** — Categorized by injection, evasion, credential access, networking, crypto, shellcode
- **Hunt-Sleeping-Beacons** — Callstack scanner for identifying sleeping C2 beacons (unbacked memory, module stomping, APC/Timer sleepmasks, return address spoofing)

## Reverse Engineering Tools

The VM comes pre-installed with:

- **Detect It Easy (DiE)** — PE/ELF/Mach-O identification (packers, compilers, protectors, linkers)
- **WinDbg Preview** — Kernel/user-mode debugger with crash dumps, live debugging, and TTD
- **Ghidra** — NSA reverse engineering framework for disassembly, decompilation, and scripting

## Quick Start

```bash
# macOS / Linux - Full VM
make up         # Provisions the Windows 11 VM (~20-30 min first boot)
make open       # Opens http://<vm-ip>:9000 in browser

# Windows (PowerShell, run as Administrator)
.\make.ps1 up
.\make.ps1 open

# Local UI development only (no VM needed)
make install    # Creates venv, installs Flask + deps
make run        # Starts on http://localhost:9000
```

## Detonation Workflow

1. Open the Web UI at `http://localhost:9000`
2. Navigate to the **Submit** tab
3. Drag and drop a malware sample
4. Select target: **Agent** (execution), **LitterBox** (analysis), or **Both**
5. Click Submit and watch the pipeline stages progress
6. Switch to **Tracing** for real-time ETW alerts
7. Switch to **Graph** for process relationship visualization
8. Check **Dashboard** for severity breakdown

CLI submission is also supported:

```bash
# macOS / Linux
make submit FILE=./samples/mimikatz.exe TARGET=both

# Windows
.\make.ps1 submit -File .\samples\mimikatz.exe -Target2 both
```

## Developer Experience

TDC is designed to be iterable for detection engineering work:

- **`make deploy-restart`** — Edit locally, push to VM, restart Flask in one command
- **`make run-debug`** — Flask auto-reload on file changes (local dev)
- **Loading Spinner** — Global overlay with 300ms delay threshold
- **Help Modal** — Built-in documentation (press "? Help" in sidebar)
- **Submissions History** — Persisted to JSON, with Hex button for quick inspection

## Platform Support

| Host OS | Hypervisor | Guest Arch | Performance |
|---------|-----------|-----------|-------------|
| Windows 10/11 (x86_64) | Hyper-V | x86_64 | Native |
| macOS Apple Silicon (M1-M4) | QEMU via vagrant-qemu | ARM64 | Near-native via hvf |

ARM64 compatibility: Sysmon runs natively (ARM64 binary), while Fibratus and Rustinel run under x86_64 emulation with ~10-20% overhead. .NET 8, Python 3.12, DetonatorAgent, and LitterBox all run natively on ARM64.

## Security Considerations

- Treat the VM as compromised after any detonation
- Use snapshots before each analysis session (`vagrant snapshot save clean_state`)
- Network isolation is recommended (Hyper-V internal/private switch)
- The Web UI has no authentication — bind to localhost or isolated networks only
- Defender exclusions are configured for detonation paths only
- Rustinel active response is disabled by default

## Links

- [GitHub Repository](https://github.com/BenjiTrapp/transportable-detonation-chamber)
