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

## What Fired: Alerts, Tracing, Graph

### Alerts — every detection in one table

![The Alerts tab: severity and engine pies, alerts over time, and the engine to rule to process Sankey with the YARA hacktool and Cobalt Strike rules in it]({{ site.baseurl }}/images/tdc-alerts.png)

Every detection of Rustinel, Fibratus and LitterBox lands here, newest first, under charts of whatever the filters currently let through — **11,894 of 11,894** in this shot, Sigma 11,643 against YARA 237 and fibratus 14. The table lists the newest 2,000 and says so; the charts count all of them.

The Sankey is the part I actually use. It reads engine → rule → process, and it says which rule carried which process: *Registry Run Key Persistence* 6,150 almost entirely into `MsMpEng.exe` (6,190), *Suspicious Encoded PowerShell Command Line* 4,691 into `powershell.exe` (4,716), then the long tail — *Winlogon Helper DLL or Shell Modification* 570, *WMI Event Subscription Persistence* 212.

And then the two bands worth staring at if you build tooling: **`Windows_Hacktool_COFFLoader_81ba13b8`** and **`Windows_Trojan_CobaltStrike_a56b820f`**, 81 hits each. Those are Elastic's YARA rules firing on this box, and the Sankey names the process that carried each one. If your loader is a COFF loader, this is the view that tells you a stock rule set already has a name for it — and clicking the band gets you to the alerts, the process and the raw event behind it.

Clicks are drilldown steps, not filters: pies, bars and bands narrow the table and the charts together, a **BACK** button walks the path back out, and the buckets (*other rules*, *other processes*) deliberately set no filter, because they stand for names the table would not actually list.

### Tracing — one process, start to finish

![The Rustinel trace console for MsMpEng.exe: the MALICIOUS 100 of 100 verdict badge, the timeline split by event type, the process tree with alert counts and the table of rules that fired]({{ site.baseurl }}/images/tdc-tracing.png)

The trace console takes one process and lays its whole life out. This `MsMpEng.exe` — Defender's own engine, which on an analysis box spends its day touching the registry — scores **MALICIOUS · 100/100** across **345 events** over **34m 37s**, and the tabs beside VERDICT give the breakdown that matters: **HTTP REQUESTS 0, CONNECTIONS 0, DNS REQUESTS 0, FILES 0, REGISTRY 345**. It never touched the network. Everything it did, it did to the registry.

For your own payload this is where you check *shape* rather than detection. A beacon that claims to be quiet and shows forty registry writes in its first minute is not quiet, whether or not a rule fired on it.

### Graph — the inventory, and then the tree

![The Graph landing page: sample cards with their scan verdicts, and below them the processes worth investigating with their threat counts]({{ site.baseurl }}/images/tdc-graph-landing.png)

The Graph tab opens on an inventory rather than a graph, and it is the most useful page in the box for iterating on a build. Every sample ever submitted or scanned, with whatever verdicts it has collected: `rascal-linux-amd641` **CLEAN** with ThreatCheck clean and a capa **TIMEOUT** beside it, `rascal-windows-amd64.exe` at 39.2 MB still **UNSCANNED**, the four simulators that ship with the project, and `mimikatz.exe` at 1.3 MB. Below them, the processes worth investigating: `rascal-windows-amd64.exe` PID 5876 **detonated · 3 threats**, `mimikatz.exe` PID 10804 **detonated · 2 threats**.

Note the capa timeout sitting there as a timeout. It is not quietly folded into "clean".

![The process graph focused on an explorer.exe instance: winlogon to userinit to explorer to its children, each node carrying its alert count]({{ site.baseurl }}/images/tdc-graph-tree.png)

Click a process and you get its tree — ancestors above, children below, each node carrying its alert count. Here `explorer.exe` (2316) with 11 alerts of its own, descended from `winlogon.exe` through `userinit.exe`, with `OneDrive.exe` and `msedge.exe` under it. Tree, force-directed and isometric layouts are a dropdown apart; in the isometric view two processes on the same named pipe are joined by a raised bridge.

One detail that makes the tree trustworthy: Windows reuses PIDs, so every process here is an *instance*. The newest holder of a PID is addressed by the plain number and earlier ones as `<pid>@<start epoch>`, and alerts, events and children belong to whichever instance was alive at the time. I ran into this while taking these screenshots — PID 5876, which was my implant a week ago, is a `cmd.exe` today. Without instance keys, a long-lived analysis VM turns into one long case of mistaken identity.

## What It Touched: Pipes, Sysmon, ETW

### Pipes — and sitting in the middle of your own C2

![The Named Pipes tab: Sysmon pipe events with their C2 family column, the interception form with its options, and the list of past interception sessions]({{ site.baseurl }}/images/tdc-pipes.png)

Beacons talk to their children and to each other over named pipes, and the names give them away: Cobalt Strike's `\msagent_##`, `\postex_*` and `\status_*`, PsExec's `\PSEXESVC`, Covenant's `\gruntsvc`. Sysmon logs every pipe creation and connection on this box — provisioning switches SwiftOnSecurity's `PipeEvent` filter from its short include list into **exclude** mode, so everything is logged except a handful of noisy image-*and*-name pairs, and the log is enlarged to **512 MB** to hold it.

The **FAMILY** column is the payoff: it names the C2 family a pipe name belongs to, from a catalogue that is plain JSON. A match flags `c2_default`, which is structural evidence — weight **4.0** for a C2 default, **3.0** for a remote-exec tool — and is never baseline-suppressed, so one default pipe name on its own makes a sample SUSPICIOUS. The other three flags need corroboration: `cross_process` at 1.5, `sensitive_system` at 1.0 for `\svcctl`, `\lsarpc`, `\samr`, `\netlogon` or `\atsvc`, and `random_name` at 0.8 for GUIDs and high-entropy tokens. The catalogue carries Metasploit's `\msf-pipe` and deliberately has **no entry for Sliver**, because Sliver has no default pipe name — the operator always picks one. Which is exactly what you want to know before you ship an implant with a hardcoded one.

Then the half that is not observation. **INTERCEPTION** puts the Web UI in the middle of a pipe: **attach** to one that exists, or **arm** for the first new pipe matching an exact name, a prefix or a regex, then **observe** (relay and record) or **hold**, where every message waits until you forward it, edit it or drop it. The session list in that screenshot is a working afternoon: `\msagent_7d6e15` armed on a prefix and relaying **58 messages**, `\tdc_test` in hold mode, `\tdc_squat` with squatting on. Editing a task before it reaches your own beacon is a very direct way to find out how it handles a hostile server — and squatting tells you whether it even notices somebody got to its pipe name first.

The limits are blunt: 10-minute sessions by default (an hour at most), 16 at a time, `\lsass`, `\ntsvcs`, `\protected_storage` and their NPFS aliases refused outright, a client already connected before the session is not intercepted, and a server that uses `FILE_FLAG_FIRST_PIPE_INSTANCE` can defeat the proxy entirely.

### Sysmon — with the Windows Event IDs beside it

![The Sysmon tab: events over time stacked by type, a process to event type Sankey, the type counters and the table with its Windows Event ID column]({{ site.baseurl }}/images/tdc-sysmon.png)

The same correlation at log scale, and the **WIN. EID** column is the reason this view exists: each Sysmon event carries the Windows Event IDs it corresponds to — 4688 and 4689 for a process create and its exit pair, 4656 for a handle request — so a Sysmon-based detection can be translated into one that works on a box with no Sysmon at all.

The charts narrow the table: a bar of **EVENTS OVER TIME** sets a time window, a node of the process → event type Sankey sets an image or a type. This shot is a quiet box, and that is instructive in itself — of the last 500 events, **PipeConnected 210, PipeCreated 183, ProcessCreate 94, FileCreate 9, NetworkConnect 2, RegistryValueSet 2**, almost all of it `python.exe`, `wevtutil.exe`, `tasklist.exe` and `sc.exe`, which is the chamber checking on its own services. That is the baseline you are hiding in.

### ETW — twelve channels, flagged

![The ETW browser: the event log channels with their availability, and events classified with a threat badge]({{ site.baseurl }}/images/tdc-etw.png)

Beyond Sysmon, the ETW tab reads twelve Windows event log channels — Sysmon, Security, PowerShell, Defender, WMI, Task Scheduler, BITS, DNS, Firewall, AppLocker, WinRM, Application — probes each for whether it has any data at all, refreshes every five seconds, and highlights the events it classifies as malicious with the reason: encoded PowerShell, LOLBin abuse, credential access, persistence, defense evasion, lateral movement, C2 indicators, Sysmon IOCs. It is the "what would a SOC with no EDR have seen" view.

## Whom It Talked To: Firewall and LOGS

### Firewall — watch, tag, cut, and still keep the stage 2

![The Firewall tab in MAP view: the world map with the chamber at its centre, the ready-made hunting queries, and the red skull of the network cut]({{ site.baseurl }}/images/tdc-firewall.png)

This tab is built entirely out of telemetry Windows already produces: Sysmon 1, 3 and 22, `pfirewall.log`, PowerShell 4104/4103 and the BITS client log. Everything is re-read every **10 seconds**, and while a detonation runs the Sysmon and BITS sources drop to **1 second**. Being honest about what that means: it sees a connection *after* it was made. It does not hold one back.

![The Firewall tab in LIST view: every flow with its process, endpoint, country, ASN and tags, and the summary with its counters]({{ site.baseurl }}/images/tdc-firewall-list.png)

LIST is where the work happens. **18 connections** on this box, each one process to one endpoint with its country, its ASN and its tags. Three `svchost.exe` instances reaching Microsoft and Fastly and one GCore address in Luxembourg, all tagged **`direct-ip`** — no DNS answer explains the address, so it was hard-coded. And two `powershell.exe` processes on port 5985 tagged **`lolbin`** and **`dga`**, one of them also **`newborn`** because the process was under 60 seconds old when it connected.

The tag set is the quick read on a flow: `ioc` and `beacon` are critical, `direct-ip` and `download` high, `dga`, `dead-drop`, `lolbin` and `rare-port` medium (anything outside the usual list, plus 4444, 5555, 6666, 8888, 9999 and 31337), `newborn` low. Geo and ASN come from an offline table shipped with the repo, because the chamber never asks anyone online about an address it saw from malware. There are **no byte counts** anywhere — Sysmon records none — so the bars scale with connection counts and the summary says so instead of inventing a number.

Then the part I am most pleased with. **ASK** decides what happens when a process fetches a file: `Detonation`, the default, blocks a download by a submission or its descendants at once and *then* asks; `All` blocks every download except the chamber's own; `Off` only tags. The toast offers **CUT + FETCH** — keep the block, let TDC fetch the file itself — or **CUT ONLY**, or **ALLOW**. If nobody answers in **30 seconds**, TDC keeps the block and fetches the file anyway, because a stage-2 URL is often good for exactly one download. That also means the chamber contacts the C2 unattended, which is a thing worth knowing about a tool before it does it on your behalf. What it fetches lands in **SECURED SAMPLES**, which are never executed: the buttons beside them are RIZIN, HEX and THREATSCAN.

And the skull. **CUT THE NETWORK**, the switch in the head and the red button under the summary are one state and one press, with no confirmation. The first stage writes a single outbound Block rule for every program and every address (`TDC-FW-ISO-cut`) and reads it back in the same call — **8.8 seconds** measured on a quiet VM. One rule is enough because in Windows Firewall a Block rule beats every Allow rule: with it standing, DNS and `1.1.1.1` were dead while all 135 of Windows' own outbound Allow rules were still enabled. A background worker then spends about **59 seconds** switching those 135 off and setting each profile's outbound default to Block.

Two honest notes. While the cut is in place TDC **cannot secure a sample** — a catch-all Block rule blocks its own fetch too, so isolation and stage-2 capture are mutually exclusive by construction. And **BLOCKED keeps reading 0**, because that counter counts per-endpoint and per-process rules and the cut is neither. The egress is shut and the counter says zero; the band above the table is what tells you the truth.

### LOGS — a small Splunk for one VM

![The LOGS tab: the six source chips with their counts, events over time, the COMMANDS card listing the whole search language, and the event list]({{ site.baseurl }}/images/tdc-logs.png)

Six log sources in one search box: `powershell` (script blocks 4104, module logging 4103, engine errors 4100), `access` (every HTTP request to the Web UI), `mcp` (every action of the MCP server), `netflow` (Sysmon 3 bundled into flows), `dns` (Sysmon 22) and `firewall` (`pfirewall.log`). On this box that is **22,258 events** in the window, answered in 2.7 seconds, with the chips carrying each source's count: POWERSHELL 1,758, ACCESS 10,000, MCP 1, NETFLOW 229, DNS 286, FIREWALL 10,000.

The **COMMANDS** card on the left is the whole query language on one screen — ten search forms (`word`, `"a phrase"`, `field=value`, `field!=value`, `field>5`, `AND`, `OR`, `NOT`, `( )`, `*`), ten pipes, two time keywords and the six sources — and a click appends the command to the search box rather than replacing it. The field bar underneath lists every field in the matches with its top values; a click adds `field="value"` to the query.

![The LOGS tab after a stats query: the statistics table with the result forms table, pie, bars, line and Sankey beside it]({{ site.baseurl }}/images/tdc-logs-stats.png)

Add a pipe and the answer changes shape. `source=firewall | stats count by action, protocol` returns **4 rows from 10,000 events in 296 ms** — ALLOW/TCP 9,904, ALLOW/UDP 76, ALLOW/ICMP 15 — and the result row offers **TABLE · PIE · BARS · LINE · SANKEY**, greying out the forms this particular answer cannot take, with the reason in the tooltip.

The Firewall tab's **HUNT FURTHER** card hands over the queries worth having pre-written: `source=firewall action=DROP | stats count by dst_ip, dst_port` for what was dropped, `source=dns result="-" | top query` for names that never resolved — the DGA suspects — and `source=powershell "http" | head 50` for download cradles in clear text. A row, a map point or a decision toast opens LOGS with the right query and a five-minute window either side.

For payload work the `powershell` source is the one I keep coming back to. If any part of your chain touches PowerShell, script block logging has the whole script, reassembled from its parts, searchable. You find out what your own loader looks like in a defender's log before a defender does.

![An own dashboard named Log watch with four tiles: requests by path as a pie, DNS names as bars, sources over time as a line chart and the firewall flow as a Sankey]({{ site.baseurl }}/images/tdc-dashboards.png)

Any result with a form can be saved as a tile with **SAVE**, onto a dashboard page of your own beside the service dashboard. A tile stores only its name, query, form and time range — never numbers — so it recomputes against the live log every time; up to ten dashboards with twelve tiles each, computed one after another. The `Log watch` page here is four of them, and the honest warning line travels with the tile: *only the newest 10,000 matches went into the pipes*.

## What It Is Made Of: ThreatScan, Hex, FileMap, Rizin, LitterBox

### ThreatScan — which byte, and what is in memory right now

![The ThreatScan tab: the static scanner row with its tools, the live process memory panel with its baseline controls, and the score history]({{ site.baseurl }}/images/tdc-threatscan.png)

Two halves. On a file: **ThreatCheck**, **DefenderCheck**, **EMBER2024** with eight models and a threshold, and **capa** — all static, with the note on the button to prove it: *runs the selected static analyzers on one file — no execution*.

ThreatCheck is the single most useful button in the box for payload work, because it does not say *detected*, it says **at which offset** — and links that offset into the hex editor. That is the difference between knowing an engine hates your binary and knowing which bytes to go and change.

The other half is **LIVE PROCESS MEMORY**: an Aether scan by PID or by name, a memory dump, a whole-system sweep, and the baseline controls that make all of it meaningful. The readout says what the box currently knows — **575 keys**, 574 memory signatures and one reflective PE, captured at a timestamp it shows you — and the discipline is strict: capture the baseline on a **clean** box, before anything has been detonated, because anything that lands in the baseline stops counting as evidence forever after. **SCORE HISTORY** then plots a point per scan against the SUSPICIOUS and MALICIOUS lines, so a series of builds reads as a trend rather than a pile of verdicts.

### Hex — the bytes, with structure

![The Hex editor: the structure map above the dump, the dump itself with its ASCII column, and the data inspector]({{ site.baseurl }}/images/tdc-hex.png)

A hex editor with a structure minimap above the dump, a data inspector that decodes the byte under the cursor as Int8 through Int64, Float32/64, ASCII and UTF-16, and **PE ANALYSIS**, **ELF ANALYSIS** and **RIZIN** one button away. It is where a ThreatCheck offset lands, which is most of why it exists.

### FileMap — the whole file at a glance

![The File Map: byteplot, local entropy and PE structure planes side by side with their legends]({{ site.baseurl }}/images/tdc-filemap.png)

Three planes of one file at a byte per cell: a **byteplot** (0xFF, 0x00, visible ASCII, invisible ASCII, non-ASCII), **local entropy** (repetition, code, packed) and the **PE structure** — headers, section table, `.text`, `.rdata`, `.data`, `.pdata`, `.tls`, `.reloc`, the TLS directory, imports, the IAT, debug info, the exception table, relocations, the entry point. `injectsim.exe` reads **184.0 KB, overall entropy 6.468, 19 regions**. A click on any plane jumps to that offset in the hex editor.

This is the view where a packed blob, an appended payload or a suspiciously high-entropy section announces itself before you have read a single byte — including in your own build, where "wait, why is that region bright" is usually the start of a useful afternoon.

### Rizin — reversing in the browser

![The Rizin tab: the function list, the disassembly of the pipe-name function, its control flow graph, and the console session that found the string]({{ site.baseurl }}/images/tdc-rizin.png)

**rizin 0.9.1** with the **rz-ghidra** decompiler runs on the VM and is driven from the browser: FUNCTIONS, DISASSEMBLY, DECOMPILER and HEX beside the control-flow GRAPH, all pinned to one current address that a click, SEEK, the back and forward arrows or a seek in the console moves together. The file is only ever read — nothing written to it or beside it, and no debugging.

The screenshot is a two-minute question answered. `pipesim.exe`, **PE64, x86-64, 186.5 KB, analysed with `aaa` in 2.5 s, 127 functions**, and the console underneath walks from a string to the code that uses it: `iz~msagent` turns up `\\.\pipe\msagent_%04x%02x` in `.rdata` at `0x140026056`, and seeking to its one reference lands in `fcn.140001000` — 1,312 bytes, **31 blocks** in the graph — where the disassembly shows the pipe name being loaded, a `CreateThread` call and a `str.child` comparison right next to each other. That is the pipe-and-child machinery of a beacon, found without leaving the browser.

The engineering detail I like most is the console. rizin 0.9.1 has no sandbox mode of its own and the Web UI runs as SYSTEM with no login, so every command is checked against a server-side allowlist first. The families `a p i f C s / ? x t b e` are permitted — analysis, print, info, flags, comments, seek, search, help, hexdump, types, block size, settings — while `!`, `|`, `>`, backticks, `o` (open), `w` (write), `d` (debug), `.` (scripts) and `(` (macros) come back as one line, `refused: '!' is not allowed: no shell commands`, and nothing moves.

### LitterBox — the sandbox verdicts beside everything else

![The LitterBox tab: the files in the sandbox with their static, dynamic and EDR results]({{ site.baseurl }}/images/tdc-litterbox.png)

LitterBox does the static and dynamic sandbox pass — YARA, strings, PE-Sieve, Moneta, HollowsHunter — and this tab lists what it holds with its results, so its opinion sits beside the EDR alerts and the memory findings instead of in a second browser tab. Its score only joins the combined verdict once it is high enough to mean something, and the VERDICT FLOW says when it did.

## Submitting, and the Two Themes

![The Submit tab: the drop zone with its target and EDR mode selectors, and the submission history under the verdict history chart]({{ site.baseurl }}/images/tdc-submit.png)

Submission itself is a drop zone, a target — **Agent** for execution, **LitterBox** for analysis, or **Both** — an EDR mode, and a button. What makes it more than an upload form is **VERDICT HISTORY** above the list: one bar per submission, oldest left, as high as its verdict's score and in that verdict's colour, with dashed lines at SUSPICIOUS and MALICIOUS.

That chart is the loop I actually work in. Build, detonate, read the scored findings, fix the one with the highest weight, build again — and watch the bar come down. The history below it keeps the file name and SHA-256 of every build, so "which version was it that stopped tripping the Rubeus string" has an answer.

![The same dashboard in the Telemetry theme: cyan, magenta and acid green on near-black blue, with a grid and scanlines]({{ site.baseurl }}/images/tdc-theme-telemetry.png)

And because a tool you stare at for hours should be bearable: two themes. Cyberpunk is the default, neon on deep violet, and everything above is in it. Telemetry is cyan, magenta and acid green on near-black blue with a fine grid and scanlines. **✶** switches between them instantly, without reloading — the open tab, any detail view, the filters, the drilldown steps, sort orders, the graph and even running pipe interception sessions all stay exactly as they were. That works because the UI draws its charts itself as SVG, with no chart library, so a palette change is just a repaint.

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
- What hardening there is protects the *host* from the VM, not the VM from the sample: state-changing requests whose `Origin` or `Referer` names another site are refused, so a page opened in the VM's browser cannot submit a sample; only IP addresses, `localhost` and names in `TDC_ALLOWED_HOSTS` are accepted in the `Host` header; writes are confined to the hex-upload folder, `C:\Temp`, `C:\Users\Public\Downloads` and `C:\dumps`; and the rizin console has the allowlist described above.

## What It Is Not

The limits are documented in the guide, and they are the kind that change how you read a result:

- **Exit Capture is armed by image name.** A child process that renames itself is covered only by the live scanners and the network log.
- **Live-memory findings depend on timing.** A sample that exits in under a second is read from its exit dump instead, and anything you want to compare across builds needs several samples rather than one.
- **The download detection has a known gap.** It sees a URL in a PowerShell script block, in a Sysmon command line, or in the BITS log. A compiled loader that calls WinHTTP itself shows up as a bare connection with nothing to decide about.
- **A cut box cannot preserve a stage 2.** Isolation and sample capture are mutually exclusive by construction.
- **A capa timeout is not a verdict,** and the chamber will not pretend otherwise — it says TIMEOUT and leaves the card empty.
- **It is a lab box, not an appliance.** The dashboard in this post reads 5/6 services online because I had one switched off, the Sysmon view is mostly the chamber watching itself, and two of the names in a DNS top list are its own tool installers. That is what an honest analysis VM looks like between jobs.

## Links

- Source: [github.com/BenjiTrapp/transportable-detonation-chamber](https://github.com/BenjiTrapp/transportable-detonation-chamber)
- The guide: [`docs/`](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/README.md) — one page per topic, including [the API and MCP tools](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/api.md), [configuration](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/configuration.md), [live memory](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/memory.md), [named pipes](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/pipes.md), [the firewall](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/firewall.md), [the logs](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/logs.md), [rizin](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/rizin.md) and [every view in detail](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/docs/web-ui.md)
- [A walk through the Web UI as a GIF](https://github.com/BenjiTrapp/transportable-detonation-chamber/blob/main/static/demo.gif) — 10 MB, so it is a link rather than an embed
- `make docs` builds the whole guide into a single `wiki.html` that opens without a network, which is what the documentation is on a VM that has no internet at all

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
| [elastic/protections-artifacts](https://github.com/elastic/protections-artifacts) | The YARA rules that named the COFF loader |
| [rizinorg/rizin](https://github.com/rizinorg/rizin) and [rz-ghidra](https://github.com/rizinorg/rz-ghidra) | Reverse engineering and decompilation |
| [ytisf/theZoo](https://github.com/ytisf/theZoo) | Malware sample repository |
