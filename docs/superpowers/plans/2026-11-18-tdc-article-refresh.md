# TDC Article Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `_posts/2026-06-13-transportable-detonation-chamber.md` as a two-act story — a sample detonated end to end, then the author's own payload against the same engines — with a refreshed screenshot set from the project's current `main`.

**Architecture:** One Markdown post, rewritten whole rather than patched, because the section order changes. 19 screenshots are copied out of `origin/main:static/` in the project repo into `images/` under the existing `tdc-` prefix; 10 outdated ones are deleted. The architecture diagram stays a hand-built HTML terminal box (the `.ghidra-mock` class already in `style.scss`); flows become Mermaid, which `_layouts/default.html` already loads.

**Tech Stack:** Jekyll (kramdown GFM, Rouge), Mermaid via the default layout, plain HTML/CSS for the architecture box.

**Spec:** `docs/superpowers/specs/2026-11-18-tdc-article-refresh-design.md`

## Global Constraints

- Language: **English**, like every other post on the site.
- Front matter stays exactly `layout: post` + `title:`; the **filename and date do not change** so `/transportable-detonation-chamber/` keeps working.
- Images are referenced as `{{ site.baseurl }}/images/<file>` — the convention of this post and of `2026-11-12-vipertunnel-reverse-socks.md`.
- Mermaid diagrams go in `<pre class="mermaid">…</pre>`, never in a fenced block.
- **No API route table and no environment-variable table.** Link `docs/api.md` and `docs/configuration.md` instead.
- Every number, rule name, verdict, score, port and file path in the text must be traceable to the facts gathered from `origin/main` (README + `docs/*.md`) or visible in the screenshot it accompanies. Nothing invented, nothing rounded into something stronger.
- The samples in the screenshots are the project's **own simulators** (`injectsim.exe`, `pipesim.exe`, `beaconsim.exe`, `shortlived.exe`) and the author's own binary (`rascal-windows-amd64.exe`, `rascal-linux-amd641`). Never call any of them real malware.
- Source repository for facts and images: `/Users/derbenji/gitRepos/transportable-detonation-chamber`, branch `origin/main`, read with `git show` — **never check that branch out**, the user has a feature branch in progress there.
- Target length ~2,500 words, 19 images.

## Review Focus

1. **A `{{` or `{%` anywhere outside an intended Liquid tag** — a sample path or a Sigma condition containing braces breaks the Jekyll build silently. Checked in Task 6.
2. **An image reference whose file is not in `images/`** — renders as a broken image on the live site. Checked in Task 6.
3. **An anchor in the table of contents with no matching heading** — a dead link in the post's own navigation. Checked in Task 6.
4. **A Mermaid node label containing an unescaped `(`, `[`, `"` or `|`** — one bad label blanks the whole diagram, and Mermaid fails at runtime, so no build catches it. Each diagram's labels are constrained in the task that writes it, and Task 6 greps for the characters.
5. **A stale fact carried over from the old article** — the old text claims "20 Sigma rules, 717 YARA rules", seven tabs and a `/api/alerts` table; any of these surviving the rewrite makes the new article wrong. Checked in Task 5, Step 5.

---

### Task 1: The image set and the Jekyll exclude

**Files:**
- Create: `images/tdc-dashboard.png` and 19 further `images/tdc-*.png` (table below; `tdc-dashboard.png` overwrites the existing one)
- Delete: `images/tdc-hex-editor.png`, `images/tdc-mimikatz-detonation.png`, `images/tdc-pe-analyzer-text-header-section.png`, `images/tdc-pe-header-analyzer.png`, `images/tdc-pe-packing-analyzer.png`, `images/tdc-process-rollup-details.png`, `images/tdc-process-rollup.png`, `images/tdc-rustinel-analysis-details.png`, `images/tdc-rustinel-analysis.png`, `images/tdc-sysmon-correlation.png`
- Modify: `_config.yml` (the `exclude:` list at the end)
- Keep untouched: `images/tdc-logo.png`, `images/payload_detonation.gif`

**Interfaces:**
- Consumes: nothing.
- Produces: the 19 image paths every later task references. The names below are final; later tasks must use them verbatim.

| Target in `images/` | Source in `origin/main:static/` | Used by |
|---|---|---|
| `tdc-dashboard.png` | `theme_cyberpunk.png` | Task 2 (lead) |
| `tdc-detonation-results.png` | `detonation_results.png` | Task 3 |
| `tdc-alerts-drilldown.png` | `alerts_drilldown.png` | Task 3 |
| `tdc-tracing.png` | `tracing.png` | Task 3 |
| `tdc-graph-tree.png` | `graph_tree.png` | Task 3 |
| `tdc-sysmon-events.png` | `sysmon_events.png` | Task 3 |
| `tdc-firewall.png` | `firewall_tab.png` | Task 3 |
| `tdc-firewall-cut.png` | `firewall_cut.png` | Task 3 |
| `tdc-live-memory.png` | `live_memory.png` | Task 4 |
| `tdc-detonation-beaconing.png` | `detonation_beaconing.png` | Task 4 |
| `tdc-pipes.png` | `pipes_tab.png` | Task 4 |
| `tdc-pe-packing-analysis.png` | `pe_packing_analysis.png` | Task 4 |
| `tdc-file-map.png` | `file_map.png` | Task 4 |
| `tdc-rizin.png` | `rizin.png` | Task 4 |
| `tdc-logs.png` | `logs_tab.png` | Task 5 |
| `tdc-dashboards.png` | `dashboards.png` | Task 5 |
| `tdc-etw-browser.png` | `etw_browser.png` | Task 5 |
| `tdc-theme-telemetry.png` | `theme_telemetry.png` | Task 5 |
| `tdc-wiki.png` | `wiki.png` | Task 5 |
| `tdc-tool-updates.png` | `tool_updates.png` | Task 5 |

(20 rows: 19 new files plus the overwrite of `tdc-dashboard.png`.)

- [ ] **Step 1: Copy the images out of the project repo**

For each row, from `/Users/derbenji/gitRepos/benjitrapp.github.io`:

```bash
git -C ~/gitRepos/transportable-detonation-chamber show origin/main:static/<source> > images/<target>
```

- [ ] **Step 2: Verify every target exists and is a PNG**

Run: `file images/tdc-*.png | grep -c "PNG image data"`
Expected: `21` (the 20 above plus `tdc-logo.png`), and no line reading `empty` or `ASCII text` — an empty file means the `git show` path was wrong.

- [ ] **Step 3: Delete the 10 outdated images**

Run `git rm` on the ten files in the Delete list. They are referenced only by the post being rewritten (verified: no other file in the repo mentions `tdc-`).

- [ ] **Step 4: Add `docs` to Jekyll's exclude list**

In `_config.yml`, append `  - docs` to the `exclude:` list so the design doc and this plan are not published.

- [ ] **Step 5: Verify the exclude and commit**

Run: `tail -8 _config.yml`
Expected: `- docs` is the last entry of `exclude:`.

```bash
git add images _config.yml
git commit -m "chore(tdc): refresh screenshot set for the detonation chamber post"
```

---

### Task 2: Front matter, lead, the problem, and what runs inside

**Files:**
- Modify: `_posts/2026-06-13-transportable-detonation-chamber.md` — replace the whole file; this task writes everything up to and including the architecture section, and leaves the rest of the old text in place below it for the later tasks to replace.

**Interfaces:**
- Consumes: `images/tdc-dashboard.png` from Task 1.
- Produces: the heading set the table of contents links to. Headings written by this task, verbatim, because Task 6 checks the anchors: `## Why a Box of My Own`, `## What Runs Inside`.

- [ ] **Step 1: Write the front matter and the lead**

Front matter unchanged except the title, which becomes:
`Transportable Detonation Chamber - A Malware Lab That Also Grades My Own Payloads`

Lead paragraph, after `<img height="200" align="left" src="/images/tdc-logo.png">`: what the chamber is (a pre-configured Windows 11 VM, Hyper-V on x86_64 Windows hosts and UTM on Apple Silicon, one Web UI on port 9000), and the sentence that frames the whole post — it answers two questions, *what did this sample do* and *what does my own payload look like to the engines watching it*.

Then `{{ site.baseurl }}/images/tdc-dashboard.png` with alt text naming what the picture shows: the service dashboard in the Cyberpunk theme with its detection metrics, alert activity and service health.

Then the warning blockquote, in the style of the ViperTunnel post's warning:
`> The chamber executes what you give it, on purpose. Treat the VM as compromised from the first detonation, and never put it on a network you care about.`

- [ ] **Step 2: Write the table of contents**

A bullet list of anchor links, one per `##` heading of the finished article, in order:

```
Why a Box of My Own · What Runs Inside · Act 1: One Sample, End to End ·
Act 2: My Own Payload Against the Same Engines · The Rest of the Box ·
Running It · What I Would Change Next · Links
```

Anchors are the GitHub-style slug of each heading (lowercase, spaces to hyphens, `:` and `,` dropped).

- [ ] **Step 3: Write `## Why a Box of My Own`**

Two or three paragraphs, no product language. The two problems it exists for:
(a) correlating Sysmon, a YARA scanner, kernel ETW and a sandbox by hand across four interfaces, with no single picture of one sample;
(b) no honest answer to "does my own payload get caught", because the answer depends on which engine, which rule, and whether anybody looked in memory at the right moment.
State plainly that the second is why the box grades findings itself instead of trusting each scanner's own severity label.

- [ ] **Step 4: Write `## What Runs Inside`**

Three parts, in this order:

1. **The architecture box.** Reuse the `<div class="ghidra-mock">` structure of the old article (lines 23-111 of the current file) as the starting point for markup and inline styles, but rebuild its contents for today's services: an *Intake* row (Web UI :9000 Python/Flask → DetonatorAgent :8080 .NET 8 | LitterBox :1337 Python/Flask), an *Analysis* row (Rustinel Sigma/YARA/IOC Rust | Fibratus :8180 kernel ETW Go | Sysmon Sysinternals), and a third *Memory* row that the old box did not have (Hunt-Sleeping-Beacons C++ | BeaconEye .NET | Aether Zig, 380 in-memory signatures | Process Dump C++ | Exit Capture, a Windows feature). Keep the window-chrome bar, change its caption to `Windows 11 VM · Hyper-V x64 / UTM ARM64`.

2. **The services table.** Columns Service | Port | Purpose | Technology. Rows: Web UI 9000, DetonatorAgent 8080, LitterBox 1337, Fibratus 8180, Rustinel —, Sysmon —, the four memory tools —, theZoo-WebUI 8888, Detonator 5000/8000.

3. **The detonation flow as Mermaid.** One `flowchart TB`, derived from `docs/workflow.md`'s data flow but shortened to what the article needs. The facts it must carry: the sample's SHA-256 goes into Rustinel's IOC list; with the agent as target, Exit Capture is armed for the image name for **120 s** before the file runs; DetonatorAgent runs it and answers its PID; the engines record all the time and their output is matched to the PID afterwards; against the PID the memory tools run one after another in one background thread (Hunt-Sleeping-Beacons, BeaconEye, Aether 3 samples 3 s apart, Process Dump last); the Submit tab polls `/api/detonation/results` for a verdict that fills in as stages report.
   **Label constraint:** no `(`, `[`, `"` or `|` inside any node label; write "3 samples, 3 s apart" rather than "Aether (3×)".

- [ ] **Step 5: Verify the diagrams and the heading slugs**

Run: `grep -n '^## ' _posts/2026-06-13-transportable-detonation-chamber.md | head -4`
Expected: `## Why a Box of My Own` and `## What Runs Inside` appear, and each matches an anchor from Step 2.

Run: `grep -o 'class="mermaid"' _posts/2026-06-13-transportable-detonation-chamber.md | wc -l`
Expected: `1` at this point.

- [ ] **Step 6: Commit**

```bash
git add _posts/2026-06-13-transportable-detonation-chamber.md
git commit -m "docs(tdc): new lead, problem statement and architecture section"
```

---

### Task 3: Act 1 — one sample, end to end

**Files:**
- Modify: `_posts/2026-06-13-transportable-detonation-chamber.md` — insert `## Act 1: One Sample, End to End` after the architecture section; delete the old sections it replaces (`## Detection Engines`, `## Web UI` and its seven sub-sections, `## Demo` down to but excluding `## API Reference`).

**Interfaces:**
- Consumes: seven images from Task 1 — `tdc-detonation-results.png`, `tdc-alerts-drilldown.png`, `tdc-tracing.png`, `tdc-graph-tree.png`, `tdc-sysmon-events.png`, `tdc-firewall.png`, `tdc-firewall-cut.png`.
- Produces: the `### ` sub-headings this act uses, which Task 6 checks are unique across the file.

The act is one narrative: a submission, the verdict it produces, and then the five questions a verdict raises, each answered in the tab that answers it. Each sub-section is one or two paragraphs plus its screenshot.

- [ ] **Step 1: Write the submission and the verdict**

Opening paragraph: Submit tab, drop a file, pick the target (**Agent**, **LitterBox** or **Both**) and the EDR mode, press **Detonate**; live-memory results arrive **1-2 minutes** after the start and the verdict updates while they come in.

Then the scoring model, because it is the part that makes the verdict worth reading — from `docs/memory.md`:
a finding already on the host's clean baseline is set aside before anything is counted; what is left is weighted by evidence class (structural fact > behavioural > extracted artifact > byte pattern), then by persistence across the samples (**×1.0** in every sample, **×0.55** in at least half, **×0.25** once), then by corroboration (kinds legitimate software also shows count at **40 %** until a second source agrees on the same process), with saturation capping one kind at **2×** its strongest instance. Thresholds: **≥ 2.0 SUSPICIOUS, ≥ 6.0 MALICIOUS**. A scan that read no memory reports **NOT OBSERVED**, not CLEAN — call this out, it is the honest part.

Screenshot `tdc-detonation-results.png`. The facts in the text must match it: `injectsim.exe`, **MALICIOUS score 6.54**, the banner that the process exited before the live scan so it was analysed from its exit-time memory dump, five scored findings (PE header in private memory **3.00**, in-memory signature match `C2_HTTP: beacon.x64.dll` **2.50**, private RWX allocation **0.80** marked *uncorroborated — weight reduced*, two more at 0.16 and 0.08), the exit capture summary (**9 modules, 233 regions, 1 thread, 29.3 MB captured, under emulation on ARM64**) and the three files extracted from memory.

- [ ] **Step 2: Write "Which rules fired" with the Alerts drilldown**

What the tab is: every detection of Rustinel, Fibratus and LitterBox in one table, newest first, under charts of the current filter. The drilldown is the point: a click on a slice, a bar or a Sankey band narrows both table and charts and becomes a step in a path, and **BACK** walks it back out.

Screenshot `tdc-alerts-drilldown.png`, whose numbers the text uses: path `ALL ALERTS › 27 Jul – 02 Aug › 27 Jul › 27 Jul 10:00–12:00`, **1,345 of 9,950 alerts**, the two hours drawn as **24 bars of 5 minutes** with the busiest at **373**, severity 6 critical / 784 high / 555 medium, engine Sigma 1,339 and Yara 6, and the Sankey's two heavy flows — *Suspicious Encoded PowerShell Command Line* (766) into `powershell.exe` and *Registry Run Key Persistence* (506) mostly into `MsMpEng.exe`.

One honest sentence: the Sankey is drawn by square roots so small flows stay visible, and **LINEAR** shows true proportions.

- [ ] **Step 3: Write "What one process did" with Tracing**

The per-process console: its verdict, a timeline split by event type, the process tree with each process's alert count, and the table of rules that fired with the raw event behind each row. Screenshot `tdc-tracing.png`; its figures: `MsMpEng.exe`, verdict **MALICIOUS 100/100**, **760 events**.

- [ ] **Step 4: Write "Who started it" with the process graph**

Tree, force-directed and isometric layouts; the detail panel's image, status, parent, activity counters, the **Check who signed this** button, the children, and the Sysmon events the process triggered with the Windows Event IDs they correspond to. Two facts worth stating: the **ACTIVITY MIX** donut counts the Sysmon activity of that process instance and its alerts sit beside the ring, not in it; and every process in the UI is an *instance* — Windows reuses PIDs, so the newest holder is addressed by the plain PID and earlier ones as `<pid>@<start epoch>`.

Screenshot `tdc-graph-tree.png`.

- [ ] **Step 5: Write "Which Windows events correspond" with Sysmon**

The Sysmon log with the Windows Event IDs each event maps to, over an **EVENTS OVER TIME** chart stacked by event type and a process → event type Sankey that narrow the table by time window, image or event type. The pipe-event change belongs here: provisioning switches SwiftOnSecurity's `PipeEvent` filter from include to **exclude** mode so every pipe is logged except a few noisy image-*and*-name pairs, and the Sysmon log is enlarged to **512 MB**.

Screenshot `tdc-sysmon-events.png`.

- [ ] **Step 6: Write "Whom it talked to, and how to cut it off" with the firewall**

Two paragraphs and two screenshots, the strongest new capability in the article.

First: what the tab sees and from where — Sysmon 1, 3 and 22, `pfirewall.log`, PowerShell 4104/4103 and the BITS client log, read every **10 s** and, during a detonation, Sysmon and BITS every **1 s**. It sees a connection *after* it was made. Geo and ASN come from an offline table (`iptoasn.com`) because the chamber never asks anyone online about an address it saw from malware. There are **no byte counts** — Sysmon records none — so bars and arcs scale with the number of connections. Name three or four tags from the tag table with their severities: `ioc` critical, `beacon` critical, `direct-ip` high, `rare-port` medium (4444, 5555, 6666, 8888, 9999, 31337), `newborn` low (process younger than **60 s**). Sample-derived URLs and host names are defanged and never links. Screenshot `tdc-firewall.png`.

Second: the **ASK** switch and the panic button. ASK decides what happens when a process fetches a file: `Detonation` (the default) blocks a download by a submission or its descendants at once and then asks; `All` blocks every download except TDC's own and the tool-update hosts; `Off` only tags. The toast offers **CUT + FETCH**, **CUT ONLY** and **ALLOW**, and when nobody answers within **30 s** (`TDC_FIREWALL_DECIDE_SECONDS`) TDC keeps the block and fetches the file itself — which means the chamber contacts the C2 unattended, and the article says so rather than hiding it. Then ISOLATED: one state, one press, no confirmation, measured **8.8 s** on a quiet VM to write the catch-all Block rule (**`TDC-FW-ISO-cut`**) and read it back, with a background worker (**59.3 s**) that switches off every enabled outbound Allow rule Windows ships and sets the outbound default to Block. The caveat belongs in the text: **BLOCKED still reads 0**, because the cut is one catch-all rule and that counter counts per-endpoint and per-process rules; and `scripts/tdc-unisolate.ps1` is the way back without the web UI. Screenshot `tdc-firewall-cut.png`.

- [ ] **Step 7: Verify the old sections are gone**

Run: `grep -n '^## \|^### ' _posts/2026-06-13-transportable-detonation-chamber.md`
Expected: no `## Web UI`, no `## Detection Engines`, no `## Demo`; `## Act 1: One Sample, End to End` present with its sub-headings; `## API Reference` still present (Task 5 removes it).

- [ ] **Step 8: Commit**

```bash
git add _posts/2026-06-13-transportable-detonation-chamber.md
git commit -m "docs(tdc): act 1, one sample from submission to verdict"
```

---

### Task 4: Act 2 — my own payload against the same engines

**Files:**
- Modify: `_posts/2026-06-13-transportable-detonation-chamber.md` — insert `## Act 2: My Own Payload Against the Same Engines` after Act 1.

**Interfaces:**
- Consumes: six images from Task 1 — `tdc-live-memory.png`, `tdc-detonation-beaconing.png`, `tdc-pipes.png`, `tdc-pe-packing-analysis.png`, `tdc-file-map.png`, `tdc-rizin.png`.

This act turns the box around: the same engines, but the question is what a defender would have seen. Frame it as a checklist the author runs against his own binaries, one sub-section per question. The binaries visible in the screenshots are `rascal-windows-amd64.exe` (submission history) and `rascal-linux-amd641` (scan history); refer to them as the author's own payload builds, nothing more.

- [ ] **Step 1: Write the opening**

Why the same box answers the other question: the engines do not know who wrote the sample, so the verdict model that grades malware grades an implant too. Name what makes the answer trustworthy here: the host baseline ("Sweep as baseline", ~4 min; "Full dump baseline", 20+ min) must be captured on a clean box **before** anything is detonated, because anything in the baseline stops counting as evidence. And the calibration from `docs/memory.md` — three harmless test programs scored CLEAN 0.75, MALICIOUS 6.54 and SUSPICIOUS 2.9, and a system-wide sweep of the clean VM (139 processes) scores 0 — so the scale means something.

- [ ] **Step 2: Write "Does anything see it in memory" with ThreatScan**

The **Live Process Memory** panel: Aether scan, memory dump, host baseline, whole-system sweep, by PID or by name, with samples and interval settable (**3 samples, 3 s apart** by default). Beside it ThreatCheck, DefenderCheck, EMBER2024 (**8 models**) and capa on a file; ThreatCheck reports the **offset of the flagged bytes with a link into the hex editor**, which is the single most useful thing in the tab for payload work — it names the byte the engine hates.

Screenshot `tdc-live-memory.png`, whose **SCORE HISTORY** the text uses: a point per scan with dashed lines at **SUSPICIOUS 2** and **MALICIOUS 6**, **29 clean / 12 suspicious / 3 malicious / 17 no verdict** over 61 scans, and the history rows for `rascal-linux-amd641` (capa TIMEOUT, ThreatCheck CLEAN) next to Aether and Exit Capture results.

- [ ] **Step 3: Write "Does the beacon tick" with the beaconing detector**

Sysmon EID 3 connections scored for check-in periodicity, which keeps working after the process exited because it comes from the log, not from memory. Screenshot `tdc-detonation-beaconing.png` — read its figures off the image when writing, and quote only what it shows.

Tie it back to the author's own work in one sentence: this is the same measurement the ViperTunnel dashboard makes on the network side, here taken from the endpoint's own log.

- [ ] **Step 4: Write "Is my pipe name a known C2 name" with Named Pipes**

The flags from `docs/pipes.md` and what each weighs: `c2_default` (structural, catalogue weight — C2 **4.0**, remote exec **3.0** — never baseline-suppressed, so a default C2 pipe name alone makes a sample SUSPICIOUS), `cross_process` (behavioural 1.5), `sensitive_system` (1.0, for `\svcctl`, `\lsarpc`, `\samr`, `\netlogon`, `\atsvc`), `random_name` (string 0.8). The catalogue is plain JSON (`webui/pipe_signatures.json`) — add a `pattern`, `match`, `family`, `weight`, `note` entry without touching code. Worth naming: it has Metasploit's `\msf-pipe`, and **Sliver has no entry because it has no default pipe name**.

Then interception, which is the part that matters for one's own implant: **attach** to an existing pipe or **arm** for the first new pipe matching an exact name, prefix or regex; **observe** (relay and record) or **hold** (each message waits until you forward, edit or drop it). Limits: **10 min** default session (≤ 1 h), at most **16** live sessions, **1 MiB** logged per message, **50 MiB** per session, and `\lsass`, `\ntsvcs`, `\protected_storage` and their NPFS aliases are refused outright. One limitation stated plainly: a client already connected before the session starts is not intercepted, and a server using `FILE_FLAG_FIRST_PIPE_INSTANCE` can defeat the proxy.

Screenshot `tdc-pipes.png`: its session on `\msagent_5e62b5`, arm/prefix, observe, **58 messages / 446 B recorded**, each message in hex and ASCII and marked **PASSED**.

- [ ] **Step 5: Write "Does it look packed" with the PE packing analysis and the file map**

DiE-style detection overview with an assessment badge, compiler and protector cards, an entropy map per section (**red ≥ 7.0**), and a file-structure diagram. Screenshot `tdc-pe-packing-analysis.png`. Then the file map: byteplot, local entropy and PE structure planes side by side, and a click on a plane jumps to that offset in the hex editor. Screenshot `tdc-file-map.png`. The example worth quoting from the docs: `capa.exe`, a PyInstaller bundle of **35 MB** whose **36 MB overlay sits at entropy 8.00** — almost the whole file is overlay, which is what a packer looks like from the outside.

- [ ] **Step 6: Write "What does it actually do" with Rizin**

rizin **0.9.1** with the **rz-ghidra** decompiler on the VM, driven from the browser: FUNCTIONS, DISASSEMBLY, DECOMPILER and HEX beside the control-flow GRAPH, all at one current address that a click, SEEK + GO, ◀ ▶ or a seek in the console moves. The file is only read: no writing, no debugging. The console detail is the interesting engineering: rizin 0.9.1 has no sandbox mode of its own and the web UI runs as SYSTEM without a login, so every command passes a server-side allowlist first — the families `a p i f C s / ? x t b e` are permitted, and `!`, `|`, `>`, backticks, `o`, `w`, `d`, `.` and `(` are refused with one line (`refused: '!' is not allowed: no shell commands`). Measured on the ARM64 VM under x64 emulation: `aaa` up to **20 MB** and `aa` above it, `aaa` of a **186.5 KB** sample with 127 functions in **2.1-2.2 s**, and `aa` of a **31 MB** exit dump with **10,295 functions** in **3.3-3.9 s**, with Full analysis **23-24 s** after it.

Screenshot `tdc-rizin.png`: `pipesim.exe`, the disassembly at the instruction that loads the pipe name, the control-flow graph of that function, and the console session that found the string and followed its reference.

- [ ] **Step 7: Verify and commit**

Run: `grep -c 'site.baseurl' _posts/2026-06-13-transportable-detonation-chamber.md`
Expected: `14` at this point (1 from Task 2, 7 from Task 3, 6 from Task 4).

```bash
git add _posts/2026-06-13-transportable-detonation-chamber.md
git commit -m "docs(tdc): act 2, the same engines against my own payload"
```

---

### Task 5: The rest of the box, running it, and the links

**Files:**
- Modify: `_posts/2026-06-13-transportable-detonation-chamber.md` — replace everything after Act 2 (the old `## Analysis Capabilities`, `## Reverse Engineering Tools`, `## Quick Start`, `## Detonation Workflow`, `## Developer Experience`, `## Platform Support`, `## Security Considerations`, `## API Reference`, `## Configuration`, `## Links`) with the four closing sections.

**Interfaces:**
- Consumes: six images from Task 1 — `tdc-logs.png`, `tdc-dashboards.png`, `tdc-etw-browser.png`, `tdc-theme-telemetry.png`, `tdc-wiki.png`, `tdc-tool-updates.png`.

- [ ] **Step 1: Write `## The Rest of the Box`**

A compact gallery: one short paragraph per item, each with its screenshot, no sub-headings deeper than `###` and no feature table.

- **LOGS** (`tdc-logs.png`) — six sources (`powershell` 4104/4103/4100, `access`, `mcp`, `netflow` from Sysmon 3, `dns` from Sysmon 22, `firewall` from `pfirewall.log`) under a subset of Splunk's search language: `field=value`, `AND`/`OR`/`NOT`, and the pipes `head`, `tail`, `sort`, `dedup`, `table`, `fields`, `stats`, `top`, `rare`, `timechart`. Quote two or three real queries verbatim, e.g. `source=firewall action=DROP | stats count by dst_ip, dst_port` and `source=dns result="-" | top query` (names that never resolved: DGA suspects). Include the honest caveat from the docs: a host name in a DNS top list is not always somewhere the malware went — two of the names in the screenshot are the chamber's own tool downloads, and `WIN-T6JBL58QBH8` is a NetBIOS name.
  **Liquid safety:** these queries contain no braces; if any query with `{` is quoted, wrap it in backticks and verify Task 6's brace check still passes.
- **Own dashboards** (`tdc-dashboards.png`) — a result with a form can be saved as a tile (name, query, form, time range — *no numbers*); up to **10** dashboards with **12** tiles each; tiles compute one after another, and eight tiles of the test VM took about **2 s**.
- **ETW browser** (`tdc-etw-browser.png`) — **12** channels (Sysmon, Security, PowerShell, Defender, WMI, Task Scheduler, BITS, DNS, Firewall, AppLocker, WinRM, Application) with ● ACTIVE / ○ NO DATA probing, a **5 s** auto-refresh and threat classification badges.
- **Two themes** (`tdc-theme-telemetry.png`) — Cyberpunk (the default) and Telemetry; **✶** switches without reloading, and the open tab, detail view, filters, drilldown steps, sort orders, the graph and running pipe sessions all survive the switch. Worth one sentence: the charts are drawn as SVG by the UI itself, with no chart library, which is why they recolour instantly.
- **Tool updates** (`tdc-tool-updates.png`) — every tool with installed and available version, updated without re-provisioning; checks via `choco outdated`, `winget list --upgrade-available`, git commits behind upstream, GitHub releases and the Sysinternals download's **ETag**. Rustinel **1.1.1**, Fibratus **3.0.0** and Rizin (Cutter **2.5.0**) are pinned, `python312` is held back and always updated last, a script gets at most **45 minutes**, and there is **no rollback**.
- **Offline wiki** (`tdc-wiki.png`) — `make docs` builds the whole guide into one `wiki.html` with screenshots embedded and the Mermaid diagrams drawn, which opens without a network; on a VM with no internet at all, that is the documentation.

- [ ] **Step 2: Write `## Running It`**

The quick start as two short code blocks (macOS/Linux and PowerShell), from the README: `./scripts/setup-macos-utm.sh` or `make up`, then `make open`; and the no-VM path `make install` + `make run`. First boot **~20-30 min** on Windows, **~30-45 min** on macOS ARM.

Then a platform table: Windows 10/11 x86_64 + Hyper-V (native) and macOS Apple Silicon + UTM (Windows 11 ARM64 guest). The ARM64 paragraph with the facts that matter: the OS, the agent and the runtimes are native; Fibratus, Rustinel, Aether, the beacon scanners and rizin have no ARM64 build and run under Windows' x86_64 emulation — which is what x64 samples do too; and the emulator's own translation cache is private executable memory, so Exit Capture and Process Dump classify it by content and list it as a host artifact instead of scoring it as injected code.

Then security, as a short list, not a section of its own: snapshot before each detonation; isolated network; the Web UI has no login and `/api/submit` executes files by design; Rustinel's active response is off by default; Defender exclusions cover the detonation paths only. Plus the hardening that is worth naming because it is unusual for a lab tool: state-changing requests whose `Origin`/`Referer` names another site are refused, only IPs, `localhost` and `TDC_ALLOWED_HOSTS` are accepted in the `Host` header, writes are confined to the hex-upload folder, `C:\Temp`, `C:\Users\Public\Downloads` and `C:\dumps`, and the rizin console's allowlist from Act 2.

- [ ] **Step 3: Write `## What I Would Change Next`**

Three or four bullets of honest open ends, drawn from the docs' own limitation sections — not invented: Exit Capture is armed by image name, so a child process with another name is only covered by the live scanners and the network log; live-memory findings depend on timing, so comparisons need several samples; the firewall's download detection sees a URL only in a script block, a command line or the BITS log, so a compiled loader calling WinHTTP itself shows up as a bare connection; and in the `cut` stages no fetch gets through, so the chamber cannot secure a stage-2 sample while it is isolated.

- [ ] **Step 4: Write `## Links`**

Repository, the guide (`docs/README.md`), the demo GIF linked and not embedded (say it is 10 MB), the Web UI page, and the projects that do the detection work, as a short credits table: Detonator and DetonatorAgent (dobin), Fibratus (rabbitstack), Rustinel (Karib0u), LitterBox (BlackSnufkin), Aether (0xsp-SRD), Process Dump (glmcdona), Hunt-Sleeping-Beacons (thefLink), capa (mandiant), EMBER2024 (FutureComputing4AI), rizin and rz-ghidra (rizinorg), theZoo (ytisf).

- [ ] **Step 5: Verify the old reference sections are gone**

Run: `grep -n 'api/alerts\|RUSTINEL_ALERTS_DIR\|717 YARA\|20 Sigma' _posts/2026-06-13-transportable-detonation-chamber.md`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add _posts/2026-06-13-transportable-detonation-chamber.md
git commit -m "docs(tdc): closing sections, running it and links"
```

---

### Task 6: Whole-article verification

**Files:**
- Modify (only if a check fails): `_posts/2026-06-13-transportable-detonation-chamber.md`

**Interfaces:**
- Consumes: the finished article and the image set.

- [ ] **Step 1: Every image reference resolves**

Run:
```bash
grep -o 'images/[a-z0-9._-]*' _posts/2026-06-13-transportable-detonation-chamber.md | sort -u | while read -r p; do [ -f "$p" ] || echo "MISSING $p"; done
```
Expected: no output.

- [ ] **Step 2: No stray Liquid braces**

Run: `grep -n '{[{%]' _posts/2026-06-13-transportable-detonation-chamber.md | grep -v 'site.baseurl'`
Expected: no output. Any hit is either an intended Liquid tag (there should be none beyond `site.baseurl`) or a brace that must be escaped.

- [ ] **Step 3: Every table-of-contents anchor has a heading**

Run:
```bash
grep -o '](#[a-z0-9-]*)' _posts/2026-06-13-transportable-detonation-chamber.md | tr -d '](#)' | sort -u > /tmp/tdc-anchors
grep '^## ' _posts/2026-06-13-transportable-detonation-chamber.md | sed 's/^## //' | tr 'A-Z' 'a-z' | sed 's/[^a-z0-9 -]//g; s/ /-/g' | sort -u > /tmp/tdc-headings
comm -23 /tmp/tdc-anchors /tmp/tdc-headings
```
Expected: no output (every anchor matches a heading slug).

- [ ] **Step 4: Mermaid labels carry no diagram-breaking characters**

Run: `awk '/class="mermaid"/,/<\/pre>/' _posts/2026-06-13-transportable-detonation-chamber.md | grep -n '\["[^"]*[(\[|]'`
Expected: no output. A hit means a node label contains `(`, `[` or `|` and must be reworded.

- [ ] **Step 5: Length and image count are in the agreed range**

Run: `wc -w _posts/2026-06-13-transportable-detonation-chamber.md; grep -c '^!\[' _posts/2026-06-13-transportable-detonation-chamber.md`
Expected: roughly 2,300-2,900 words; **20** images.

- [ ] **Step 6: Read it once as a reader**

Read the finished post top to bottom and check three things no grep can: the two acts read as uses of one box rather than two feature lists; every number in a paragraph matches the screenshot beside it; and no sample is described as real malware.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "docs(tdc): verification pass on the refreshed article"
```
