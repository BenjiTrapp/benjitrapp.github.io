---
layout: culture
title: Attack Trees — Bottom-Up Threat Analysis
---

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

```
                    ┌──────────────────────┐
                    │   Attacker's Goal    │  ← Root Node
                    │  (e.g., Steal Data)  │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
            ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
            │ Path A  │  │ Path B  │  │ Path C  │  ← Sub-goals
            │  (OR)   │  │  (OR)   │  │  (OR)   │
            └────┬────┘  └────┬────┘  └─────────┘
                 │             │
           ┌─────┼─────┐      │
           │           │      │
      ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
      │ Step 1  │ │ Step 2  │ │ Step X  │  ← Leaf Nodes
      │  (AND)  │ │  (AND)  │ │         │     (Attack Vectors)
      └─────────┘ └─────────┘ └─────────┘
```

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

```
              ┌───────────────────────────┐
              │   Take Over User Account  │
              │          (OR)             │
              └─────────────┬─────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼──────┐      ┌────▼──────┐      ┌────▼──────┐
   │ Credential│      │  Session  │      │  Social   │
   │   Theft   │      │ Hijacking │      │Engineering│
   │   (OR)    │      │   (OR)    │      │   (AND)   │
   └─────┬─────┘      └─────┬─────┘      └─────┬─────┘
         │                   │                   │
    ┌────┼────┐         ┌────┼────┐         ┌───┼────┐
    │    │    │         │         │         │        │
  ┌──▼┐┌──▼┐┌──▼┐   ┌──▼──┐ ┌───▼──┐  ┌───▼──┐┌───▼───┐
  │Ph-││Cr-││Key│   │ XSS │ │ MITM │  │Recon ││Vishing│
  │ish││uff││log│   │     │ │      │  │ user ││ call  │
  └───┘└───┘└───┘   └─────┘ └──────┘  └──────┘└───────┘
```

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

```
┌─────────────────────────────────────────────────────────────────┐
│  1. THREAT MODEL (Top-Down)                                     │
│     → Broad identification of threats across the system         │
│     → Prioritize: which threats are highest risk?               │
│                                                                 │
│  2. ATTACK TREES (Bottom-Up)                                    │
│     → For each high-priority threat, build an attack tree       │
│     → Deep-dive: how would an attacker actually do this?        │
│     → Map existing controls to leaf nodes                       │
│     → Identify gaps and single points of failure                │
│                                                                 │
│  3. VALIDATE & ITERATE                                          │
│     → Use attack trees to run micro attack simulations          │
│     → Feed findings back into the threat model                  │
│     → Update as the system evolves                              │
└─────────────────────────────────────────────────────────────────┘
```

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
