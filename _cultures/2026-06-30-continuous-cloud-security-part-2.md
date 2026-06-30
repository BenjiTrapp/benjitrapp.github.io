---
layout: culture
title: "Continuous Cloud Security, Part 2: From Mindset to Pipeline"
---
<img height="200" align="left" src="/images/devsecops-controls.jpg">
Part 1 ended on a cliffhanger and an honest "still Work in Progress". We had the mindset (security is just a natural part of DevOps), the metaphor (mix the blueberries into the dough), and the uncomfortable truth that in the cloud the responsibility is not shared, it is **split**. That is the philosophy. This follow up is about the machine: how to turn "Continuous Cloud Security" from a nice poster on the wall into something that actually runs on every commit and every account, every day.

**Related:** [Continuous Cloud Security (Part 1)](https://benjitrapp.github.io/cultures/2022-03-29-continuous-cloud-security/) | [CALMS](https://benjitrapp.github.io/cultures/2022-03-30-CALMS-devops/) | [The Three Ways of DevOps](https://benjitrapp.github.io/cultures/2022-04-09-three-ways-of-devops/) | [Secure SDLC](https://benjitrapp.github.io/cultures/2022-06-10-ssdlc/)

- [Where We Left Off](#where-we-left-off)
- [The Continuous Cloud Security Loop](#the-continuous-cloud-security-loop)
- [Guardrails over Gates](#guardrails-over-gates)
- [Security Activities per Phase](#security-activities-per-phase)
- [Policy as Code: the Engine Room](#policy-as-code-the-engine-room)
- [Three Layers of Cloud Guardrails](#three-layers-of-cloud-guardrails)
- [Shift Left on Infrastructure as Code](#shift-left-on-infrastructure-as-code)
- [Continuous Detection and Auto Remediation](#continuous-detection-and-auto-remediation)
- [Measuring Progress](#measuring-progress)
- [A Reference Toolchain](#a-reference-toolchain)
- [Where This Goes Next](#where-this-goes-next)

---

## Where We Left Off

The Data Plane was our homework. We agreed on four high level targets: keep things off the public internet, disallow public access by default, secure authentication, and encrypt in transit and at rest. We also name dropped a "Cloud Security DevOps Framework" and a Policy as Code tool called Cloud Custodian, then ran out of road.

So let us pick exactly that thread back up. The frameworks (Well Architected, the Treacherous 12, the MITRE Cloud Matrix) tell you **what** good looks like. They do not tell you how to keep it good while a hundred engineers ship changes every day. That gap is what continuous security fills, and it fills it the same way DevOps filled the gap between Dev and Ops: by automating and standardizing whatever can be automated and standardized.

## The Continuous Cloud Security Loop

Part 1 drew the DevSecOps cycle as a picture. Here it is again, but reframed around the cloud control surfaces we actually touch. The point of the loop is that it never stops: the output of monitoring feeds straight back into planning.

<pre class="mermaid">
flowchart LR
    P[Plan: threat model the workload] --> C[Code: secure IaC and app code]
    C --> B[Build: scan images and dependencies]
    B --> T[Test: policy as code gates]
    T --> D[Deploy: signed artifacts and account guardrails]
    D --> O[Operate: posture management and runtime detection]
    O --> M[Monitor: findings, drift and alerts]
    M --> P
</pre>

Every arrow is an opportunity to catch a problem one step earlier than you did last time. The earlier in the loop you catch it, the cheaper it is to fix, which is the whole blueberry muffin argument expressed as a pipeline.

## Guardrails over Gates

The classic security review is a **gate**: work stops, a human inspects, and the human says yes or no. Gates do not scale to cloud speed. They become the new "test phase at the end" that gets cut when the budget runs out.

A **guardrail** is different. It is an automated, always on rule that lets engineers move fast inside a safe boundary. You do not ask permission to deploy; you simply cannot deploy something that violates the policy, and you find out in seconds, in your own pipeline, not in a meeting three weeks later. The shift from gates to guardrails is the single most important mental move in continuous cloud security.

## Security Activities per Phase

Each phase of the loop has a concrete cloud security job. This is the practical version of the "tiny bit of security in every step" idea.

| Phase | Cloud security activity | Example tooling |
|---|---|---|
| Plan | Threat model the workload, classify data, define the guardrails | Threat Dragon, MITRE Cloud Matrix |
| Code | Secure the Infrastructure as Code and the application code | tfsec, Checkov, Semgrep |
| Build | Scan container images and dependencies, generate an SBOM | Trivy, Grype, Syft |
| Test | Enforce policy as code as a pipeline check | OPA, Conftest, Cloud Custodian |
| Release | Sign artifacts and verify their provenance | cosign, SLSA |
| Deploy | Apply preventive guardrails at the account boundary | AWS SCPs, Azure Policy |
| Operate | Continuously assess posture and detect drift | Prowler, AWS Config, Cloud Custodian |
| Monitor | Centralize findings and trigger a response | Security Hub, GuardDuty, SIEM |

## Policy as Code: the Engine Room

Policy as Code is what makes a guardrail real. Instead of a wiki page that says "S3 buckets must not be public", you write a rule that a machine evaluates and enforces. The same rule can run in three places: in the pull request, in the deploy pipeline, and against live accounts.

A Cloud Custodian policy that flags public S3 buckets reads almost like the sentence on that wiki page:

```yaml
policies:
  - name: s3-no-public-access
    resource: aws.s3
    filters:
      - type: global-grants
    actions:
      - type: set-bucket-encryption
      - type: remove-statements
        statement_ids: matched
```

The value is not any single rule. It is that the rule lives in version control, is reviewed like code, runs automatically, and produces the same verdict for everyone. Security stops being an opinion and becomes a test that either passes or fails.

## Three Layers of Cloud Guardrails

Not every control can be preventive, and that is fine. A healthy programme stacks three layers so that what one misses the next one catches.

| Layer | Question it answers | Cloud examples |
|---|---|---|
| Preventive | Can this bad thing even happen? | SCPs, Azure Policy deny, IAM permission boundaries, block public access |
| Detective | Did this bad thing happen anyway? | AWS Config rules, CSPM, GuardDuty, Cloud Custodian filters |
| Responsive | What do we do now that it did? | Auto remediation functions, Custodian actions, automatic ticket creation |

Aim to push controls leftward over time. Every detective finding that keeps recurring is a candidate to be promoted into a preventive guardrail so it can never happen again.

## Shift Left on Infrastructure as Code

In the cloud your infrastructure is code, which means your misconfigurations are also code, which is wonderful news: you can scan them before they ever exist as a running resource. A scanner like Checkov or tfsec reads your Terraform plan and fails the build when it sees an unencrypted volume or a wide open security group.

```bash
checkov -d . --quiet --compact
trivy config ./terraform
```

Catching a public database in a pull request costs a code review comment. Catching the same public database in production costs an incident bridge. Same finding, wildly different price, decided only by where in the loop you looked.

## Continuous Detection and Auto Remediation

Shift left is necessary but not sufficient. Accounts drift: someone clicks in the console, a third party tool changes a setting, an old resource predates your policy. Continuous detection closes that gap by scanning live accounts on a schedule and comparing reality against your guardrails.

The grown up version does not just alert. It remediates. A detective rule finds the public bucket, and a responsive action makes it private again within minutes, then files a ticket so a human can ask why it happened. This is the same loop as before, just running in production rather than in CI, and it is where tools like Cloud Custodian, AWS Config remediation and the various CSPM platforms earn their keep.

## Measuring Progress

You cannot improve what you do not measure, so the loop needs a scoreboard. Useful signals, in rough order of maturity:

- **Coverage** — what share of accounts and pipelines actually run the guardrails
- **Mean time to remediate** — how long a finding survives before it is fixed
- **Preventive ratio** — how many controls block versus merely report
- **Drift rate** — how often live resources diverge from policy

Track these over time and the maturity story tells itself. The goal is not a perfect score on day one; it is a curve that bends in the right direction while engineers keep shipping.

## A Reference Toolchain

You do not need all of these, and you should not adopt them all at once. Pick one per row and grow from there.

| Need | Open source | Cloud native |
|---|---|---|
| IaC scanning | Checkov, tfsec, Trivy | built into the CI of choice |
| Policy as code | OPA, Conftest, Cloud Custodian | AWS SCP, Azure Policy, GCP Org Policy |
| Posture management | Prowler, ScoutSuite | Security Hub, Defender for Cloud |
| Runtime threat detection | Falco | GuardDuty, Defender, Security Command Center |
| Secrets scanning | gitleaks, trufflehog | provider secret scanners |

## Where This Goes Next

The mindset from Part 1 plus the loop from Part 2 give you continuous cloud security as a practice rather than a project. Start small: one guardrail, codified, running in one pipeline against one account. Then widen the coverage, push controls leftward, and let the monitoring feed the planning.

The frameworks will still tell you what good looks like. This loop is how you stay there while moving at cloud speed, one blueberry at a time.
