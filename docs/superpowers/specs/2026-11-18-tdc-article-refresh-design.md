# Design: Refresh of the Transportable Detonation Chamber article

Date: 2026-11-18
File under change: `_posts/2026-06-13-transportable-detonation-chamber.md`
Source of truth for facts: `origin/main` of `~/gitRepos/transportable-detonation-chamber`
(README, `docs/*.md`, `static/*.png`)

## Intent and why

The article is from June 2026 and describes a box that has roughly tripled since:
7 Web UI tabs have become 17, the detonation now ends in a scored verdict instead
of a list of alerts, and three whole capabilities (named pipe interception, a
firewall with a panic button, a log search with its own dashboards) did not exist
when it was written. Its API and configuration tables are now wrong.

The refresh has to do three things at once, in the author's words: be a shop
window for the project, describe the technique, and say what he uses it for —
malware analysis and testing his own payloads. It is told as a story.

## Goals

- A reader who has never seen the project understands what the chamber is, what
  runs inside it, and why it is built that way.
- Both uses are visible as uses, not as feature lists: analysing a sample, and
  pointing the same box at one's own payload to see what gets caught.
- Every new capability of the box appears at least once, with a screenshot where
  a screenshot carries meaning.
- The style of the recent posts (ViperTunnel, MostShittyEDR, TrashPandaPaws):
  English, plain Markdown, anchor list at the top, tables for comparisons,
  Mermaid for flows, a blockquote warning where it is warranted.

## Non-goals

- No API reference and no environment-variable table. Those live in `docs/api.md`
  and `docs/configuration.md` now and go stale in a blog post. They get linked.
- No installation walkthrough beyond the four commands of the quick start.
- No per-tab catalogue. The tabs appear where the story needs them.

## Anti-goals

- Reading like a copy of the README. If a paragraph could be pasted into the
  README without anybody noticing, it is the wrong paragraph.
- Claiming results the screenshots do not show. Numbers, verdicts, scores and
  rule names in the text come from the screenshots used, or they do not appear.
- Naming a sample as real malware when the screenshot shows one of the project's
  own simulators.

## Constraints

- Jekyll: images as `{{ site.baseurl }}/images/<file>`, Mermaid as
  `<pre class="mermaid">`, which `_layouts/default.html` already loads.
- The post keeps its date and filename so the URL `/transportable-detonation-chamber/`
  does not change.
- `demo.gif` is 10 MB and gets linked to GitHub, not embedded.
- The design doc lands under `docs/`, which is added to Jekyll's `exclude` in
  `_config.yml` so the site does not publish it.

## Approaches

| | Shape | Trade-off |
|---|---|---|
| **A (chosen)** | Two acts of one story: the box, then a detonation end to end, then the same box pointed at the author's own payload, then a gallery of what the two acts did not need | The longest of the three (~2,500 words), but every screenshot is evidence for a step and both uses are told without walking the tour twice |
| B | The present structure, updated tab by tab | Fastest and complete, but reads like the README and never says what it is for |
| C | One continuous detonation, everything explained where it occurs | Densest and shortest, but half the features degrade to a closing list and payload testing shrinks to a paragraph |

Chosen in conversation: **A**, with ~18 screenshots, and both diagram styles —
Mermaid for flows, the existing hand-built HTML terminal box for the architecture.

## The structure that was decided

1. **Lead** — logo left, one paragraph: what the chamber is and the one sentence
   that it answers two questions, "what did this sample do" and "what does my own
   payload look like to the engines". Anchor list. Warning blockquote
   ("treat the VM as compromised").
2. **Why a box of my own** — the problem, in the author's terms: correlating
   Sysmon, YARA, ETW and sandbox output by hand, and no honest answer to whether
   one's own payload is caught. Short, no product language.
3. **What runs inside** — the hand-built HTML terminal box, rebuilt for today's
   services (Web UI, DetonatorAgent, LitterBox, Rustinel, Fibratus, Sysmon, the
   four live-memory tools, Exit Capture), plus the services table. A Mermaid
   flow for one detonation, stage by stage.
4. **Act 1 — a sample, end to end** — Submit and the verdict
   (`detonation_results`), then the questions a verdict raises, each answered in
   its own tab: which rules fired (`alerts_drilldown`), what one process did
   (`tracing`), who spawned it (`graph_tree`), which Windows events correspond
   (`sysmon_events`), whom it talked to and how to cut it off
   (`firewall_tab`, `firewall_cut`).
5. **Act 2 — my own payload** — the same box, the other direction: does it trip
   a rule at all, which byte does Defender hate, what does Aether see in its
   memory (`live_memory`), is the beacon periodic (`detonation_beaconing`), is my
   pipe name a known C2 family and what travels through it (`pipes_tab`), does it
   look packed (`pe_packing_analysis`), and taking it apart (`rizin`).
   This act carries the ATT&CK-ish framing of what a defender would have seen.
6. **The rest of the box** — compact gallery with one paragraph each: LOGS and
   own dashboards (`logs_tab`, `dashboards`), the ETW browser (`etw_browser`),
   FileMap/Hex (`file_map`), the two themes (`theme_telemetry`), the offline wiki
   (`wiki`), tool updates (`tool_updates`).
7. **Running it** — quick start (four commands per host), the ARM64 note, the
   security notes as a short list, links to the guide pages.
8. **Links** — repository, the guide, the demo GIF, the credited projects that
   do the actual detection work.

## Images

~19 screenshots from `origin/main:static/`, copied into `images/` with the
existing `tdc-` prefix and hyphenated names (`tdc-theme-cyberpunk.png`,
`tdc-detonation-results.png`, …). The 12 outdated `tdc-*.png` files that only
this post referenced are deleted; `tdc-logo.png` stays. Alt text says what is in
the picture, in the tone the repository README uses for its own captions.

## Left to the builder

- Exact wording and paragraph order inside each section.
- Which of the three graph layouts, and which of the three firewall views, best
  carry their paragraph.
- Whether the Mermaid detonation flow is one diagram or two (pipeline, verdict).
- The precise numbers quoted, which must be read off the screenshots used.
