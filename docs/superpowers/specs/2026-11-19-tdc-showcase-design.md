# Design: Transportable Detonation Chamber article, revision 2 — the showcase

Date: 2026-11-19
Supersedes: the two-act structure of `2026-11-18-tdc-article-refresh-design.md`
File under change: `_posts/2026-06-13-transportable-detonation-chamber.md`
Source of truth: the **live instance** at `http://192.168.64.4:9000/` and
`origin/main` of `~/gitRepos/transportable-detonation-chamber`

## Why a second revision, one day later

Yesterday's refresh was already behind. The author's verdict: "die screenshots
passen alle nicht mehr, die Anwendung sieht komplett anders aus inzwischen" — a
Splunk-style log search, a firewall that cuts connections but can still secure a
sample, rizin for reversing, the FileMap view. The screenshots in the published
article were taken from the repository's `static/` folder on an older build.

Every screenshot in this revision was taken today from the running VM, with
headless Chrome at 1920×1000 driven over the DevTools protocol
(`scripts/`-free, the throwaway script lives outside the repo). That also fixes
a mixed-theme set: all 21 are the **Cyberpunk** default, one Telemetry shot
aside.

## Intent

Three things at once, in the author's words: a shop window, a technical
description, and what he uses it for — malware analysis and **debugging his own
payloads**. Structure chosen in conversation: **a pure showcase**, tab by tab,
with the red-team use as the thread running through it rather than a separate
act.

## The find that carries the article

`rascal-windows-amd64.exe`, the author's own implant build, sits in the
submission history with a **MALICIOUS** verdict, and its live-memory evidence
reads like a debug log of its own tradecraft:

| Weight | Finding in memory | Rule risk |
|---|---|---|
| 2.50 | `REFLECTIVE_LOAD: CLRCreateInstance` — Win32 function to bootstrap the CLR | 9 |
| 2.00 | `ENGINE_MANAGED: kerberoast` — Rubeus Kerberoasting command | 8 |
| 0.50 | `ENGINE_MANAGED: AmsiScanBuffer` — AMSI function targeted for bypass | 8 |
| 0.00 | `ENGINE_MANAGED: -EncodedCommand`, uncorroborated, cap reached | 6 |
| 0.00 | `C2_HTTP: /task` — HTTP beacon task endpoint, cap reached | 2 |

VERDICT FLOW: 19 findings → 3 EDR alerts + 16 live memory → **6 counted, 13 not
counted**. This is the article's thesis in one screenshot: the chamber does not
tell you "detected", it tells you *which string, at which address, at what
weight, and why it was or was not counted*.

## Goals

- Every one of the 15 tabs appears, with what it is **for** when you are the one
  who wrote the payload — and, where it differs, when you are analysing someone
  else's.
- The scoring model is explained once, early, because every verdict in the
  article leans on it.
- The honest limits stay in (no byte counts, the firewall sees a connection after
  the fact, cut and capture are mutually exclusive, a capa timeout is not a
  verdict).

## Non-goals

- No API or environment-variable reference; `docs/` owns those and gets linked.
- No installation walkthrough beyond the quick start.
- No two-act narrative any more. The tabs are the spine.

## Anti-goals

- Reading like the README's tab table.
- A number in the text that is not visible in the screenshot beside it.
- Calling the project's own simulators (`injectsim`, `pipesim`, `beaconsim`,
  `shortlived`) or the author's `rascal-*` builds real malware. `mimikatz.exe` is
  real tooling and may be named as such.

## Constraints

- The post keeps its filename and date; the URL stays
  `/transportable-detonation-chamber/`.
- Images as `{{ site.baseurl }}/images/tdc-*.png`, Mermaid as
  `<pre class="mermaid">`.
- The live box had **Detonator offline** while the screenshots were taken
  (`5/6 SERVICES ONLINE`). The article says so once rather than hiding it.
- 21 images, all from today, listed in the plan.

## Approaches

| | Shape | Trade-off |
|---|---|---|
| **A (chosen)** | Pure showcase, tab by tab, red-team use as the thread | Broader coverage, less narrative pull; the 15 tabs each get a job rather than a feature blurb |
| B | Keep the two acts, swap the images | Cheapest, but the author explicitly asked for a showcase |
| C | A second, separate post about payload debugging | Leaves the main post stale and splits the screenshots |

## Structure

1. **Lead** — what the box is, the two questions, the warning, the anchor list.
2. **One screenshot, the whole idea** — the `rascal` verdict up front, as the
   thesis, with the scoring model explained around it.
3. **The box** — architecture (HTML terminal box, rebuilt), service table,
   Mermaid flow of one detonation.
4. **The fifteen tabs**, in the order the top bar has them, each with: what it
   shows, what it is for when the payload is yours, and its screenshot. Tabs
   that answer the same question are grouped under one `##` heading.
5. **Running it** — quick start, platform table, ARM64, security notes.
6. **What it is not** — honest limits.
7. **Links**.

## Left to the builder

- The grouping of the 15 tabs into `##` sections.
- Which of the two firewall views and which LOGS shot carries which point.
- Whether the scoring model sits in section 2 or gets its own section.
