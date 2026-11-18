---
layout: post
title: Transportable Detonation Chamber - A Malware Lab That Also Grades My Own Payloads
---

<img height="200" align="left" src="/images/tdc-logo.png"> The Transportable Detonation Chamber (TDC) is a Windows 11 VM I can afford to throw away. You hand it a file; it runs the file and writes down what happened — which rules matched, what the kernel saw, what sat in the process's memory while it lived and in its dump after it died, whom it phoned, which named pipes it opened — and then it grades all of that into a single verdict you are able to argue with, because every point in the score says where it came from. There is one browser tab for the whole thing, on port 9000. It runs on Hyper-V on an x86_64 Windows host, and under UTM on Apple Silicon.

I built it to answer two questions with the same box. The first is the obvious one: *what did this sample do*. The second is the one I reach for more often: *what does my own payload look like to the engines watching it* — which rule fires, which byte Defender hates, and whether anybody would have seen it in memory at all. This post is the tour, told as those two runs.

![The service dashboard in the Cyberpunk theme: detection metrics with 45-day sparklines, alert activity by severity and category, and the health of its six services]({{ site.baseurl }}/images/tdc-dashboard.png)

> The chamber executes what you hand it, on purpose. `/api/submit` runs files by design and the Web UI has no login. Treat the VM as compromised from the first detonation, and never put it on a network you care about.

- [Why a Box of My Own](#why-a-box-of-my-own)
- [What Runs Inside](#what-runs-inside)
- [Act 1: One Sample, End to End](#act-1-one-sample-end-to-end)
- [Act 2: My Own Payload Against the Same Engines](#act-2-my-own-payload-against-the-same-engines)
- [The Rest of the Box](#the-rest-of-the-box)
- [Running It](#running-it)
- [What I Would Change Next](#what-i-would-change-next)
- [Links](#links)

## Why a Box of My Own

Detonating a sample against several engines is not hard. Reading the result is. Sysmon writes to an event log, a YARA scanner prints to a console, a kernel ETW agent streams NDJSON into a directory, and a sandbox returns a report — four interfaces, four clocks, four ideas of what a process is. The work that actually tells you something, lining those up for one PID, is the work nobody wants to do twice, which in practice means it happens once and badly.

The second problem is the one that made me build the memory side. Asking "does my payload get caught" has no answer until you say *by what*. Static detection, a Sigma rule on the command line, a YARA hit in memory, a beacon that ticks like a clock, a pipe name that is in everybody's signature set — those are five different questions with five different answers, and an EDR console that says CLEAN is only reporting on the one it asked.

So the box grades findings itself instead of believing each scanner's severity label. Every finding from every source goes through one model: it gets weighed by what kind of evidence it is, by how persistently it shows up, and by whether a second, independent source agrees — and anything the clean host produces on its own is set aside before the counting starts. The result is a number on a scale that means the same thing for a piece of commodity malware and for something I compiled an hour ago. That is the part worth having.

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
        <div style="color:#374151;font-size:10px;margin-top:2px;">380 in-memory signatures</div>
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

## Act 1: One Sample, End to End

Drop a file on the Submit tab, pick the target — **Agent** for execution, **LitterBox** for analysis, or **Both** — pick the EDR mode, and press **Detonate**. The stages report as they finish, and the verdict fills in behind them.

What makes that verdict worth reading is that no scanner's own severity label survives into it. Every finding, wherever it came from, goes through one model. A finding the clean host's baseline already knows is set aside before anything is counted — shown collapsed, never silently dropped. What is left is weighted by what kind of evidence it is (a structural fact like a thread starting in private RX memory outranks a behavioural pattern, which outranks an extracted artifact, which outranks a byte pattern), then by how persistently it appears across the samples (**×1.0** in every sample, **×0.55** in at least half, **×0.25** in one), then by corroboration: the kinds that legitimate software also shows — a hidden module, private RWX, a heap API table, low-risk strings — count at **40 %** until an independent source agrees on the same process. Saturation caps one kind of finding in one process at **twice** its strongest instance, so a hundred identical hits cannot carry a verdict on their own.

The sum is the memory evidence score, on a fixed scale: **≥ 2.0 is SUSPICIOUS, ≥ 6.0 is MALICIOUS**. And a scan that read no memory reports **NOT OBSERVED** rather than CLEAN, which is the distinction most tools quietly refuse to make.

![Detonation results of injectsim.exe: verdict MALICIOUS score 6.54, the note that the process exited before the live scan, five scored findings with their weights, the exit capture summary and the images extracted from memory]({{ site.baseurl }}/images/tdc-detonation-results.png)

Here is `injectsim.exe`, one of the project's own simulators, at **MALICIOUS 6.54**. The banner above the findings is the interesting part: *the process exited before the live scan; it was analyzed from its exit-time memory dump instead*. The sample was too short-lived for Aether, so the verdict rests on the dump Windows wrote as the process died — **9 modules, 233 regions, 1 thread, 29.3 MB captured**. Five findings carry a weight: a **3.00** for a PE header sitting in private memory at `0x1cd6b0e0000`, **2.50** for an in-memory signature match on a Cobalt Strike 64-bit beacon DLL, **0.80** for a private RWX allocation marked *uncorroborated — weight reduced*, and two more at 0.16 and 0.08 for common reflective-load references, each annotated with why its weight was cut. Three files were carved out of the dump — the main image, the reflective PE and a code chunk — each with a button into the hex editor, the file map or rizin.

That is the verdict. Everything below answers a question the verdict raises.

### Which rules fired

The Alerts tab holds every detection of Rustinel, Fibratus and LitterBox in one table, newest first, under charts of whatever the filters currently let through. The drilldown is the point: a click on a pie slice, a bar or a Sankey band narrows table and charts together and becomes a *step*, and **BACK** walks the path back out.

![The Alerts tab after three drilldown steps: BACK and the path above the charts, 1,345 of 9,950 alerts, severity and engine pies, two hours in bars of five minutes, and the engine-rule-process Sankey]({{ site.baseurl }}/images/tdc-alerts-drilldown.png)

Three steps in — `ALL ALERTS › 27 Jul – 02 Aug › 27 Jul › 27 Jul 10:00–12:00` — the view is down to **1,345 of 9,950 alerts**. The bars re-divide themselves for whatever range they now cover: these two hours are **24 bars of five minutes**, and the busiest holds **373** alerts. The pies say 6 critical, 784 high, 555 medium, and 1,339 of the 1,345 came from Sigma against 6 from YARA. The Sankey names the two flows that produced almost all of it: *Suspicious Encoded PowerShell Command Line* (766) into `powershell.exe`, and *Registry Run Key Persistence* (506) landing mostly on `MsMpEng.exe`.

One honest note about that diagram: the bands are drawn by square roots so that small flows stay visible at all, and **LINEAR** switches to true proportions. The six most frequent rules and processes get their own band; the rest collapse into *other rules* and *other processes*, and those buckets deliberately set no filter, because they stand for names the table would not actually list.

### What one process did

![The Rustinel trace console for MsMpEng.exe: verdict MALICIOUS 100/100, 760 events, a timeline split by event type, the process tree with alert counts, and the verdict table of rules that fired]({{ site.baseurl }}/images/tdc-tracing.png)

The Tracing console takes one process and lays its whole life out: the verdict badge (**MALICIOUS · 100/100** for this `MsMpEng.exe`, **760 events** over **59m 37s**), a timeline split into Critical/High, Process, Network, DNS, File and Registry rows, the process tree with the alert count of every process in it, and a verdict table where each row is a rule that fired — severity, offset from the start, rule and engine, PID, process, details — with the raw event one click away. The tabs beside VERDICT are the breakdown: **HTTP REQUESTS 0, CONNECTIONS 0, DNS REQUESTS 0, FILES 0, REGISTRY 760**. This one never touched the network; everything it did, it did to the registry.

### Who started it

![The process graph focused on an explorer.exe instance: ancestors above, children below, and a detail panel with image, status, parent, activity counters, the signature check, the children and the Sysmon events it triggered]({{ site.baseurl }}/images/tdc-graph-tree.png)

The Graph tab draws the processes around one process — ancestors above, children below — as a tree, a force-directed layout or an isometric view where two processes on the same named pipe are joined by a raised bridge. The detail panel is where the correlation happens: image, command line, status, parent, activity counters, a **Check who signed this** button, the children, and then the two lists that save the most time — **TRIGGERED SYSMON EVENTS** (for this `explorer.exe`: EID 1 ProcessCreate 58×, EID 18 PipeConnected 11×, EID 11 FileCreate 6×, EID 17 PipeCreated 5×, EID 22 DNSQuery 3×, EID 3 NetworkConnect 2×) and **CORRELATED WINDOWS EVENT IDS**, which maps those to what the Security log would have recorded: 4688 Process Creation, 4689 Process Exit, 5156 WFP Connection Allowed, 5157 WFP Connection Blocked, 5158 WFP Bind Allowed, 4663 Object Access.

Note the focus key in the breadcrumb: `PID 7420@1785739535`. Windows reuses PIDs, so every process in the UI is an *instance*. The newest holder of a PID is addressed by the plain number and earlier ones as `<pid>@<start epoch>`, and alerts, events and children are attributed to the instance that was alive at the time. Without that, a long session turns into one long case of mistaken identity.

### Which Windows events correspond

![The Sysmon tab: events over time stacked by event type, a process to event type Sankey, the type counters, and a table of events with their command lines and the Windows Event IDs they correspond to]({{ site.baseurl }}/images/tdc-sysmon-events.png)

The Sysmon tab is the same correlation at log scale, with the Windows Event IDs in their own column. The charts narrow the table: a bar of **EVENTS OVER TIME** sets a time window (Shift-click widens it to another bar), and a node of the process → event type Sankey sets an image or an event type.

The screenshot is from a quiet box, which makes it a good illustration of something else: **PipeConnected 201 (40.2 %), PipeCreated 198 (39.6 %), ProcessCreate 100 (20 %), FileCreate 1** — and almost all of it is `python.exe`, `wevtutil.exe`, `tasklist.exe` and `sc.exe`, which is the chamber checking on its own services. Named pipes dominate because provisioning rewrites SwiftOnSecurity's `PipeEvent` filter from its short include list into **exclude** mode: every pipe is logged except a handful of noisy image-*and*-name pairs, never by name alone, and the Sysmon log is enlarged to **512 MB** to hold it. That trade is what makes the next act's pipe work possible.

### Whom it talked to, and how to cut it off

![The Firewall tab in MAP view: a process tree with each process's endpoints and tags, arcs from the chamber to every public destination, the summary, and the red skull of the network cut]({{ site.baseurl }}/images/tdc-firewall.png)

The Firewall tab is built entirely out of telemetry Windows already produces: Sysmon 1, 3 and 22, `pfirewall.log`, PowerShell 4104/4103 and the BITS client log. Everything is re-read every **10 seconds**, and while a detonation runs the Sysmon and BITS sources drop to **1 second**. Being honest about what that means: the tab sees a connection *after* it was made. It does not hold one back.

Each flow is one process to one endpoint, tagged by what makes it interesting — `ioc` and `beacon` are critical, `direct-ip` (no DNS answer explains the address, so it was hard-coded) and `download` are high, `dga`, `dead-drop`, `lolbin` and `rare-port` (anything outside the usual list, plus 4444, 5555, 6666, 8888, 9999 and 31337) are medium, and `newborn` — the process was under **60 seconds** old when it connected — is low. A row and its arc take the colour of their most severe tag. Geo and ASN come from an offline table shipped with the repo, because the chamber never asks anyone online about an address it saw from malware, and every sample-derived URL or host name is defanged and never a link. There are **no byte counts** anywhere in the tab, for the plain reason that Sysmon records none; the bars and arcs scale with connection counts instead, and the summary says so rather than pretending.

The second half of the tab is where it stops being a monitor. **ASK** decides what happens when a process fetches a file: `Detonation`, the default, blocks a download by a submission or its descendants at once and *then* asks; `All` blocks every download except the chamber's own and the tool-update hosts; `Off` only tags. The decision toast offers **CUT + FETCH** (keep the block, let TDC fetch the file itself), **CUT ONLY** or **ALLOW** — and if nobody answers within **30 seconds**, TDC keeps the block and fetches the file anyway, because a stage-2 URL is often good for exactly one download. That also means the chamber contacts the C2 unattended, which is a thing worth knowing about a tool before it does it on your behalf.

![The Firewall tab during a cut: the red band explaining that one catch-all Block rule stands and was read back, the connection list with its tags, and the summary still reading BLOCKED 0]({{ site.baseurl }}/images/tdc-firewall-cut.png)

And then there is the panic button. **CUT THE NETWORK**, the red skull under the summary, and the **ISOLATED** switch in the head are one state and one press, with no confirmation. The first stage writes a single outbound Block rule for every program and every address (`TDC-FW-ISO-cut`) and reads it back in the same PowerShell call — **8.8 seconds** on a quiet VM, measured, against **38.5 s** for the version this replaced. One rule is enough because in Windows Firewall a Block rule beats every Allow rule: with it standing, DNS and `1.1.1.1` were dead while all **135** of Windows' own outbound Allow rules were still enabled. A background worker then spends about **59 seconds** switching those 135 off, recording exactly which ones it touched first, and setting each profile's outbound default to Block; only then does the catch-all rule go away.

Two things in that screenshot deserve pointing at. The band says **TDC cannot secure a sample in this state** — a catch-all Block rule blocks the chamber's own fetch too, so a stage-2 payload cannot be preserved while the box is cut. And **BLOCKED still reads 0**, because that counter counts per-endpoint and per-process rules and the cut is neither. The egress is shut and the counter says zero; the band is what tells you the truth. The way back without the Web UI is `scripts/tdc-unisolate.ps1`, run as Administrator in the VM, which restores exactly the rules that were recorded and removes every `TDC-FW-*` rule and nothing else.

## Act 2: My Own Payload Against the Same Engines

The engines do not know who wrote the sample. That is the whole reason this works in both directions: the model that grades a piece of commodity malware grades an implant I compiled an hour ago on exactly the same scale, and it will tell me which of my tricks survived contact with a defender and which one gave the whole thing away.

Two things have to be true first, or the answer is worthless. The host baseline has to be captured on a **clean** box, before anything has been detonated — **Sweep as baseline** takes about four minutes, **Full dump baseline** twenty or more — because anything that lands in the baseline stops counting as evidence forever after. And the scale has to be calibrated, which it is: three harmless test programs on the ARM64 VM score **CLEAN 0.75** for one that does nothing, **MALICIOUS 6.54** for the private RWX thread, PE copy and heap string of Act 1's `injectsim.exe`, and **SUSPICIOUS 2.9** for one that merely connects every two seconds — while a system-wide sweep of the clean VM, 139 processes, scores **0** once its baseline has been taken.

So when something comes back at 3.8 rather than 6.5, the difference is information and not noise.

### Does anything see it in memory

![The ThreatScan tab: the live process memory panel with Aether scan, memory dump, host baseline and whole-system sweep, and the scan history with the score history of 61 scans against the suspicious and malicious lines]({{ site.baseurl }}/images/tdc-live-memory.png)

ThreatScan is two halves. On a file it runs **ThreatCheck**, **DefenderCheck**, **EMBER2024** (eight models) and **capa**; against a running process it runs the **Live Process Memory** panel — an Aether scan by PID or by name, a memory dump, the host baseline, or a sweep of every process on the box. The baseline readout says what it currently knows: **575 keys**, 574 memory signatures and one reflective PE, captured on a date it shows you, so there is never any doubt about whether it predates the sample.

For payload work the single most useful button in the chamber is ThreatCheck, because it does not say *detected*, it says **at which offset** — and links that offset straight into the hex editor. That is the difference between knowing an engine hates your binary and knowing which bytes to go and change.

The **SCORE HISTORY** chart is the other half of the value: a point per scan, oldest left, with dashed lines at **SUSPICIOUS 2** and **MALICIOUS 6**, so a series of builds reads as a trend instead of a pile of verdicts. Over the **61 scans** in that screenshot: 29 clean, 12 suspicious, 3 malicious, and 17 with no score at all — the tools that return a classification rather than a number live in their own lane. The history rows below mix my own builds with the simulators: `rascal-linux-amd641` came back **CLEAN** from ThreatCheck and **TIMEOUT** from capa, while an Aether scan of PID 5876 scored **SUSPICIOUS 5.00** and an Exit Capture of PID 7824 **SUSPICIOUS 2.24**. A capa timeout is not a verdict, and the chamber does not dress it up as one.

### Does the beacon tick

![Detonation results of beaconsim.exe: SUSPICIOUS score 3.8, the beaconing finding at weight 3.00 with its interval and coefficient of variation, two in-memory matches at 0.40 and two at 0.00 marked cap reached, and the connection periodicity panel]({{ site.baseurl }}/images/tdc-detonation-beaconing.png)

This is the finding I care about most when I am testing a tunnel, and it is a nice illustration of the scoring model doing real work. `beaconsim.exe` comes back **SUSPICIOUS 3.8** — the same shape as the 2.9 calibration row above, in a run that also picked up two memory findings — and almost all of it is one finding at weight **3.00**: *periodic outbound connections* — **8 connections to 192.168.64.1:8769, every 2.0 s, 100 % of intervals on rhythm, robust CoV 0.00**. It is derived from Sysmon EID 3, not from memory, which means it keeps working after the process has exited. For anyone who has read my [ViperTunnel](https://benjitrapp.github.io/vipertunnel-reverse-socks/) post: this is the same arithmetic that post runs on the network side, taken here from the endpoint's own log.

Look at what happens to the rest. Two in-memory signature matches land at **0.40** each — a `VirtualProtect` reflective-load pattern seen in **3 of 3 samples**, and an `mscoree.dll` CLR shim reference — both corroborated by the network source at rule risk 5, and both explicitly annotated as *1 of 4* and *2 of 4 findings of this kind · group capped at 0.8*. The next two identical matches score **0.00**, marked *cap reached, not counted*. That is saturation: four hits of the same common kind cannot inflate a verdict past twice the strongest one. A tool that simply summed its hits would have called this thing malicious, and it would have been wrong.

### Is my pipe name a name everybody knows

![The Named Pipes tab: Sysmon pipe events with PID, process, pipe and C2 family column, and an interception session that relayed 58 messages of a detonation, each in hex and ASCII and marked PASSED]({{ site.baseurl }}/images/tdc-pipes.png)

Beacons talk to their children and to each other over named pipes, and the names are a give-away: Cobalt Strike's `\msagent_##`, `\postex_*` and `\status_*`, PsExec's `\PSEXESVC`, Covenant's `\gruntsvc`. The chamber flags a pipe in four ways, each weighted differently: `c2_default` is a structural fact taken from a catalogue (**4.0** for a C2 default, **3.0** for a remote-exec tool) and is never baseline-suppressed, so a default C2 pipe name on its own is enough to make a sample SUSPICIOUS; `cross_process` (created inside the sample's tree and connected from outside it, or the reverse) is behavioural at **1.5**; `sensitive_system` — connecting to `\svcctl`, `\lsarpc`, `\samr`, `\netlogon` or `\atsvc` — is **1.0**; and `random_name`, for GUIDs, hex runs and high-entropy tokens, is **0.8**. The last three all need corroboration before they count fully.

The catalogue is plain JSON, so adding a family is an entry with a pattern, a match mode, a weight and a note, no code. It carries Metasploit's `\msf-pipe`, the default of `reverse_named_pipe` — and deliberately has no entry for Sliver, because Sliver has no default pipe name at all; the operator always picks one. Which is exactly the kind of thing you want to know before you ship an implant with a hardcoded one.

Then there is the half that makes this more than observation. The Pipes tab runs interception sessions: **attach** to a pipe that already exists, or **arm** for the first *new* pipe matching an exact name, a prefix such as `postex_`, or a regex, and then either **observe** (relay and record) or **hold**, where every message waits until you forward it, edit it or drop it. The screenshot shows a session armed on the prefix `\msagent_` catching `\msagent_5e62b5` during a detonation and relaying **58 messages, 446 bytes recorded**, each one in hex and ASCII and marked **PASSED** — `task 27`, `beacon 28`, `task 28`, `beacon 29`. Sitting in the middle of your own implant's control channel and editing a task before it arrives is a very direct way to test how it handles a hostile server.

The limits are real and the docs are blunt about them: sessions are 10 minutes by default (an hour at most), 16 at a time, 1 MiB logged per message and 50 MiB per session; `\lsass`, `\ntsvcs`, `\protected_storage` and their NPFS aliases are refused outright; a client that was already connected before the session started is not intercepted; and a server that creates its pipe with `FILE_FLAG_FIRST_PIPE_INSTANCE` can notice or defeat the proxy entirely.

### Does it look packed from the outside

![PE header analysis of capa.exe in the hex tab: the SUSPICIOUS badge, the linker and overlay detection cards, an entropy map that is red across the whole file, and the file structure bar that is almost all overlay]({{ site.baseurl }}/images/tdc-pe-packing-analysis.png)

The PE analysis in the Hex tab gives a DiE-style overview: an assessment badge, cards naming the linker and anything that looks like a protector or an overlay, an entropy map coloured per block (**red at ≥ 7.0**), and a file-structure bar with the regions laid out to scale. The example is honest about what the view is good at — this is `capa.exe`, a legitimate PyInstaller bundle of **35 MB**, and it is flagged **SUSPICIOUS** because of a **36 MB data overlay at entropy 8.00**. Almost the entire file is overlay. That is also precisely what a packed payload looks like from the outside, which is the point: the view tells you what an engine's heuristic will see, not what the file is.

![The file map of injectsim.exe: byteplot, local entropy and PE structure planes side by side with their legends]({{ site.baseurl }}/images/tdc-file-map.png)

The FileMap tab puts three planes of the same file side by side at one byte per cell: a byteplot (0xFF, 0x00, visible ASCII, invisible ASCII, non-ASCII), local entropy (repetition, code, packed), and the PE structure — headers, section table, `.text`, `.rdata`, `.data`, `.pdata`, `.tls`, `.reloc`, the TLS directory, imports, the IAT, debug info, the exception table, relocations and the entry point, each in its own colour. `injectsim.exe` reads **184.0 KB, overall entropy 6.468, 19 regions**. A click on any plane jumps to that offset in the hex editor, which is how a suspicious band becomes a hex dump in one step.

### What does it actually do

![The Rizin tab with pipesim.exe: the function list, the disassembly at the instruction that loads the pipe name, the control flow graph of that function, and a console session that found the string and followed its reference]({{ site.baseurl }}/images/tdc-rizin.png)

And when the question stops being "is it detected" and becomes "what did I actually compile", there is **rizin 0.9.1** with the **rz-ghidra** decompiler on the VM, driven from the browser. FUNCTIONS, DISASSEMBLY, DECOMPILER and HEX sit beside the control-flow GRAPH, all pinned to one current address that a click, `SEEK` + `GO`, the back and forward arrows, or a seek in the console moves together. The file is only ever read: nothing is written to it or next to it, and there is no debugging.

The screenshot is the two-minute version of a real question. `pipesim.exe` — **PE64, x86-64, 186.5 KB, analysed with `aaa` in 3.3 s, 127 functions** — and the console session underneath finds the pipe name and walks back to the code that uses it: `iz~msagent` turns up `\\.\pipe\msagent_%04x%02x` in `.rdata` at `0x140026056`, `s` seeks there, `axt` reports the one reference — `fcn.140001000` at `0x1400010a7`, a `lea r8` of that string — and seeking to it brings the disassembly, the decompiler and the 31-block control-flow graph of that function along with it.

The engineering detail I like most here is the console. rizin 0.9.1 has no sandbox mode of its own, and the Web UI runs as SYSTEM with no login, so every command is checked against a server-side allowlist before rizin ever sees it. The families `a p i f C s / ? x t b e` are permitted — analysis, print, info, flags, comments, seek, search, help, hexdump, types, block size, settings — while `!`, `|`, `>`, backticks, `o` (open), `w` (write), `d` (debug), `.` (scripts) and `(` (macros) come back as a single line, `refused: '!' is not allowed: no shell commands`, and nothing moves. Even `aa` and `aaa` are refused from the console, because they outlast a command's 60-second budget; the **Full analysis** button runs their steps one at a time instead. The threshold between the two is file size — `aaa` up to 20 MB, `aa` above it — and measured under x64 emulation on the ARM64 VM, `aa` of a **31 MB** exit dump with **10,295 functions** takes under four seconds, with a Full analysis of it another 23 to 24.

## The Rest of the Box

Two acts do not use every tab. Here is what is left, in one paragraph each.

**LOGS** searches six sources in one place with a subset of Splunk's search language: `powershell` (script blocks 4104, module logging 4103, engine errors 4100), `access` (every HTTP request to the Web UI), `mcp` (every action of the MCP server), `netflow` (Sysmon 3 bundled into flows), `dns` (Sysmon 22) and `firewall` (`pfirewall.log`). Terms take `field=value`, `field>n`, `AND`/`OR`/`NOT` and parentheses; the pipes are `head`, `tail`, `sort`, `dedup`, `table`, `fields`, `stats`, `top`, `rare` and `timechart`.

![The LOGS tab running source=dns top 10 query: the six source chips with their counts, events over time, the field bar, and the result as a sortable table]({{ site.baseurl }}/images/tdc-logs.png)

`source=dns | top 10 query` over seven days: **10 rows from 252 events in 93.9 ms**. The Firewall tab's **HUNT FURTHER** card hands over ready-made versions of the ones worth having — `source=firewall action=DROP | stats count by dst_ip, dst_port` for what was dropped, `source=dns result="-" | top query` for names that never resolved (the DGA suspects), `source=powershell "http" | head 50` for download cradles in clear text. And the screenshot is a good argument for reading a top list carefully: most of it is the chamber installing and updating its own tools — the docs vouch for `www.loldrivers.io` and `download.sysinternals.com` as installer downloads, `dc.services.visualstudio.com` is telemetry — and `WIN-T6JBL58QBH8` is a NetBIOS name, not a domain at all. A host name in a DNS top list is not automatically somewhere the malware went.

![An own dashboard named Log watch with four tiles: requests by path as a pie, DNS names as bars, sources over time as a line chart and the firewall action-protocol flow as a Sankey, each with the query it was saved from]({{ site.baseurl }}/images/tdc-dashboards.png)

**Own dashboards** come out of that search box. Any result that has a form can be saved as a tile with **SAVE**, and the tile stores only the name, the query, the form and the time range — never numbers, so it recomputes against the live log every time. Up to ten dashboards with twelve tiles each, computed one after another rather than all at once. The `Log watch` page above is four of them: requests by path as a pie, `source=dns | top query` as bars, `* | timechart span=5m count by source` as a line chart, and `source=firewall | stats count by action, protocol` as a Sankey — with the warning line a tile inherits honestly from the tab, *only the newest 10,000 matches went into the pipes*.

**The ETW browser** reads twelve event-log channels — Sysmon, Security, PowerShell, Defender, WMI, Task Scheduler, BITS, DNS, Firewall, AppLocker, WinRM, Application — probes each for whether it has data at all (● ACTIVE / ○ NO DATA), refreshes every five seconds, and highlights events it classifies as malicious with a reason: encoded PowerShell, LOLBin abuse, credential access, persistence, defense evasion, lateral movement, C2 indicators, Sysmon IOCs.

![The ETW browser: the Sysmon channel with one event expanded, all of its fields listed and the suspicious values highlighted]({{ site.baseurl }}/images/tdc-etw-browser.png)

**Two themes.** Cyberpunk is the default, neon on deep violet; Telemetry is cyan, magenta and acid green on near-black blue, with a fine grid and scanlines. **✶** switches between them instantly, without reloading — the open tab, any open detail view, the filters, the drilldown steps, sort orders, the graph and even running pipe interception sessions all stay exactly as they were. That works because the UI draws its charts itself as SVG, with no chart library, so a palette change is a repaint.

![The service dashboard in the Telemetry theme: cyan, magenta and acid green on near-black blue, with a fine grid and scanlines]({{ site.baseurl }}/images/tdc-theme-telemetry.png)

**Tool updates** keep the box current without re-provisioning it. Every tool is listed with its installed and available version, checked through `choco outdated`, `winget list --upgrade-available`, commits behind upstream for the git-based ones, GitHub releases, and — for Sysmon — the `ETag` of the download against the one recorded at install. Three tools are pinned for compatibility (Rustinel **1.1.1**, Fibratus **3.0.0**, Rizin via Cutter **2.5.0**) and `python312` is held back because the Web UI runs on it; it is always updated last. A script gets at most 45 minutes, a failure of one tool does not stop the run, and there is no rollback.

![The tool updates panel: every tool with its installed and available version, the pinned ones marked, and the skull button that updates all of them]({{ site.baseurl }}/images/tdc-tool-updates.png)

**The offline wiki** is the part I did not expect to need. `make docs` builds the whole guide into a single `wiki.html` — every page, the screenshots embedded, the Mermaid diagrams drawn, the search box working — that opens without a network. On a VM that has no internet at all, which is how the chamber should be run, that file *is* the documentation.

![The offline wiki: the navigation of all fifteen pages with a search box, and the index page with the architecture diagram drawn by the embedded Mermaid]({{ site.baseurl }}/images/tdc-wiki.png)

## Running It

```bash
# macOS on Apple Silicon - guided setup: tools, VM, provisioning
./scripts/setup-macos-utm.sh
make open                    # http://<vm-ip>:9000

# Just the Web UI, no VM - every tab renders, the services are absent
make install
make run                     # http://localhost:9000
```

```powershell
.\make.ps1 up                # Windows with Hyper-V, as Administrator
.\make.ps1 open
```

First boot takes about 20-30 minutes on Windows and 30-45 on macOS ARM.

| Host | Hypervisor | Guest | Notes |
|------|-----------|-------|-------|
| Windows 10/11 (x86_64) | Hyper-V | Windows 11 x86_64 | Native, `Vagrantfile` |
| macOS Apple Silicon (M1-M4) | UTM (or QEMU, experimental) | Windows 11 ARM64 | Near-native via hvf |

On ARM64 the OS, the execution agent and the runtimes are native. Fibratus, Rustinel, the beacon scanners and rizin have no ARM64 build and run under Windows' x86_64 emulation — which is also what x64 samples do, so they meet the sample on its own terms — and Aether is x64 *deliberately*, because its thread-context probe uses the AMD64 `CONTEXT` layout and a native ARM64 build would misread it. The interesting consequence is in memory analysis: the emulator's translation cache *is* private executable memory, exactly what an injected payload looks like. Exit Capture and Process Dump classify those regions by content — ARM64 instruction density, single-RET stub pages — and list them as host artifacts instead of scoring them. `pd64.exe -closemon` is deliberately not used, because it writes x64 hook bytes into every process and decides the architecture from "PE32+" alone, which is also true of native ARM64 processes.

Security, briefly, because this is a box built to run malware:

- Snapshot before each detonation, and keep it on an isolated network.
- The Web UI has **no login**, and `/api/submit` executes files by design.
- Rustinel's active response is off by default; Defender exclusions cover the detonation paths only.
- What hardening there is protects the *host* from the VM, not the VM from the sample: state-changing requests whose `Origin` or `Referer` names another site are refused, so a page opened in the VM's browser cannot submit a sample; only IP addresses, `localhost` and names in `TDC_ALLOWED_HOSTS` are accepted in the `Host` header; writes are confined to the hex-upload folder, `C:\Temp`, `C:\Users\Public\Downloads` and `C:\dumps`; and the rizin console has the allowlist from Act 2.

## What I Would Change Next

The honest list, taken from the limitations the guide documents rather than invented for the occasion:

- **Exit Capture is armed by image name.** A child process that renames itself is covered only by the live scanners and the network log. The dump that caught `injectsim.exe` would have missed a second-stage process called something else.
- **Live-memory findings depend on timing.** `injectsim.exe` exited before Aether's first sample, which is why its verdict came from the exit dump. Anything you want to compare across builds needs several samples, not one.
- **The download detection has a known gap.** It sees a URL in a PowerShell script block, in a Sysmon command line, or in the BITS log. A compiled loader that calls WinHTTP itself shows up as a bare connection, with nothing to decide about.
- **A cut box cannot preserve a stage 2.** While the catch-all Block rule stands, the chamber's own fetch is blocked along with everything else, so isolation and sample capture are mutually exclusive by construction.

## Links

- Source: [github.com/BenjiTrapp/transportable-detonation-chamber](https://github.com/BenjiTrapp/transportable-detonation-chamber)
- The guide: [`docs/`](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/README.md) — one page per topic, including [the API and MCP tools](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/api.md), [configuration](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/configuration.md), [live memory](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/memory.md), [named pipes](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/pipes.md), [the firewall](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/firewall.md), [the logs](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/logs.md) and [rizin](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/rizin.md)
- [A walk through the Web UI as a GIF](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/static/demo.gif) — 10 MB, so it is a link rather than an embed

The chamber is mostly other people's work, wired together. These are the engines and scanners that do the actual detecting; the full list, including the reverse engineering tools and the sample browser, is in the repository's credits:

| Project | Role |
|---------|------|
| [dobin/detonator](https://github.com/dobin/detonator) and [DetonatorAgent](https://github.com/dobin/DetonatorAgent) | Orchestration and execution |
| [rabbitstack/fibratus](https://github.com/rabbitstack/fibratus) | Kernel ETW detection engine |
| [Karib0u/rustinel](https://github.com/Karib0u/rustinel) | Sigma / YARA EDR agent |
| [BlackSnufkin/LitterBox](https://github.com/BlackSnufkin/LitterBox) | Payload analysis sandbox |
| [0xsp-SRD/aether](https://github.com/0xsp-SRD/aether) | Live-process memory forensics |
| [glmcdona/Process-Dump](https://github.com/glmcdona/Process-Dump) | Memory component dumper |
| [thefLink/Hunt-Sleeping-Beacons](https://github.com/thefLink/Hunt-Sleeping-Beacons) | Sleeping beacon callstack scanner |
| [mandiant/capa](https://github.com/mandiant/capa) | Static capability detection |
| [FutureComputing4AI/EMBER2024](https://github.com/FutureComputing4AI/EMBER2024) | ML malware classifier |
| [rizinorg/rizin](https://github.com/rizinorg/rizin) and [rz-ghidra](https://github.com/rizinorg/rz-ghidra) | Reverse engineering and decompilation |
| [ytisf/theZoo](https://github.com/ytisf/theZoo) | Malware sample repository |
