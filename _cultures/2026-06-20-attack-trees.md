---
layout: culture
title: Attack Trees — Bottom-Up Threat Analysis
---

<img height="160" align="left" src="/images/attack_tree_logo.png">
Attack Trees are a structured, methodical way to describe the security of a system based on varying attacks. They represent attacks against a system in a tree structure, with the **attacker's goal as the root** and the different ways to achieve that goal as branches and leaves.

> While a [Threat Model](https://benjitrapp.github.io/cultures/2022-06-11-threat-modeling/) casts a wide net from the top — asking "what can go wrong across the system?" — an Attack Tree starts from one specific adversarial goal and decomposes it downward into the concrete steps required to achieve it. Both perspectives are essential: **top-down breadth** meets **bottom-up depth**.

## Why Attack Trees?

Traditional threat modeling (STRIDE, data flow diagrams, trust boundaries) excels at providing a **broad, top-down** overview of a system's security posture. But it can remain abstract. Attack Trees complement this by:

* Forcing you to **think like an attacker** — "How would I actually achieve this goal?"
* Decomposing complex attacks into **concrete, actionable steps**
* Revealing **single points of failure** and critical attack paths
* Enabling **quantitative risk assessment** — assign cost, difficulty, or probability to each node
* Providing a **shared language** between red teams, blue teams, and engineering

## How Attack Trees Work

An attack tree is a hierarchical diagram built from top to bottom:

<div style="margin:2rem 0;overflow-x:auto;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 395" width="100%" style="max-width:760px;display:block;margin:0 auto;font-family:'Courier New',monospace;">
  <rect width="760" height="395" fill="#0d1117" rx="10"/>
  <rect width="760" height="395" fill="none" stroke="#30363d" stroke-width="1.5" rx="10"/>
  <text x="380" y="387" font-size="8" fill="#1f2937" text-anchor="middle">Attack Tree — Generic Structure · OR = any path succeeds · AND = all steps required</text>

  <!-- connectors root → L1 -->
  <line x1="380" y1="85" x2="380" y2="112" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="167" y1="112" x2="592" y2="112" stroke="#374151" stroke-width="1.5"/>
  <line x1="167" y1="112" x2="167" y2="140" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="380" y1="112" x2="380" y2="140" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="592" y1="112" x2="592" y2="140" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>

  <!-- connector Path A → leaf nodes -->
  <line x1="167" y1="205" x2="167" y2="256" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="115" y1="256" x2="245" y2="256" stroke="#374151" stroke-width="1.5"/>
  <line x1="115" y1="256" x2="115" y2="280" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="245" y1="256" x2="245" y2="280" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>

  <!-- connector Path B → Step X -->
  <line x1="380" y1="205" x2="380" y2="280" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>

  <!-- ROOT NODE -->
  <rect x="280" y="20" width="200" height="65" fill="#1a0505" stroke="#dc2626" stroke-width="1.5" rx="5"/>
  <text x="380" y="47" font-size="12" fill="#fca5a5" text-anchor="middle" font-weight="bold">Attacker's Goal</text>
  <text x="380" y="66" font-size="10" fill="#ef4444" text-anchor="middle">(e.g., Steal Data)</text>
  <text x="487" y="49" font-size="9.5" fill="#6b7280">&#8592; Root Node</text>

  <!-- L1 — Path A (OR) -->
  <rect x="100" y="140" width="135" height="65" fill="#1c0a00" stroke="#f97316" stroke-width="1.5" rx="5"/>
  <text x="167" y="166" font-size="12" fill="#fb923c" text-anchor="middle" font-weight="bold">Path A</text>
  <text x="167" y="185" font-size="10" fill="#f97316" text-anchor="middle">(OR)</text>

  <!-- L1 — Path B (OR) -->
  <rect x="313" y="140" width="135" height="65" fill="#1c0a00" stroke="#f97316" stroke-width="1.5" rx="5"/>
  <text x="380" y="166" font-size="12" fill="#fb923c" text-anchor="middle" font-weight="bold">Path B</text>
  <text x="380" y="185" font-size="10" fill="#f97316" text-anchor="middle">(OR)</text>

  <!-- L1 — Path C (OR) -->
  <rect x="525" y="140" width="135" height="65" fill="#1c0a00" stroke="#f97316" stroke-width="1.5" rx="5"/>
  <text x="592" y="166" font-size="12" fill="#fb923c" text-anchor="middle" font-weight="bold">Path C</text>
  <text x="592" y="185" font-size="10" fill="#f97316" text-anchor="middle">(OR)</text>
  <text x="667" y="163" font-size="9.5" fill="#6b7280">&#8592; Sub-goals</text>

  <!-- L2 — Step 1 (AND) -->
  <rect x="60" y="280" width="110" height="65" fill="#052e16" stroke="#166534" stroke-width="1.5" rx="5"/>
  <text x="115" y="306" font-size="12" fill="#4ade80" text-anchor="middle" font-weight="bold">Step 1</text>
  <text x="115" y="324" font-size="10" fill="#22c55e" text-anchor="middle">(AND)</text>

  <!-- L2 — Step 2 (AND) -->
  <rect x="190" y="280" width="110" height="65" fill="#052e16" stroke="#166534" stroke-width="1.5" rx="5"/>
  <text x="245" y="306" font-size="12" fill="#4ade80" text-anchor="middle" font-weight="bold">Step 2</text>
  <text x="245" y="324" font-size="10" fill="#22c55e" text-anchor="middle">(AND)</text>

  <!-- L2 — Step X (no gate) -->
  <rect x="325" y="280" width="110" height="65" fill="#161b22" stroke="#374151" stroke-width="1.5" rx="5"/>
  <text x="380" y="317" font-size="12" fill="#8b949e" text-anchor="middle" font-weight="bold">Step X</text>
  <text x="442" y="296" font-size="9.5" fill="#6b7280">&#8592; Leaf Nodes</text>
  <text x="442" y="314" font-size="9.5" fill="#6b7280">   (Attack Vectors)</text>
</svg>
</div>

### Core Concepts

**Root Node** — The attacker's ultimate goal (e.g., "Exfiltrate customer PII", "Gain admin access", "Disrupt payment processing")

**Intermediate Nodes** — Sub-goals or stages that contribute to achieving the root goal

**Leaf Nodes** — The actual, atomic attack vectors an attacker would execute (e.g., "Exploit SQL injection in /api/search", "Phish employee for VPN credentials")

**Gates (Logical Operators):**

| Gate | Meaning | Example |
| --- | --- | --- |
| **OR** | Any one child is sufficient to achieve the parent | Attacker can steal credentials via phishing OR credential stuffing OR session hijacking |
| **AND** | All children must succeed together | Attacker must bypass MFA AND have valid password AND evade detection |

**Node Attributes** — Each leaf node can be annotated with:
* **Complexity** — How difficult is this step? (Low / Medium / High)
* **Cost** — How expensive for the attacker?
* **Detectability** — How likely are defenders to notice?
* **Required capabilities** — What threat actor profile is needed?
* **Existing controls** — What security measures already mitigate this?

### A Practical Example: Account Takeover

<div style="margin:2rem 0;overflow-x:auto;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 475" width="100%" style="max-width:860px;display:block;margin:0 auto;font-family:'Courier New',monospace;">
  <rect width="860" height="475" fill="#0d1117" rx="10"/>
  <rect width="860" height="475" fill="none" stroke="#30363d" stroke-width="1.5" rx="10"/>
  <text x="430" y="467" font-size="8" fill="#1f2937" text-anchor="middle">Account Takeover — Attack Tree Example</text>

  <!-- connectors root → L1 -->
  <line x1="430" y1="80" x2="430" y2="112" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="122" y1="112" x2="737" y2="112" stroke="#374151" stroke-width="1.5"/>
  <line x1="122" y1="112" x2="122" y2="130" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="429" y1="112" x2="429" y2="130" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="737" y1="112" x2="737" y2="130" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>

  <!-- connectors Credential Theft → L2 -->
  <line x1="122" y1="205" x2="122" y2="263" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="44"  y1="263" x2="200" y2="263" stroke="#374151" stroke-width="1.5"/>
  <line x1="44"  y1="263" x2="44"  y2="295" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="122" y1="263" x2="122" y2="295" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="200" y1="263" x2="200" y2="295" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>

  <!-- connectors Session Hijacking → L2 -->
  <line x1="429" y1="205" x2="429" y2="263" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="379" y1="263" x2="479" y2="263" stroke="#374151" stroke-width="1.5"/>
  <line x1="379" y1="263" x2="379" y2="295" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="479" y1="263" x2="479" y2="295" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>

  <!-- connectors Social Engineering → L2 -->
  <line x1="737" y1="205" x2="737" y2="263" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="684" y1="263" x2="789" y2="263" stroke="#374151" stroke-width="1.5"/>
  <line x1="684" y1="263" x2="684" y2="295" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="789" y1="263" x2="789" y2="295" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,3"/>

  <!-- ROOT NODE -->
  <rect x="315" y="15" width="230" height="65" fill="#1a0505" stroke="#dc2626" stroke-width="1.5" rx="5"/>
  <text x="430" y="42" font-size="12" fill="#fca5a5" text-anchor="middle" font-weight="bold">Take Over User Account</text>
  <text x="430" y="62" font-size="10" fill="#ef4444" text-anchor="middle">(OR)</text>

  <!-- L1 — Credential Theft (OR) -->
  <rect x="50"  y="130" width="145" height="75" fill="#1c0a00" stroke="#f97316" stroke-width="1.5" rx="5"/>
  <text x="122" y="159" font-size="11" fill="#fb923c" text-anchor="middle" font-weight="bold">Credential</text>
  <text x="122" y="175" font-size="11" fill="#fb923c" text-anchor="middle" font-weight="bold">Theft</text>
  <text x="122" y="194" font-size="10" fill="#f97316" text-anchor="middle">(OR)</text>

  <!-- L1 — Session Hijacking (OR) -->
  <rect x="357" y="130" width="145" height="75" fill="#1c0a00" stroke="#f97316" stroke-width="1.5" rx="5"/>
  <text x="429" y="159" font-size="11" fill="#fb923c" text-anchor="middle" font-weight="bold">Session</text>
  <text x="429" y="175" font-size="11" fill="#fb923c" text-anchor="middle" font-weight="bold">Hijacking</text>
  <text x="429" y="194" font-size="10" fill="#f97316" text-anchor="middle">(OR)</text>

  <!-- L1 — Social Engineering (AND) — purple gate: all steps required -->
  <rect x="665" y="130" width="145" height="75" fill="#170530" stroke="#7c3aed" stroke-width="1.5" rx="5"/>
  <text x="737" y="159" font-size="11" fill="#c084fc" text-anchor="middle" font-weight="bold">Social</text>
  <text x="737" y="175" font-size="11" fill="#c084fc" text-anchor="middle" font-weight="bold">Engineering</text>
  <text x="737" y="194" font-size="10" fill="#a78bfa" text-anchor="middle">(AND)</text>

  <!-- L2 — under Credential Theft -->
  <rect x="9"   y="295" width="70" height="65" fill="#161b22" stroke="#374151" stroke-width="1" rx="4"/>
  <text x="44"  y="332" font-size="10" fill="#8b949e" text-anchor="middle">Phishing</text>

  <rect x="87"  y="295" width="70" height="65" fill="#161b22" stroke="#374151" stroke-width="1" rx="4"/>
  <text x="122" y="322" font-size="10" fill="#8b949e" text-anchor="middle">Cred</text>
  <text x="122" y="338" font-size="10" fill="#8b949e" text-anchor="middle">Stuffing</text>

  <rect x="165" y="295" width="70" height="65" fill="#161b22" stroke="#374151" stroke-width="1" rx="4"/>
  <text x="200" y="322" font-size="10" fill="#8b949e" text-anchor="middle">Key-</text>
  <text x="200" y="338" font-size="10" fill="#8b949e" text-anchor="middle">logging</text>

  <!-- L2 — under Session Hijacking -->
  <rect x="334" y="295" width="90" height="65" fill="#161b22" stroke="#374151" stroke-width="1" rx="4"/>
  <text x="379" y="332" font-size="10" fill="#8b949e" text-anchor="middle">XSS</text>

  <rect x="434" y="295" width="90" height="65" fill="#161b22" stroke="#374151" stroke-width="1" rx="4"/>
  <text x="479" y="332" font-size="10" fill="#8b949e" text-anchor="middle">MITM</text>

  <!-- L2 — under Social Engineering -->
  <rect x="637" y="295" width="95" height="65" fill="#161b22" stroke="#374151" stroke-width="1" rx="4"/>
  <text x="684" y="322" font-size="10" fill="#8b949e" text-anchor="middle">Recon</text>
  <text x="684" y="338" font-size="10" fill="#8b949e" text-anchor="middle">User</text>

  <rect x="742" y="295" width="95" height="65" fill="#161b22" stroke="#374151" stroke-width="1" rx="4"/>
  <text x="789" y="322" font-size="10" fill="#8b949e" text-anchor="middle">Vishing</text>
  <text x="789" y="338" font-size="10" fill="#8b949e" text-anchor="middle">Call</text>

  <!-- legend -->
  <rect x="175" y="388" width="210" height="28" fill="#1c0a00" stroke="#f97316" stroke-width="1" rx="4"/>
  <text x="280" y="407" font-size="9" fill="#fb923c" text-anchor="middle">&#9646; OR: any sub-path succeeds</text>
  <rect x="405" y="388" width="240" height="28" fill="#170530" stroke="#7c3aed" stroke-width="1" rx="4"/>
  <text x="525" y="407" font-size="9" fill="#c084fc" text-anchor="middle">&#9646; AND: all sub-paths required</text>
</svg>
</div>

From this tree, defenders can immediately see:
* There are 7 distinct attack vectors (leaf nodes) to defend against
* The social engineering path requires BOTH steps (AND gate) — breaking either one blocks the path
* Credential theft has three independent options (OR gate) — all three must be mitigated
* XSS leading to session hijacking might be the cheapest attack for the adversary

## Top-Down vs. Bottom-Up: Complementary Directions

Understanding why both perspectives matter is crucial to building robust security:

| | **Threat Modeling (Top-Down)** | **Attack Trees (Bottom-Up)** |
| --- | --- | --- |
| **Starting point** | The system architecture and data flows | A specific attacker goal |
| **Question asked** | "What can go wrong across this system?" | "How exactly would an attacker achieve this goal?" |
| **Breadth vs. depth** | Broad coverage, may stay abstract | Deep analysis of specific scenarios |
| **Output** | Categorized threats (STRIDE), trust boundaries, risk priorities | Concrete attack paths, required steps, control gaps |
| **Blind spot** | Can miss detailed, multi-step attack chains | Can miss systemic issues outside the chosen goal |
| **Best for** | Initial security assessment, architecture review, compliance | Validating controls, red team planning, incident preparation |

### Stronger Together

The real power comes from combining both:

<div class="ghidra-mock" style="margin:2rem 0;">
  <div class="gm-bar">
    <span style="color:#ff5f56;">●</span>&nbsp;<span style="color:#ffbd2e;">●</span>&nbsp;<span style="color:#27c93f;">●</span>
    <span style="margin-left:12px;color:#8b949e;font-size:11px;">threat-model-and-attack-tree-workflow.md</span>
  </div>
  <div style="padding:20px 24px 22px;font-family:'Courier New',monospace;font-size:12.5px;line-height:1.8;">

    <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:12px;">
      <span style="flex:0 0 auto;background:#0c1829;border:1.5px solid #1d4ed8;border-radius:4px;padding:3px 10px;color:#60a5fa;font-weight:700;font-size:13px;line-height:1.6;">1</span>
      <div>
        <div style="color:#60a5fa;font-weight:700;margin-bottom:5px;letter-spacing:.03em;">THREAT MODEL <span style="color:#374151;font-weight:400;font-size:11px;">(Top-Down)</span></div>
        <div style="color:#484f58;font-size:11px;">→ Broad identification of threats across the system</div>
        <div style="color:#484f58;font-size:11px;">→ Prioritize: which threats are highest risk?</div>
      </div>
    </div>

    <div style="padding-left:16px;color:#1f2937;font-size:13px;margin-bottom:12px;line-height:1;">│</div>

    <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:12px;">
      <span style="flex:0 0 auto;background:#170530;border:1.5px solid #7c3aed;border-radius:4px;padding:3px 10px;color:#c084fc;font-weight:700;font-size:13px;line-height:1.6;">2</span>
      <div>
        <div style="color:#c084fc;font-weight:700;margin-bottom:5px;letter-spacing:.03em;">ATTACK TREES <span style="color:#374151;font-weight:400;font-size:11px;">(Bottom-Up)</span></div>
        <div style="color:#484f58;font-size:11px;">→ For each high-priority threat, build an attack tree</div>
        <div style="color:#484f58;font-size:11px;">→ Deep-dive: how would an attacker actually do this?</div>
        <div style="color:#484f58;font-size:11px;">→ Map existing controls to leaf nodes</div>
        <div style="color:#484f58;font-size:11px;">→ Identify gaps and single points of failure</div>
      </div>
    </div>

    <div style="padding-left:16px;color:#1f2937;font-size:13px;margin-bottom:12px;line-height:1;">│</div>

    <div style="display:flex;gap:14px;align-items:flex-start;">
      <span style="flex:0 0 auto;background:#052e16;border:1.5px solid #166534;border-radius:4px;padding:3px 10px;color:#4ade80;font-weight:700;font-size:13px;line-height:1.6;">3</span>
      <div>
        <div style="color:#4ade80;font-weight:700;margin-bottom:5px;letter-spacing:.03em;">VALIDATE &amp; ITERATE</div>
        <div style="color:#484f58;font-size:11px;">→ Use attack trees to run micro attack simulations</div>
        <div style="color:#484f58;font-size:11px;">→ Feed findings back into the threat model</div>
        <div style="color:#484f58;font-size:11px;">→ Update as the system evolves</div>
      </div>
    </div>

  </div>
</div>

**Example workflow:**
1. A STRIDE-based threat model identifies "Elevation of Privilege via API" as a high-risk threat
2. An attack tree decomposes this goal into concrete paths: IDOR, JWT manipulation, role parameter tampering, privilege escalation via dependency vulnerability
3. Security controls are mapped to each leaf node — revealing that JWT manipulation has no mitigation
4. A targeted security test (micro attack simulation) validates whether the gap is exploitable
5. The finding feeds back into the backlog and the threat model is updated

## The Purple Team Mindset

Attack trees are uniquely powerful because they serve **both sides** of the security equation. They are a natural collaboration artifact for purple teaming — where offensive and defensive perspectives merge.

### The Attacker's View (Red Team)

When building an attack tree from an offensive perspective, you ask:

* "What is my goal?" (Root node)
* "What are all the ways I could achieve this?"
* "Which path is cheapest/easiest/least detectable?"
* "Where are the gaps in their defenses?"

The red team uses attack trees to:
* **Plan engagements** — Identify the most promising attack paths before testing
* **Prioritize efforts** — Focus on paths with high impact and low complexity
* **Document findings** — Show exactly how an attack chain was executed
* **Discover alternative paths** — If one path is blocked, what else is possible?

### The Defender's View (Blue Team)

When reviewing an attack tree from a defensive perspective, you ask:

* "Which leaf nodes do we already have controls for?"
* "Where are the AND gates?" (Breaking one child blocks the entire path)
* "Where are the OR gates?" (ALL children must be mitigated)
* "What is the cheapest way to eliminate the most paths?"

The blue team uses attack trees to:
* **Prioritize control implementation** — Focus on controls that block the most paths (closest to root)
* **Identify single points of failure** — Nodes where one missing control opens an entire attack path
* **Validate detection coverage** — Are there leaf nodes we can't even detect?
* **Justify security investment** — "This one control blocks 4 out of 7 attack paths"

### The Purple Sweet Spot

When red and blue build attack trees **together**, something powerful happens:

* **Attackers challenge defenders** — "You have WAF, but does it catch this specific payload variation?"
* **Defenders inform attackers** — "We have compensating controls here you might not see externally"
* **Both discover unknowns** — "Neither of us considered this path — let's test it"
* **Controls get validated** — Not just theoretically present, but actually effective against the modeled attack

> An attack tree is a living document. Every penetration test result, every incident, every new feature should potentially update it. The tree grows as your understanding of the threat landscape deepens.

### Mapping Security Controls in Attack Trees

A critical step is overlaying your existing security controls onto the tree:

![](/images/attacktree_credential_stuffing.png)

This visualization makes it immediately clear:
* What is protected (and how effectively)
* What has gaps
* What the implementation status of planned controls is
* Where to invest next

## Tooling: attacktree.online

[attacktree.online](https://attacktree.online) by [Christian Schneider](https://christian-schneider.net/de/development/attacktree-free-saas/) is a free SaaS platform for building and analyzing attack trees. It provides a structured workflow that covers the full lifecycle:

### Key Features

**1. Threat Actor Modeling**
* Define threat actors with specific capabilities and motivations
* Tailor the tree to realistic adversary profiles (script kiddie vs. nation-state)

**2. Impact Definition**
* For each attack goal, define the business impact
* Maps to stakeholders: customers, business operations, reputation

**3. Tree Construction**
* Visual tree builder with AND/OR gates
* Assign actors and complexity levels to leaf nodes
* Built-in suggestion library with **MITRE CAPEC and CWE** mappings
* Optional AI suggestions for additional attack vectors

**4. Security Control Management**
* Add preventive, detective, and compensating controls
* Position controls strategically (closer to root = broader protection)
* Define effectiveness and cost for prioritization
* Track implementation status per control
* Validation steps for audit confirmation

**5. Risk Simulation**
* Monte Carlo simulation to identify critical paths
* What-if analysis for roadmap planning
* Identify "Achilles' heels" — single points where a missing control opens multiple paths
* Generate prioritized implementation roadmaps

**6. Reporting & Integration**
* Interactive dashboards
* PDF reports and Excel exports (control-to-attack mappings)
* SVG export for documentation
* API for integration into existing toolchains

### Micro Attack Simulations

A particularly powerful concept enabled by attack trees: rather than running full-blown red team engagements, use the tree to run **targeted micro simulations** — testing specific leaf nodes or paths to validate whether controls actually work as expected. This is:

* Cheaper than a full penetration test
* More focused and actionable
* Repeatable as part of continuous validation
* Aligned with specific risk scenarios rather than broad scope

## Building an Attack Tree: Step by Step

1. **Define the goal** — What does the attacker want? Be specific. "Exfiltrate customer payment data" is better than "hack the system."

2. **Brainstorm attack paths** — What are the fundamentally different approaches? (Network attack, social engineering, insider threat, supply chain, physical access...)

3. **Decompose into steps** — For each path, what intermediate steps are needed? Keep going until you reach atomic, testable attack vectors.

4. **Assign gate logic** — Is this an OR (any path works) or AND (all steps required)? AND gates are your friend as a defender.

5. **Annotate leaf nodes** — Add complexity, required capabilities, and cost. This helps prioritize.

6. **Map existing controls** — For each leaf node, what controls exist? What is their status and effectiveness?

7. **Analyze and prioritize** — Where are the cheapest, easiest, least-detected paths? Those need attention first.

8. **Validate** — Use the tree to derive targeted tests (micro attack simulations) that confirm controls work.

9. **Iterate** — Update the tree after incidents, pen tests, architecture changes, or new threat intelligence.

## When to Use Attack Trees

Attack trees are particularly valuable when:

* A threat model has identified a high-priority threat that needs deeper analysis
* Planning a penetration test or red team engagement (scope and focus)
* Justifying security investment to stakeholders ("this control blocks these 5 attack paths")
* After an incident — modeling how the attack worked and what alternative paths existed
* Evaluating a new feature's security posture before launch
* During purple team exercises to structure collaboration
* Assessing third-party/supply chain risk

## Additional Sources and References

* [Bruce Schneier - Attack Trees (1999)](https://www.schneier.com/academic/archives/1999/12/attack_trees.html) — The original paper that introduced attack trees to the security community
* [attacktree.online](https://attacktree.online) — Free SaaS platform for attack tree modeling with risk simulation
* [Christian Schneider - Attack Tree Consulting](https://christian-schneider.net/de/development/attacktree-free-saas/) — Background on the methodology and tooling
* [Micro Attack Simulations (BruCON/DeepSec 2023)](https://christian-schneider.net/blog/micro-attack-simulations/) — Using attack trees for targeted validation
* [MITRE CAPEC](https://capec.mitre.org/) — Common Attack Pattern Enumeration and Classification (useful for populating leaf nodes)
* [Threat Modeling: Designing for Security (Adam Shostack)](https://www.amazon.de/-/en/Adam-Shostack/dp/1118809998) — Chapter on attack trees in the context of broader threat modeling
* [OWASP Attack Tree Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Attack_Surface_Analysis_Cheat_Sheet.html) — Practical guidance for building attack trees
