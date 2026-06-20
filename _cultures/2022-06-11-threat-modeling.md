---
layout: culture
title: Threat Modeling 
---
<img height="120" align="left" src="/images/threat_modeling_logo.jpg" >
Threat Modeling works to identify, communicate, and understand threats and mitigations within the context of protecting something of value.

A Threat Model is a structured representation of all the information that affects the security of an application. In essence, it is a view of the application and its environment through the lens of security.

## Threat Modeling at a glance

Threat modeling is analyzing representations of a system to highlight concerns about security and privacy characteristics.

At the highest levels, when we Threat Model, we ask four key questions:

* What are we working on?
* What can go wrong?
* What are we going to do about it?
* Did we do a good enough job?

> A Threat Model is NOT an architectural model of the system!
  -> No complete architecture
  -> Focuses on data flow

## Why Threat Model?

When you perform Threat Modeling, you begin to recognize what can go wrong in a system. It also allows you to pinpoint design and implementation issues that require mitigation, whether it is early in or throughout the lifetime of the system. The output of the Threat Model, which are known as threats, informs decisions that you might make in subsequent design, development, testing, and post-deployment phases.

## Who should Threat Model?

You. Everyone. Anyone who is concerned about the privacy, safety, and security of their system.

But let's be more specific — threat modeling is not an activity reserved for security teams or senior architects. It works best when it involves **the people who build the system**:

* **Developers** — They know the code paths, edge cases, and shortcuts taken under deadline pressure
* **Product owners** — They understand what data matters most and which features carry business risk
* **Ops/SRE** — They know where the infrastructure boundaries and failure modes are
* **QA/Testers** — They think adversarially by nature and are skilled at finding "what if" scenarios
* **Security engineers** — They bring threat knowledge and attack patterns, but shouldn't be the only voice in the room

> The best threat models are built by cross-functional teams, not handed down from a security ivory tower.

## Threat Modeling Manifesto

Source:  [threatmodelingmanifesto.org](https://www.threatmodelingmanifesto.org/)

#### Values

> We have come to value:

* A culture of finding and fixing design issues over checkbox compliance.
* People and collaboration over processes, methodologies, and tools.
* A journey of understanding over a security or privacy snapshot.
* Doing Threat Modeling over talking about it.
* Continuous refinement over a single delivery.
  
#### Principles

> We follow these principles:

* The best use of Threat Modeling is to improve the security and privacy of a system through early and frequent analysis.
* Threat Modeling must align with an organization's development practices and follow design changes in iterations that are each scoped to manageable portions of the system.
* The outcomes of Threat Modeling are meaningful when they are of value to stakeholders.
* Dialog is key to establishing the common understandings that lead to value, while documents record those understandings, and enable measurement.

## Building a Threat Modeling Culture

The manifesto above says it best: value **finding and fixing** over checkbox compliance. But how do you actually embed that mindset in a team?

### Make it accessible, not academic

The biggest cultural barrier to threat modeling is the perception that it's a heavyweight, formal process that requires security expertise. It doesn't have to be.

* **Start with 30-minute sessions** — A whiteboard, the four key questions, and the people who built the feature. That's enough.
* **Use plain language** — "What can go wrong?" is more inclusive than "Enumerate attack vectors against the authentication subsystem."
* **No special training required to participate** — Anyone can think about what might go wrong. Security engineers guide; the team contributes.
* **Normalize imperfection** — A quick, incomplete threat model that exists is infinitely more valuable than a perfect one that never gets done.

### Integrate into existing workflows

Threat modeling shouldn't be a separate ceremony that competes for calendar space. It should live where the work already happens:

* **During design reviews** — When a new feature is designed, ask "What can go wrong?" as naturally as asking "How will we test this?"
* **During sprint planning** — If a story touches authentication, payment, or PII, tag it for a quick threat discussion
* **During architecture decision records (ADRs)** — Include a "Threats considered" section
* **During incident retrospectives** — Ask "Could threat modeling have caught this earlier?" to reinforce the habit

### Create psychological safety

Threat modeling requires people to say "I don't know" and "I think this could be broken." That only happens in teams where:

* Raising concerns is rewarded, not punished
* There's no blame for design weaknesses found — they're natural and expected
* Junior developers feel safe questioning senior architects' designs
* "I hadn't thought of that" is a positive statement, not an admission of failure

### Scale through champions, not mandates

Top-down mandates create compliance theater. Instead:

* **Identify threat modeling champions** — Enthusiastic developers in each team who facilitate sessions and coach others
* **Create a community of practice** — Champions meet regularly to share learnings, refine templates, and celebrate wins
* **Gamify it** — Run "Threat Modeling Tuesdays," internal CTFs based on real findings, or friendly competitions between teams
* **Share war stories** — Nothing motivates like hearing "We caught this in threat modeling and avoided a P1 incident"

### Measure culture, not just output

Don't measure success by the number of threat models produced (that incentivizes box-ticking). Instead measure:

* How early in the lifecycle are threats being found?
* Are teams initiating threat modeling themselves, or only when security asks?
* Are threat model findings being addressed, or rotting in a backlog?
* Is the team's security awareness improving over time (fewer repeated vulnerability patterns)?
* Are developers referencing threat models during code reviews?

## Integrating Threat Modeling into Development Practices

### Shift-left: Threat model at the speed of development

Traditional threat modeling happens once, late, and gets outdated. Modern teams treat it as a living practice:

```
┌─────────────────────────────────────────────────────────────────┐
│  Feature Idea → Design → Threat Model → Build → Review → Ship  │
│       ↑                                                    │    │
│       └────────────── Feedback Loop ───────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

* **Trigger: New feature or significant change** — Not a quarterly ritual
* **Scope: The change, not the entire system** — Incremental threat modeling per feature/story
* **Output: Actionable items in the backlog** — Not a PDF in a shared drive
* **Cadence: Continuous** — Revisit when assumptions change

### Lightweight threat modeling formats

Not every change needs a full STRIDE analysis. Match the depth to the risk:

| **Change type** | **Threat modeling effort** |
| --- | --- |
| New external-facing API | Full session (45-60 min), STRIDE, data flow diagram |
| Internal refactoring with no new data flows | Quick sanity check (10 min), verbal "what could go wrong?" |
| New third-party integration | Focused session on trust boundaries and data sharing |
| Configuration/infrastructure change | Checklist-based review of access and exposure |
| UI-only change with no new data handling | Skip or minimal ("does this expose anything new?") |

### Connect findings to action

A threat model that doesn't result in change is waste. Close the loop:

1. **Threats become backlog items** — with severity, owner, and acceptance criteria
2. **Mitigations become security requirements** — testable and verifiable
3. **Accepted risks are documented** — with explicit sign-off and review dates
4. **Findings inform automated checks** — e.g., a threat about SQL injection leads to a Semgrep rule in CI

### Avoiding common cultural pitfalls

| **Pitfall** | **Symptom** | **Antidote** |
| --- | --- | --- |
| Security owns it | Only security team creates threat models | Developers facilitate; security advises |
| One and done | Threat model created at project start, never updated | Trigger reviews on significant changes |
| Analysis paralysis | Sessions drag on for hours with no output | Timebox strictly; "good enough" beats "perfect" |
| Threat model theater | Beautiful documents that nobody reads or acts on | Threats must become tickets; track resolution |
| Ivory tower language | Teams can't relate to abstract threat categories | Use concrete examples: "What if a user sends 10k requests/sec here?" |
| No feedback loop | Teams never learn if their mitigations worked | Connect incident data back to threat models |

## How to create a Threat Model

We already learned that a Threat Model is based on a Data Flow. Let's paint one:

<p align="center">
<img width="600" src="/images/dataflow.png">
</p>

In the picture above we have the following components:

* External Entity - e.g., clients, other systems, dependencies
* Process - Architecture-centered functionality e.g., dispatcher, input validator
* Data Store - e.g., database, file system
* Data Flow - Domain-specific explanation of data e.g., “Login Requests

Wait where's the Security coming in? This description doesn't secure anything yet.

#### Trusted Boundaries

Time to bring some Security aspects in and optimize the Dataflow Model to secure things by introducing: Trusted Boundaries

<p align="center">
<img width="600" src="/images/trustboundary.png">
</p>

Like shown in the picture above - draw a trust boundary when data from one party to another is not trusted

**Untrusted examples:**

* Data from a web browser (e.g., external entity)
* Data from one machine to another

**Trusted examples:**

* Data from another process within the same runtime environment
* Data from your own database

## STRIDE: A Framework for Systematic Threat Identification

Trusted Boundaries are essential, but to systematically identify security concerns we need a structured approach. While several frameworks exist (OCTAVE, TRIKE, PASTA, LINDDUN for privacy), STRIDE remains the most widely adopted. It was developed by Praerit Garg and Loren Kohnfelder at Microsoft and provides a mnemonic that maps threat categories to violated security properties.

In simple terms, any cyber attack can be classified among STRIDE:

* **S**poofing
* **T**ampering
* **R**epudiation
* **I**nformation Disclosure
* **D**enial of Service
* **E**levation of Privilege

### Spoofing — Violates Authentication

Spoofing means pretending to be someone or something you're not. An attacker gains access to victim credentials (via brute force, phishing, credential stuffing, or token theft) and impersonates the legitimate user or system.

**Real-world examples:**
* Attacker reuses a leaked JWT token to authenticate as another user
* A malicious service impersonates a trusted microservice in a service mesh
* DNS spoofing redirects users to a phishing page that looks like the real login

**Mitigations:**
* Multi-factor authentication (MFA)
* Mutual TLS (mTLS) for service-to-service communication
* Short-lived tokens with proper rotation
* Certificate pinning for critical connections

### Tampering — Violates Integrity

Tampering is the unauthorized modification of data or code, whether at rest, in transit, or during processing.

**Real-world examples:**
* Man-in-the-middle attack modifying API responses between services
* Attacker modifies a configuration file on disk to disable security controls
* Supply chain attack injecting malicious code into a dependency

**Mitigations:**
* TLS for data in transit; encryption at rest
* Digital signatures for code and artifacts (e.g., container image signing)
* Integrity checks (checksums, SRI hashes for frontend assets)
* Immutable infrastructure patterns

### Repudiation — Violates Non-Repudiation

Repudiation occurs when a user can deny performing an action because there's no proof. This is critical for financial transactions, administrative actions, and data access.

**Real-world examples:**
* User claims they never authorized a bank transfer, and no audit trail exists
* Admin deletes records without any log of who performed the deletion
* A developer deploys malicious code and the pipeline has no attribution trail

**Mitigations:**
* Comprehensive audit logging (who, what, when, from where)
* Digital signatures for critical actions
* Tamper-evident log storage (append-only, shipped to separate system)
* Non-repudiation tokens for high-value transactions

### Information Disclosure — Violates Confidentiality

Information disclosure means exposing sensitive data to unauthorized parties. This covers everything from verbose error messages to full database breaches.

**Real-world examples:**
* API returns full user objects including password hashes and internal IDs
* Error pages expose stack traces, database connection strings, or internal paths
* S3 bucket misconfiguration exposes customer PII to the internet
* Side-channel attacks leaking cryptographic keys through timing

**Mitigations:**
* Principle of least privilege for data access
* Response filtering — only return fields the caller needs
* Proper error handling (generic messages externally, detailed logs internally)
* Encryption at rest and in transit; proper key management
* Data classification and DLP controls

### Denial of Service — Violates Availability

Denial of Service (DoS) makes a system unavailable to its legitimate users by exhausting resources (CPU, memory, bandwidth, connections, disk).

**Real-world examples:**
* Volumetric DDoS flooding a public API endpoint
* Algorithmic complexity attack sending inputs that trigger worst-case performance (e.g., ReDoS)
* Resource exhaustion through unthrottled file uploads
* Zip bomb or XML bomb exploiting decompression/parsing

**Mitigations:**
* Rate limiting and request throttling
* Input validation (size limits, complexity limits)
* Auto-scaling with circuit breakers
* CDN and DDoS mitigation services
* Timeout and resource quotas for all operations

### Elevation of Privilege — Violates Authorization

Elevation of privilege means performing actions beyond your authorized scope — a normal user gaining admin capabilities, or a container escaping to the host.

**Real-world examples:**
* IDOR (Insecure Direct Object Reference) allowing user A to access user B's data by changing an ID
* Container escape to host through kernel vulnerability
* SQL injection granting access to admin-only stored procedures
* Path traversal allowing read access to `/etc/shadow`

**Mitigations:**
* Principle of least privilege everywhere (IAM, file permissions, network)
* Input validation and parameterized queries
* Sandboxing and isolation (containers, VMs, seccomp profiles)
* Regular privilege audits and access reviews
* Defense in depth — assume any single layer can be bypassed

### STRIDE Summary

| Threat                   | Definition                          | Property        | Key Question to Ask                                                      |
| -------------------------| ----------------------------------- | --------------- | ------------------------------------------------------------------------ |
| Spoofing                 | Pretend to be someone/something else| Authentication  | Can an attacker impersonate a user, service, or system?                  |
| Tampering                | Modify data or code without authorization | Integrity | Can data be changed in transit, at rest, or during processing?           |
| Repudiation              | Deny performing an action           | Non-repudiation | Can a user deny an action and we have no proof?                          |
| Information Disclosure   | Expose data to unauthorized parties | Confidentiality | What sensitive data could leak and through which channels?                |
| Denial of Service        | Exhaust resources, deny availability| Availability    | What can an attacker flood, starve, or crash?                            |
| Elevation of Privilege   | Gain unauthorized capabilities      | Authorization   | Can a user perform actions beyond their intended role?                   |

## Apply STRIDE to Data Flow Elements

To combine STRIDE with the four base elements of a Data Flow, we get a practical guideline for which threats apply to which element. Not every threat is relevant to every element — this matrix helps focus analysis:

| Threat Model Element | Example | S | T | R | I | D | E |
| -------------------- | ------- | - | - | - | - | - | - |
| External Entity      | Browser, third-party API |✅ |  | ✅|✅ |✅|  |
| Process              | Web Server, Lambda | ✅ | ✅ | ✅| ✅ | ✅ | ✅|
| Data Store           | SQL Database, S3 Bucket| | ✅ | ✅ | ✅| ✅| |
| Data Flow            | HTTPS request, message queue| | ✅ | | ✅| ✅| |

> Note: Processes are susceptible to ALL STRIDE categories — focus your deepest analysis there.

If you want to go beyond that - try this List based on interactions:

<p align="center">
<img width="600" src="/images/stride-per-interaction.png">
</p>

Source: [Shostack - Threat modeling: designing for security](https://www.amazon.de/-/en/Adam-Shostack/dp/1118809998)

### Tools

##### Workshops and Hands-On Resources

* [BATMAN Threat Modeling Workshop](https://benjitrapp.github.io/batman-tm/) — Interactive workshop for learning threat modeling by doing

##### Cloud Templates for Microsoft Threat Modeling Tool

* [TMT Cloud AWS Templates](https://benjitrapp.github.io/TMT-Cloud-Aws-Templates/) — Pre-built threat model templates for AWS architectures
* [TMT Cloud Docker Templates](https://benjitrapp.github.io/TMT-Cloud-Docker-Templates/) — Pre-built threat model templates for Docker/container architectures

##### UI / Diagramming

* [Draw.io Custom Templates](https://github.com/michenriksen/drawio-threatmodeling) — Threat modeling stencils for Draw.io
* [MSTMT App](https://github.com/BenjiTrapp/tmt-cloud-templates/wiki/Practical-Threat-Modeling) — Microsoft Threat Modeling Tool with cloud templates
* [Threat Modeling Worksheet](https://saweis.net/threatworksheet/) — Printable worksheet for facilitated sessions
* [OWASP Threat Dragon](https://owasp.org/www-project-threat-dragon/) — Open-source threat modeling web application

##### Threat Modeling as Code

* [pyTM](https://github.com/izar/pytm) — Pythonic framework for threat modeling as code
* [Threagile.io](https://threagile.io/) — Agile threat modeling as YAML, with automated risk analysis

##### Complementary Techniques

* **[Attack Trees](https://benjitrapp.github.io/cultures/2026-06-20-attack-trees/)** — Bottom-up decomposition of attacker goals into concrete steps. Complements the top-down breadth of STRIDE with depth on specific scenarios. Use [attacktree.online](https://attacktree.online) for modeling.
* **Elevation of Privilege Card Game** — Gamified threat identification using a card game (great for team sessions)
* **LINDDUN** — Privacy-focused threat modeling framework (complements STRIDE for GDPR/privacy concerns)
* **PASTA** — Process for Attack Simulation and Threat Analysis (risk-centric, 7-stage methodology)

## Additional Sources and References

* [Shostack - Threat Modeling: Designing for Security](https://www.amazon.de/-/en/Adam-Shostack/dp/1118809998) — The definitive book on threat modeling
* [Threat Modeling Manifesto](https://www.threatmodelingmanifesto.org/) — Community-driven values and principles
* [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)
* [SAFECode - Tactical Threat Modeling](https://safecode.org/resource-secure-development-practices/tactical-threat-modeling/)
* [Microsoft SDL Threat Modeling](https://www.microsoft.com/en-us/securityengineering/sdl/threatmodeling)
* [How to approach threat modeling (Martijn Dirkse, 2020)](https://martinfowler.com/articles/agile-threat-modelling.html)
