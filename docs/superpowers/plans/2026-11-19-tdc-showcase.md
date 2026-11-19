# TDC Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `_posts/2026-06-13-transportable-detonation-chamber.md` as a tab-by-tab showcase whose thread is what each view is for when you are debugging your own payload, with 21 screenshots taken today from the live VM.

**Architecture:** One Markdown post, rewritten whole. The 21 images are already copied into `images/` as `tdc-*.png` (Task 1 verifies them); 11 outdated ones are deleted. Architecture box stays hand-built HTML (`.ghidra-mock`), flows are Mermaid.

**Tech Stack:** Jekyll (kramdown GFM), Mermaid via the default layout.

**Spec:** `docs/superpowers/specs/2026-11-19-tdc-showcase-design.md`

## Global Constraints

- English, `layout: post`, filename and date unchanged.
- Images as `{{ site.baseurl }}/images/tdc-*.png`; Mermaid in `<pre class="mermaid">`, no `(`, `[`, `"` or `|` inside node labels.
- **Every number, string, rule name and verdict in the text must be visible in the screenshot beside it**, or come from `origin/main`'s `docs/`. The facts gathered for each image are listed per task below; nothing beyond them.
- Simulators (`injectsim.exe`, `pipesim.exe`, `beaconsim.exe`, `shortlived.exe`) and `rascal-*` are never called real malware. `mimikatz.exe` may be.
- No API route table, no environment-variable table — link `docs/api.md` and `docs/configuration.md`.
- The live box had Detonator offline (`5/6 SERVICES ONLINE`); say it once, do not hide it.

## Review Focus

1. A `{{` or `{%` outside an intended Liquid tag — breaks the Jekyll build silently. Checked in Task 5.
2. An image reference with no file in `images/` — broken image on the live site. Checked in Task 5.
3. A table-of-contents anchor with no matching heading. Checked in Task 5.
4. A Mermaid node label with an unescaped bracket, quote or pipe — blanks the diagram at runtime, no build catches it. Checked in Task 5.
5. A figure carried over from the previous revision whose screenshot no longer shows it — the old article quoted `9,950 alerts`, `1,345 of 9,950`, `MALICIOUS 6.54`, `760 events`, `8.8 seconds`, `58 messages`; the new screenshots show different numbers. Checked in Task 5 by grepping for the old figures.

---

### Task 1: Verify the image set

**Files:**
- Verify: `images/tdc-*.png` (21 screenshots + `tdc-logo.png`)
- Already deleted: the 11 outdated files listed in the spec

**Interfaces:**
- Produces: the 21 image names every later task references.

| Image | Tab | Key facts visible in it (quotable) |
|---|---|---|
| `tdc-dashboard.png` | Dashboard | 11894 TOTAL ALERTS (5169 high, 6720 med, 5 low), 376 PROCESSES TRACKED, 5/6 SERVICES ONLINE with Detonator struck through, 15 DETECTION RULES (13 sigma, 2 yara), 4 SCANNER TOOLS, ALERT ACTIVITY peak 3,372, SEVERITY 238/4,931/6,720/5, CATEGORY registry 6,724 · process 4,952 · api 212 · file 4 · module 2, service cards Rustinel 1.1.1 / DetonatorAgent 8080 / LitterBox 1337 / Sysmon / Fibratus / AV-AMSI |
| `tdc-alerts.png` | Alerts | 11894 OF 11894, SEVERITY 238 critical / 4,931 high / 6,720 medium / 5 low, ENGINE Sigma 11,643 · Yara 237 · fibratus 14, Sankey: Registry Run Key Persistence 6,150 → MsMpEng.exe 6,190, Suspicious Encoded PowerShell Command Line 4,691 → powershell.exe 4,716, Winlogon Helper DLL 570, WMI Event Subscription Persistence 212, `Windows_Hacktool_COFFLoader_81ba13b8` 81, `Windows_Trojan_CobaltStrike_a56b820f` 81, other rules 109, "Showing newest 2000 of 11894" |
| `tdc-tracing.png` | Tracing | MsMpEng.exe, MALICIOUS · 100/100, stopped, 1 processes, 345 events, 34m 37s, path `C:\ProgramData\Microsoft\Windows Defender\Platform\4.18.260…`, tabs HTTP REQUESTS 0 / CONNECTIONS 0 / DNS REQUESTS 0 / FILES 0 / REGISTRY 345, PROCESS TREE (376), dropdown "MsMpEng.exe — stopped (345 ev)" |
| `tdc-graph-landing.png` | Graph | SAMPLES cards: `rascal-linux-amd641` CLEAN (capa TIMEOUT, ThreatCheck CLEAN), `rascal-windows-amd64.exe` UNSCANNED both 39.2 MB, pipesim.exe 186.5 KB, beaconsim.exe 184.5 KB, injectsim.exe 184.0 KB, shortlived.exe CLEAN (DefenderCheck CLEAN, ThreatCheck CLEAN, capa ANALYZED, EMBER2024 BENIGN 33.9%), `file 2.exe` 5.4 MB, benign-chain-test.exe 103.5 KB, mimikatz.exe 1.3 MB; INVESTIGATE A PROCESS: rascal-windows-amd64.exe PID 5876 detonated 3 threats, mimikatz.exe PID 10804 detonated 2 threats |
| `tdc-graph-tree.png` | Graph | explorer.exe (2316) focused, 5 processes 5 nodes, winlogon.exe → userinit.exe (1) → explorer.exe (11) → OneDrive.exe (1) and msedge.exe (2), legend Process/Malicious/Detonated/Network/DNS/File/Registry/Pipe + Spawned/Connection/Injection, zoom 144% |
| `tdc-pipes.png` | Pipes | 92 events, 3 pipes, event-limit note, rows powershell.exe on `\DAV RPC SERVICE` and `\wkssvc` with FAMILY `—` and INTERCEPT buttons; INTERCEPTION form: HOW attach (pipe exists), MATCH exact, MODE observe, PIPE MODE auto, MAX DURATION 600, squat checkbox, START SESSION; session list `\tdc_e2e` 34 msg · 17 conn, `\msagent_7d6e15` arm/prefix · observe · 58 msg, `\tdc_squat` arm/exact · squat · 2 msg, `\tdc_test` hold · 2 msg and observe · 26 msg · 11 conn |
| `tdc-sysmon.png` | Sysmon | EVENTS OVER TIME legend PipeConnected 40 (40%) · PipeCreated 40 (40%) · ProcessCreate 20 (20%), Sankey python.exe 80 · wevtutil.exe 13 · tasklist.exe 4 · sc.exe 3, "500 events (last 500)" pills PipeConnected 210 · PipeCreated 183 · ProcessCreate 94 · FileCreate 9 · NetworkConnect 2 · RegistryValueSet 2, WIN. EID column 4688/4689/4656, rows `sc query fibratus`, `wevtutil qe Microsoft-Windows-Sysmon/Operational …` |
| `tdc-firewall.png` | Firewall | MAP view, LIVE, ASK: DETONATION, ISOLATED, 1H, world map with the framed CHAMBER device, LOCATION NOT DETERMINED, HUNT FURTHER with the three queries, NETWORK CUT card: "TDC is not isolating the chamber. TDC can secure a sample now." |
| `tdc-firewall-list.png` | Firewall | LIST view, 18 connections, columns PROCESS/PID/DESTINATION/ADDRESS/PORT/PROTO/CC/AS/TAGS/CONN., svchost.exe rows to 92.223.97.79 (LU, GCORE G-Core Labs) and 72.145.35.97/74.151.238.100/74.151.238.96 (US, MICROSOFT-CORP-MSN-AS-BLOCK) and 146.75.118.172 (FASTLY) all tagged `direct-ip`, powershell.exe → `win-t6jbl58qbh8 ::1 5985` tagged `lolbin` `dga` and one also `newborn`, SUMMARY CONNECTIONS 18 (75 single connections), BLOCKED 0, OPEN DECISIONS 0, SAMPLES 0 secured, TOP PROCESSES svchost.exe 66 · powershell.exe 9, TOP COUNTRIES US 5 · LU 2, the "Sysmon has no byte counts" note, SECURED SAMPLES 0 "None yet." |
| `tdc-logs.png` | LOGS | query `*`, 22,258 events (the first 200 shown), 2,658.5 ms, LIVE, 24H, chips POWERSHELL 1,758 · ACCESS 10,000 · MCP 1 · NETFLOW 229 · DNS 286 · FIREWALL 10,000, COMMANDS card open with SEARCH (10 rows: word, "a phrase", field=value, field!=value, field>5, AND, OR, NOT, ( ), *), PIPES 10, TIME 2, SOURCES 6; FIELDS 35 with source access 4,223 · firewall 4,001 · powershell 1,758 · netflow 13 · dns 5; EVENTS/STATISTICS/VISUALIZATION tabs, SAVE |
| `tdc-logs-stats.png` | LOGS | query `source=firewall | stats count by action, protocol`, 4 rows from 10,000 events in 296.2 ms, STATISTICS tab active with TABLE/PIE/BARS/LINE/SANKEY, table ALLOW 2 → 1, ALLOW ICMP → 15, ALLOW TCP → 9,904, ALLOW UDP → 76, FIELDS 11 |
| `tdc-dashboards.png` | Dashboard | page row SERVICES / Log watch / Test / + NEW, "Log watch  4 of 12 tiles", tiles REQUESTS BY PATH (pie, `source=access | stats count by path`, /api/firewall/pending 3,041 30.4% · /api/alerts 1,754 17.5% · …), DNS NAMES (bars, `source=dns | top query`, github.com 188 70.9% · www.loldrivers.io 18 · WIN-T6JBL58QBH8 13 · … · NoSuchStore 1), SOURCES OVER TIME (line, `* | timechart span=5m count by source`, access 4,284 · firewall 4,052 · powershell 1,653 · dns 6 · netflow 5, with "only the newest 10,000 matches went into the pipes"), FIREWALL FLOW (Sankey, `source=firewall | stats count by action, protocol`, ALLOW 9,996 → TCP 9,906) |
| `tdc-threatscan.png` | ThreatScan | head ThreatCheck ✓ · DefenderCheck ✓ · EMBER ✓ 8 models · capa ✓, tool checkboxes, THREATCHECK Engine Defender / Type Binary, EMBER2024 Model `EMBER2024_all (any file)` Threshold 0,5, SCAN with "Runs the selected static analyzers on one file — no execution", LIVE PROCESS MEMORY panel (PID, name, AETHER SCAN, DUMP MEMORY, Samples 3, Interval 3s, LOOK UP, Host baseline `explorer.exe,svchost.exe,msedge.exe` with CAPTURE/CLEAR, "Baseline: 575 key(s) — memory_signature 574, reflective_pe 1 · updated 2026-10-20T09:11:26Z", SWEEP ALL PROCESSES, SWEEP AS BASELINE, FULL DUMP BASELINE, Aether ✓ 11 rule files · Process Dump ✓), SCORE HISTORY with MALICIOUS 6 line and clean/benign 29 47.5% · suspicious 12 19.7% |
| `tdc-etw.png` | ETW | ETW BROWSER heading — describe the channel list and threat highlighting from `docs/web-ui.md` (12 channels, ● ACTIVE / ○ NO DATA, 5 s refresh); quote no counts |
| `tdc-hex.png` | Hex | HEX EDITOR with `pipesim.exe` loaded — describe the structure map, the dump, the data inspector and the PE ANALYSIS / ELF ANALYSIS / RIZIN buttons; quote no counts beyond what the image shows |
| `tdc-filemap.png` | FileMap | `injectsim.exe`, Format PE, Size 184.0 KB, Entropy 6.468, Bytes/cell 1, Regions 19, COLS 256 HEIGHT 740 RENDER, three planes BYTEPLOT / ENTROPY / STRUCTURE with legends (0xFF, 0x00, visible ASCII, invisible ASCII, non-ASCII; 0.2 repetition, 0.5 code, 0.8 packed; MSDOS Header … Entry Point) |
| `tdc-rizin.png` | Rizin | `C:\Users\Public\Downloads\pipesim.exe`, PE64 · x86-64 · 186.5 KB, sha `5757afc2…dd3a38b7`, "analysed (aaa) 2.5 s", FUNCTIONS 127 with `fcn.140001000` 1312 selected, disassembly showing `call fcn.140001b30`, `lea r8, qword data.140001520`, `call qword [sym.imp.KERNEL32.dll_CreateThread]`, `lea rdx, qword str.child`, GRAPH `fcn.140001000` 31 blocks, console `iz~msagent` → `0x00024c56 0x140026056 25 26 .rdata ascii \\.\pipe\msagent_%04x%02x`, quick buttons afl/pdf/pdg/iz/ii/axt/? |
| `tdc-litterbox.png` | LitterBox | the tab with LitterBox online — describe only what the image shows |
| `tdc-submit.png` | Submit | SUBMIT SAMPLE drop zone, Target `Both (Agent + LitterBox)`, EDR Mode `Fibratus`, DETONATE, SUBMISSION HISTORY with VERDICT HISTORY (MALICIOUS 3 / SUSPICIOUS 1 dashed lines), table TIME/FILENAME/SHA-256 rows 11 Nov 14:33:38 rascal-windows-amd64.exe, pipesim.exe, beaconsim.exe, injectsim.exe, shortlived.exe |
| `tdc-detonation.png` | Submit | **the thesis shot** — rascal-windows-amd64.exe, SHA-256 `09ddd6049cd314acd52ff8969cd45250fdfdc4e8ad369050aaaa0c33a50f5ccc`, PID 5876, MALICIOUS banner reading "3 critical EDR alert(s) · In-memory signature match in rascal-windows-amd64.exe (aether; confidence 1.00; seen in 3/3 samples; 1 of 16 of this kind) · …", "Hash added to Rustinel IOC watchlist", VERDICT FLOW rascal-windows-amd64.exe 19 → EDR alerts 3 + live memory 16 → counted (MALICIOUS) 6 / not counted 13, LIVE MEMORY SUSPICIOUS score 5 (suspicious ≥ 2, malicious ≥ 6), chips aether/process_dump/hunt_sleeping_beacons/beaconeye/exit_capture_result/5 byte pattern/3 samples (3s apart), SCORED EVIDENCE (16): 2.50 `REFLECTIVE_LOAD: CLRCreateInstance - Win32 function to bootstrap CLR` (rule risk 9, 1 of 16, group capped at 5), 2.00 `ENGINE_MANAGED: kerberoast - Rubeus Kerberoasting command` (rule risk 8, 2 of 16), 0.50 `ENGINE_MANAGED: AmsiScanBuffer - AMSI scan function targeted for bypass` (rule risk 8, 3 of 16), 0.00 `ENGINE_MANAGED: -EncodedCommand - PowerShell encoded command execution` (uncorroborated — weight reduced, rule risk 6, 6 of 16, cap reached, not counted), 0.00 `C2_HTTP: /task - HTTP beacon task endpoint` (rule risk 2, 11 of 16, cap reached, not counted) |
| `tdc-theme-telemetry.png` | Dashboard | the same dashboard in the Telemetry theme |

- [ ] **Step 1: Verify all 22 files exist and are PNGs**

Run: `file images/tdc-*.png | grep -c "PNG image data"`
Expected: `22`.

- [ ] **Step 2: Verify the 11 outdated files are gone**

Run: `git status --porcelain images | grep '^D' | wc -l`
Expected: `11`.

- [ ] **Step 3: Commit the image set**

```bash
git add images
git commit -m "chore(tdc): screenshots from the live chamber, 2026-11-19"
```

---

### Task 2: Lead, the thesis shot, and the box

**Files:**
- Modify: `_posts/2026-06-13-transportable-detonation-chamber.md` — replace the file from the front matter through the architecture section.

**Interfaces:**
- Consumes: `tdc-detonation.png`, `tdc-dashboard.png`.
- Produces: the `##` heading set the table of contents links to. This task fixes them; Tasks 3 and 4 write exactly those.

- [ ] **Step 1: Front matter and lead**

Title: `Transportable Detonation Chamber - Fifteen Views of One Detonation`. Lead after the logo `<img>`: what the box is (a throwaway Windows 11 VM, Hyper-V x64 or UTM on Apple Silicon, one Web UI on port 9000, 15 tabs), and the two questions — *what did this sample do* and *what does my own payload look like to the engines*. One sentence that the screenshots are from the running box today, with Detonator offline at the time.

Warning blockquote: `/api/submit` executes by design, no login, treat the VM as compromised.

Anchor list of the `##` headings, in order.

- [ ] **Step 2: Write `## One Screenshot, the Whole Idea`**

The thesis. `tdc-detonation.png` plus the facts listed for it in Task 1 — the five scored findings by name and weight, the "cap reached, not counted" rows, the VERDICT FLOW 19 → 3 + 16 → 6 counted / 13 not counted, and "Hash added to Rustinel IOC watchlist". The point to land: a scanner says *detected*; this says which string, at which address, at what weight, and why it was or was not counted — which is the difference between a verdict and a to-do list for the next build.

Then the model, from `docs/memory.md`: baseline suppression first, then evidence class (structural fact > behavioural > extracted artifact > byte pattern), persistence (×1.0 / ×0.55 / ×0.25), corroboration at 40 % until a second source agrees, saturation at 2× the strongest instance, thresholds ≥ 2.0 SUSPICIOUS and ≥ 6.0 MALICIOUS, and **NOT OBSERVED** rather than CLEAN for a scan that read no memory.

- [ ] **Step 3: Write `## What Runs Inside`**

The `<div class="ghidra-mock">` architecture box from the previous revision, unchanged in markup, with its three rows (Intake, Detection, Memory) — correct the Web UI cell to `15 tabs & the REST API`. The service table. One Mermaid `flowchart TB` of a detonation with the facts from `docs/workflow.md`: SHA-256 into the IOC list, Exit Capture armed per image name for 120 s on target agent or both, DetonatorAgent returns the PID, engines record continuously and are matched to the PID afterwards, memory tools one after another in one background thread (Hunt-Sleeping-Beacons, BeaconEye, Aether 3 samples 3 s apart, Process Dump last), results route polled for a verdict that fills in. No `(`, `[`, `"` or `|` in labels.

Then `tdc-dashboard.png` with its figures, and the one honest sentence about Detonator being offline.

- [ ] **Step 4: Verify**

Run: `grep -n '^## ' _posts/2026-06-13-transportable-detonation-chamber.md`
Expected: the headings of Steps 2 and 3 present and matching the anchors from Step 1.

- [ ] **Step 5: Commit**

```bash
git commit -am "docs(tdc): showcase lead, the verdict thesis and the box"
```

---

### Task 3: The fifteen tabs

**Files:**
- Modify: `_posts/2026-06-13-transportable-detonation-chamber.md` — the tab sections, after `## What Runs Inside`.

**Interfaces:**
- Consumes: the remaining 18 images from Task 1.

Each tab gets: one or two paragraphs of what it shows, **one sentence or short paragraph of what it is for when the payload is yours**, its screenshot, and only the facts Task 1 lists for that image. Group the 15 tabs under these `##` headings, in top-bar order:

- [ ] **Step 1: `## What Fired: Alerts, Tracing, Graph`**

Alerts (`tdc-alerts.png`) — note the two YARA rules in the Sankey, `Windows_Hacktool_COFFLoader_81ba13b8` and `Windows_Trojan_CobaltStrike_a56b820f`, as the red-team reading: those are the rules a loader or a beacon trips, and the Sankey says which process carried them. Tracing (`tdc-tracing.png`). Graph: the landing page (`tdc-graph-landing.png`) as the sample inventory with its verdicts, then the tree (`tdc-graph-tree.png`), and the PID-reuse instance key as the reason the tree is trustworthy.

- [ ] **Step 2: `## What It Touched: Pipes, Sysmon, ETW`**

Pipes (`tdc-pipes.png`) — the flags and weights from `docs/pipes.md` (`c2_default` structural, C2 4.0 / remote exec 3.0, never baseline-suppressed; `cross_process` 1.5; `sensitive_system` 1.0; `random_name` 0.8), the catalogue as plain JSON with `\msf-pipe` and deliberately no Sliver entry, and interception (attach/arm, observe/hold, the limits). For your own implant: whether your pipe name is already in everybody's signature set, and the ability to edit a task before it reaches your own beacon. Sysmon (`tdc-sysmon.png`) with the Windows Event ID column. ETW (`tdc-etw.png`) with the 12 channels.

- [ ] **Step 3: `## Whom It Talked To: Firewall and LOGS`**

Firewall MAP (`tdc-firewall.png`) and LIST (`tdc-firewall-list.png`): the sources and the 10 s / 1 s polls, "it sees a connection after it was made", the tags with their severities, no byte counts and why, the ASK switch with its three positions and the 30 s deadline that means the chamber contacts the C2 unattended, and the cut — one `TDC-FW-ISO-cut` rule, 8.8 s measured, the background worker at 59.3 s, `BLOCKED` still reading 0, and that a cut box cannot secure a sample. LOGS (`tdc-logs.png`, `tdc-logs-stats.png`): six sources, the search language from the COMMANDS card, the pipes, the result forms. Own dashboards (`tdc-dashboards.png`).

- [ ] **Step 4: `## What It Is Made Of: ThreatScan, Hex, FileMap, Rizin, LitterBox`**

ThreatScan (`tdc-threatscan.png`) — ThreatCheck's offset as the single most useful thing for payload work, and the Live Process Memory panel with its baseline discipline (capture on a clean box, or the finding stops counting). Hex (`tdc-hex.png`). FileMap (`tdc-filemap.png`) — the author's "file explorer": three planes at one byte per cell, click to offset. Rizin (`tdc-rizin.png`) — the pipe-name walk from `iz~msagent` to the `lea` that loads it, and the console allowlist (families `a p i f C s / ? x t b e` permitted; `!`, `|`, `>`, `o`, `w`, `d`, `.`, `(` refused with one line) because rizin 0.9.1 has no sandbox mode and the Web UI runs as SYSTEM. LitterBox (`tdc-litterbox.png`).

- [ ] **Step 5: `## Submitting, and the Two Themes`**

Submit (`tdc-submit.png`) with VERDICT HISTORY as a series across builds — the red-team point: a bar per build, so you watch a score fall as you fix what leaked. Themes (`tdc-theme-telemetry.png`): ✶ switches without reloading and keeps the open tab, filters, drilldown steps, sort orders, graph and running pipe sessions; the charts are SVG the UI draws itself.

- [ ] **Step 6: Verify the image count**

Run: `grep -c '^!\[' _posts/2026-06-13-transportable-detonation-chamber.md`
Expected: `21`.

- [ ] **Step 7: Commit**

```bash
git commit -am "docs(tdc): the fifteen tabs, each with its red-team job"
```

---

### Task 4: Running it, the limits, the links

**Files:**
- Modify: `_posts/2026-06-13-transportable-detonation-chamber.md` — everything after the tab sections.

- [ ] **Step 1: `## Running It`**

Quick start (two blocks, macOS/UTM and PowerShell, plus the no-VM path), first-boot times, the platform table, the ARM64 paragraph (native OS/agent/runtimes; Fibratus, Rustinel, the beacon scanners and rizin under x86_64 emulation; Aether x64 *deliberately* because of the AMD64 `CONTEXT` layout; the emulator's translation cache classified as a host artifact instead of injected code; `pd64.exe -closemon` not used), and the security list including the Web UI hardening and the rizin allowlist.

- [ ] **Step 2: `## What It Is Not`**

The honest limits, from the docs' own limitation sections: Exit Capture armed by image name; live-memory findings depend on timing; the download detection sees a URL only in a script block, a command line or the BITS log, so a compiled loader calling WinHTTP is a bare connection; a cut box cannot secure a stage 2; a capa timeout is not a verdict; and `tdc-dashboard.png`'s own `5/6` as the reminder that this is a lab box, not an appliance.

- [ ] **Step 3: `## Links`**

Repository, the guide with per-page links (api, configuration, memory, pipes, firewall, logs, rizin, web-ui), the demo GIF as a link, and the credits table of the projects that do the detecting.

- [ ] **Step 4: Commit**

```bash
git commit -am "docs(tdc): running it, the limits and the links"
```

---

### Task 5: Verification

- [ ] **Step 1: Images resolve**

```bash
grep -o 'images/[a-z0-9._-]*' _posts/2026-06-13-transportable-detonation-chamber.md | sort -u | while read -r p; do [ -f "$p" ] || echo "MISSING $p"; done
```
Expected: no output.

- [ ] **Step 2: No stray Liquid**

Run: `grep -n '{[{%]' _posts/2026-06-13-transportable-detonation-chamber.md | grep -v 'site.baseurl'`
Expected: no output.

- [ ] **Step 3: Anchors match headings**

```bash
grep -o '](#[a-z0-9-]*)' _posts/2026-06-13-transportable-detonation-chamber.md | tr -d '](#)' | sort -u > /tmp/a
grep '^## ' _posts/2026-06-13-transportable-detonation-chamber.md | sed 's/^## //' | tr 'A-Z' 'a-z' | sed 's/[^a-z0-9 -]//g; s/ /-/g' | sort -u > /tmp/h
comm -23 /tmp/a /tmp/h
```
Expected: no output.

- [ ] **Step 4: Mermaid labels clean**

Run: `awk '/class="mermaid"/,/<\/pre>/' _posts/2026-06-13-transportable-detonation-chamber.md | grep -n '\["[^"]*[(\[|]'`
Expected: no output.

- [ ] **Step 5: No figure from the superseded revision**

Run: `grep -n '9,950\|6\.54\|760 events\|58 messages\|1,345\|717 YARA\|17 tabs' _posts/2026-06-13-transportable-detonation-chamber.md`
Expected: no output.

- [ ] **Step 6: Read it as a reader**

Check the three things no grep can: every tab has a stated job for someone debugging their own payload; every number matches the screenshot beside it; no simulator or `rascal` build is called real malware.

- [ ] **Step 7: Commit**

```bash
git commit -am "docs(tdc): verification pass on the showcase"
```
