---
layout: post
title: Transportable Detonation Chamber - Fifteen Views of One Detonation
---

<img height="200" align="left" src="/images/tdc-logo.png"> The Transportable Detonation Chamber (TDC) is a Windows 11 VM I can afford to throw away. You hand it a file; it runs the file and writes down what happened — which rules matched, what the kernel saw, what sat in the process's memory while it lived and in its dump after it died, whom it phoned, which named pipes it opened — and then it grades all of that into one verdict you are able to argue with, because every point in the score says where it came from. There is one browser tab for the whole thing, on port 9000, and fifteen views inside it. It runs on Hyper-V on an x86_64 Windows host, and under UTM on Apple Silicon.

I built it to answer two questions with the same box. The first is the obvious one: *what did this sample do*. The second is the one I reach for more often: *what does my own payload look like to the engines watching it* — which rule fires, which string in memory gives it away, and whether anybody would have seen it at all. This post is a tour of all fifteen views, and for each one, what it is good for when the thing under the microscope is something you compiled yourself.

Every screenshot below was taken today from the running box, so the numbers are a real analysis VM with a few weeks of work on it rather than a clean demo. One service, the Detonator orchestration UI, was switched off at the time; the dashboard says so, and I left it in.

> The chamber executes what you hand it, on purpose. `/api/submit` runs files by design and the Web UI has no login. Treat the VM as compromised from the first detonation, and never put it on a network you care about.

- [One Screenshot, the Whole Idea](#one-screenshot-the-whole-idea)
- [What Runs Inside](#what-runs-inside)
- [What Fired: Alerts, Tracing, Graph](#what-fired-alerts-tracing-graph)
- [What It Touched: Pipes, Sysmon, ETW](#what-it-touched-pipes-sysmon-etw)
- [Whom It Talked To: Firewall and LOGS](#whom-it-talked-to-firewall-and-logs)
- [What It Is Made Of: ThreatScan, Hex, FileMap, Rizin, LitterBox](#what-it-is-made-of-threatscan-hex-filemap-rizin-litterbox)
- [Submitting, and the Two Themes](#submitting-and-the-two-themes)
- [Running It](#running-it)
- [What It Is Not](#what-it-is-not)
- [Links](#links)

## One Screenshot, the Whole Idea

Before the tour, the picture that explains why I kept building this thing. It is the detonation result of one of my own implant builds.

![Detonation results of rascal-windows-amd64.exe: the MALICIOUS banner with its reasons, the verdict flow Sankey, and sixteen scored in-memory findings with their weights and why each weight was cut]({{ site.baseurl }}/images/tdc-detonation.png)

`rascal-windows-amd64.exe`, my own build, PID 5876, comes back **MALICIOUS**. A scanner would stop there. This does not. The **VERDICT FLOW** splits the verdict into where it came from — 19 findings, 3 from EDR alerts and 16 from live memory, of which **6 counted and 13 did not** — and under it, every one of those sixteen findings with its weight and the arithmetic behind it:

| Weight | What was found in memory | Why that weight |
|---|---|---|
| **2.50** | `REFLECTIVE_LOAD: CLRCreateInstance` — the Win32 function that bootstraps the CLR | rule risk 9, seen in 3/3 samples, 1 of 16 of this kind, group capped at 5 |
| **2.00** | `ENGINE_MANAGED: kerberoast` — a Rubeus Kerberoasting command | rule risk 8, 3/3 samples, 2 of 16 |
| **0.50** | `ENGINE_MANAGED: AmsiScanBuffer` — the AMSI function every bypass targets | rule risk 8, 3/3 samples, 3 of 16 |
| **0.00** | `ENGINE_MANAGED: -EncodedCommand` — PowerShell encoded command execution | uncorroborated, weight reduced, rule risk 6, 6 of 16, **cap reached, not counted** |
| **0.00** | `C2_HTTP: /task` — an HTTP beacon task endpoint | rule risk 2, 11 of 16, **cap reached, not counted** |

Read that as a developer rather than as a defender and it stops being a verdict. It is a punch list. My loader leaves the name of the function it uses to start the CLR in plain sight, a Rubeus command string sits in the heap where any memory scanner will trip over it, I named the AMSI function I patch, and my beacon's task endpoint is the literal string `/task`. None of that needed a reverse engineer. It needed a box that looks at a running process and prints what it reads.

And the banner above it — *"Hash added to Rustinel IOC watchlist"* — means the next time that exact build runs anywhere on this VM, the EDR knows it on sight.

### How a finding becomes a number

Every verdict in this post leans on one model, so it is worth a paragraph. No scanner's own severity label survives into the score. Instead:

- A finding the clean host's **baseline** already knows is set aside before anything is counted. It is shown collapsed, never silently dropped.
- What is left is weighted by its **evidence class**: a structural fact (a thread starting in private RX memory, a PE header in private memory) outranks a behavioural pattern, which outranks an extracted artifact, which outranks a byte pattern. String rules carry their own `risk_score`, which is the "rule risk" in the table above.
- Then by **persistence** across the samples: in every sample ×1.0, in at least half ×0.55, in one ×0.25. That is what `seen in 3/3 samples` buys.
- Then by **corroboration**: kinds that legitimate software also shows count at 40 % until an independent source agrees on the same process. That is the `uncorroborated — weight reduced` line.
- Then **saturation**: one kind of finding in one process counts at most twice its strongest instance. That is why findings 6 and 11 of sixteen score zero and say `cap reached, not counted` — eleven hits of the same common pattern cannot carry a verdict on their own.

The sum is the memory evidence score, on a fixed scale: **≥ 2.0 is SUSPICIOUS, ≥ 6.0 is MALICIOUS**. The `rascal` build lands at **5** on that scale and MALICIOUS overall once its three critical EDR alerts join in. And a scan that read no memory at all reports **NOT OBSERVED** rather than CLEAN, which is the distinction most tools quietly refuse to make.

## What Runs Inside

Everything but the browser, the MCP server and `make` runs inside the VM, and the host reaches all of it through port 9000.

<div class="ghidra-mock" style="overflow-x:auto;">
  <div class="gm-bar">
    <span style="color:#ff5f56">●</span>&nbsp;<span style="color:#ffbd2e">●</span>&nbsp;<span style="color:#27c93f">●</span>
    <span style="margin-left:12px;color:#8b949e;font-size:11px;font-family:'Courier New',monospace;">Windows 11 VM · Hyper-V x64 / UTM ARM64</span>
  </div>
  <div style="padding:20px 22px 24px;">

    <!-- Intake layer -->
    <div style="color:#484f58;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;font-family:'Courier New',monospace;">Intake</div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:stretch;">

      <div style="flex:1;min-width:130px;background:#0c1829;border:1px solid #1d4ed8;border-radius:6px;padding:12px 14px;">
        <div style="color:#60a5fa;font-family:'Courier New',monospace;font-size:13px;font-weight:600;">Web UI</div>
        <div style="color:#3b82f6;font-family:'Courier New',monospace;font-size:11px;margin-top:2px;">:9000</div>
        <div style="color:#4b5563;font-size:11px;margin-top:8px;">Python / Flask</div>
        <div style="color:#374151;font-size:10px;margin-top:2px;">15 tabs &amp; the REST API</div>
      </div>

      <div style="display:flex;align-items:center;color:#f97316;font-size:18px;font-weight:700;padding:0 2px;">→</div>

      <div style="flex:1.4;min-width:155px;background:#1a0a00;border:1px solid #c2410c;border-radius:6px;padding:12px 14px;">
        <div style="color:#fb923c;font-family:'Courier New',monospace;font-size:13px;font-weight:600;">DetonatorAgent</div>
        <div style="color:#f97316;font-family:'Courier New',monospace;font-size:11px;margin-top:2px;">:8080</div>
        <div style="color:#4b5563;font-size:11px;margin-top:8px;">.NET 8.0</div>
        <div style="color:#374151;font-size:10px;margin-top:2px;">Runs the sample · answers its PID</div>
      </div>

      <div style="flex:0 0 10px;"></div>

      <div style="flex:1;min-width:130px;background:#03180d;border:1px solid #166534;border-radius:6px;padding:12px 14px;">
        <div style="color:#4ade80;font-family:'Courier New',monospace;font-size:13px;font-weight:600;">LitterBox</div>
        <div style="color:#22c55e;font-family:'Courier New',monospace;font-size:11px;margin-top:2px;">:1337</div>
        <div style="color:#4b5563;font-size:11px;margin-top:8px;">Python / Flask</div>
        <div style="color:#374151;font-size:10px;margin-top:2px;">Static + dynamic sandbox</div>
      </div>

    </div>

    <div style="display:flex;align-items:center;padding:14px 0;gap:10px;">
      <div style="flex:1;height:1px;background:#21262d;"></div>
      <div style="color:#484f58;font-size:10px;font-family:'Courier New',monospace;white-space:nowrap;">▼&nbsp;&nbsp;events · telemetry · alerts&nbsp;&nbsp;▼</div>
      <div style="flex:1;height:1px;background:#21262d;"></div>
    </div>

    <!-- Detection layer -->
    <div style="color:#484f58;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;font-family:'Courier New',monospace;">Detection</div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:stretch;">

      <div style="flex:1;min-width:155px;background:#130606;border:1px solid #991b1b;border-radius:6px;padding:12px 14px;">
        <div style="color:#fca5a5;font-family:'Courier New',monospace;font-size:13px;font-weight:600;">Rustinel</div>
        <div style="color:#f87171;font-family:'Courier New',monospace;font-size:11px;margin-top:2px;">Sigma · YARA · IOC</div>
        <div style="color:#4b5563;font-size:11px;margin-top:8px;">Rust</div>
        <div style="color:#374151;font-size:10px;margin-top:2px;">Hot-reloaded rules</div>
        <div style="color:#374151;font-size:10px;">NDJSON alerts, read every 5 s</div>
      </div>

      <div style="flex:1;min-width:155px;background:#170530;border:1px solid #7c3aed;border-radius:6px;padding:12px 14px;">
        <div style="color:#c084fc;font-family:'Courier New',monospace;font-size:13px;font-weight:600;">Fibratus</div>
        <div style="color:#a78bfa;font-family:'Courier New',monospace;font-size:11px;margin-top:2px;">:8180 · Kernel ETW</div>
        <div style="color:#4b5563;font-size:11px;margin-top:8px;">Go</div>
        <div style="color:#374151;font-size:10px;margin-top:2px;">Process / file / registry / network</div>
        <div style="color:#374151;font-size:10px;">Behaviour rules</div>
      </div>

      <div style="flex:1;min-width:130px;background:#161000;border:1px solid #b45309;border-radius:6px;padding:12px 14px;">
        <div style="color:#fcd34d;font-family:'Courier New',monospace;font-size:13px;font-weight:600;">Sysmon</div>
        <div style="color:#fbbf24;font-family:'Courier New',monospace;font-size:11px;margin-top:2px;">Event Log, 512 MB</div>
        <div style="color:#4b5563;font-size:11px;margin-top:8px;">Sysinternals</div>
        <div style="color:#374151;font-size:10px;margin-top:2px;">Every named pipe logged</div>
        <div style="color:#374151;font-size:10px;">ARM64 native binary</div>
      </div>

    </div>

    <div style="display:flex;align-items:center;padding:14px 0;gap:10px;">
      <div style="flex:1;height:1px;background:#21262d;"></div>
      <div style="color:#484f58;font-size:10px;font-family:'Courier New',monospace;white-space:nowrap;">▼&nbsp;&nbsp;against the PID, one after another&nbsp;&nbsp;▼</div>
      <div style="flex:1;height:1px;background:#21262d;"></div>
    </div>

    <!-- Memory layer -->
    <div style="color:#484f58;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;font-family:'Courier New',monospace;">Memory</div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:stretch;">

      <div style="flex:1;min-width:120px;background:#04171a;border:1px solid #0e7490;border-radius:6px;padding:12px 14px;">
        <div style="color:#67e8f9;font-family:'Courier New',monospace;font-size:12px;font-weight:600;">Hunt-Sleeping-Beacons</div>
        <div style="color:#4b5563;font-size:11px;margin-top:8px;">C++</div>
        <div style="color:#374151;font-size:10px;margin-top:2px;">Callstacks of sleeping beacons</div>
      </div>

      <div style="flex:1;min-width:120px;background:#04171a;border:1px solid #0e7490;border-radius:6px;padding:12px 14px;">
        <div style="color:#67e8f9;font-family:'Courier New',monospace;font-size:12px;font-weight:600;">BeaconEye</div>
        <div style="color:#4b5563;font-size:11px;margin-top:8px;">.NET</div>
        <div style="color:#374151;font-size:10px;margin-top:2px;">Cobalt Strike beacon configs</div>
      </div>

      <div style="flex:1;min-width:120px;background:#04171a;border:1px solid #0e7490;border-radius:6px;padding:12px 14px;">
        <div style="color:#67e8f9;font-family:'Courier New',monospace;font-size:12px;font-weight:600;">Aether</div>
        <div style="color:#4b5563;font-size:11px;margin-top:8px;">Zig</div>
        <div style="color:#374151;font-size:10px;margin-top:2px;">In-memory signatures</div>
        <div style="color:#374151;font-size:10px;">3 samples, 3 s apart</div>
      </div>

      <div style="flex:1;min-width:120px;background:#04171a;border:1px solid #0e7490;border-radius:6px;padding:12px 14px;">
        <div style="color:#67e8f9;font-family:'Courier New',monospace;font-size:12px;font-weight:600;">Process Dump</div>
        <div style="color:#4b5563;font-size:11px;margin-top:8px;">C++</div>
        <div style="color:#374151;font-size:10px;margin-top:2px;">Writes components to disk</div>
        <div style="color:#374151;font-size:10px;">Skips clean-hash modules</div>
      </div>

      <div style="flex:1;min-width:120px;background:#1a0618;border:1px solid #a21caf;border-radius:6px;padding:12px 14px;">
        <div style="color:#f0abfc;font-family:'Courier New',monospace;font-size:12px;font-weight:600;">Exit Capture</div>
        <div style="color:#4b5563;font-size:11px;margin-top:8px;">Windows feature</div>
        <div style="color:#374151;font-size:10px;margin-top:2px;">Full dump as the process exits</div>
        <div style="color:#374151;font-size:10px;">Armed per image name</div>
      </div>

    </div>

  </div>
</div>

| Service | Port | Purpose | Technology |
|---------|------|---------|-----------|
| **Web UI** | 9000 | The 15 tabs, the REST API and the MCP endpoint | Python / Flask |
| **DetonatorAgent** | 8080 | Executes the sample, returns its PID | .NET 8.0 |
| **LitterBox** | 1337 | Static + dynamic analysis sandbox | Python / Flask |
| **Fibratus** | 8180 | Kernel ETW telemetry and behaviour rules | Go |
| **Rustinel** | — | Sigma / YARA / IOC detection in real time | Rust |
| **Sysmon** | — | Windows event logging, incl. every named pipe | Sysinternals |
| **Hunt-Sleeping-Beacons** | — | Callstack scanner for sleeping C2 beacons | C++ |
| **BeaconEye** | — | Cobalt Strike beacon config scanner | .NET |
| **Aether** | — | Live-process memory forensics | Zig |
| **Process Dump** | — | Memory component dumper with a clean-hash database | C++ |
| **Detonator** | 5000 / 8000 | Orchestration UI and REST API | Python |
| **theZoo-WebUI** | 8888 | Malware sample browser | PHP |

A detonation is a fan-out, not a pipeline. The hash goes into the IOC list, Windows gets armed to dump the process the moment it exits, and only then does anything run:

<pre class="mermaid">
flowchart TB
    SUBMIT["Submit tab, make submit or the MCP tool"] --> IOC["The sample's SHA-256 joins Rustinel's IOC list"]
    IOC -->|"target agent or both"| ARM["Exit Capture armed for the image name, for a window of 120 s"]
    ARM --> RUN["DetonatorAgent runs the file and answers its PID"]
    RUN --> ENGINES["Rustinel, Fibratus and Sysmon record all the time; their output is matched to the PID afterwards"]
    RUN --> MEM["Against the PID, one after another in one background thread: Hunt-Sleeping-Beacons, BeaconEye, Aether with 3 samples 3 s apart, Process Dump last"]
    RUN --> LB["LitterBox: upload, then static, then dynamic analysis"]
    RUN --> EXIT["Exit Capture waits for the dump until the window closes, then reads it"]
    RUN --> LOG["From the Sysmon log: the connections it made and the pipes it opened"]
    ENGINES --> RESULTS["The results route"]
    MEM --> RESULTS
    LB --> RESULTS
    EXIT --> RESULTS
    LOG --> RESULTS
    RESULTS --> VERDICT["One verdict, filling in as the stages report"]
</pre>

The memory tools run one after another in a single background thread, so that their view of the process stays undisturbed. Live-memory results arrive one to two minutes after the start, and the verdict rises while they come in.

![The service dashboard: alert and process counters with 45-day sparklines, alert activity by severity, the severity and category donuts, and the service health cards]({{ site.baseurl }}/images/tdc-dashboard.png)

The dashboard is the state of the box at a glance. On this one: **11,894 alerts** (238 critical, 4,931 high, 6,720 medium, 5 low) across **376 tracked processes**, sorted into five categories — registry 6,724, process 4,952, api 212, file 4, module 2 — and **15 detection rules** loaded, 13 Sigma and 2 YARA. The service cards below carry each component's version and port, with quick actions into the view that belongs to it.

It also reads **5/6 SERVICES ONLINE**, with Detonator struck through, because I had the orchestration UI switched off while these screenshots were taken. The dashboard says so rather than rounding up, which is the behaviour I want from a box whose whole job is reporting honestly.

