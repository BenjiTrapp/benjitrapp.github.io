---
layout: post
title: RaccoonIR - Purple Team Incident Response Playbook Planner
---

<img height="200" align="left" src="https://github.com/BenjiTrapp/incident-response-playbooks/blob/main/raccoon-ir-logo.png?raw=true"> RaccoonIR is a zero-dependency, browser-based modelling tool for designing, analysing, and executing operations-informed incident response playbooks with full MITRE ATT&CK and D3FEND mapping. Built for purple teams who think like raccoons: resourceful, persistent, and always digging deeper. No server, no build step, no npm — just open index.html and start planning your response.

## Why RaccoonIR?

Incident response playbooks often live in static wikis or PDF documents that quickly become outdated and disconnected from the threat landscape. RaccoonIR bridges the gap between threat intelligence and operational response by letting you:

- Map playbook activities directly to MITRE ATT&CK techniques and D3FEND countermeasures
- Model operational dependencies to understand cascading impacts during incidents
- Quantify response effectiveness with CiO (Change-in-Operability) metrics
- Simulate step-by-step execution and observe real-time impact on mission capability

## Key Features

- **MITRE ATT&CK + D3FEND Integration** — Tag every response step with techniques and countermeasures. Dedicated MITRE View groups all mappings by tactic with clickable links.
- **ATT&CK Navigator Export** — Generate Navigator v4.5 layer JSON to visualize playbook threat coverage.
- **Dependency Models** — Hierarchical operational dependency trees with probability propagation, critical thresholds, and stakeholder notifications.
- **Impact Simulation & Step Mode** — Walk through playbooks step-by-step, observing cumulative impacts on operational paragons in real-time.
- **Snapshot & Compare** — Capture simulation states as baselines and measure improvement or degradation.
- **CiO Metrics** — Quantify the operational impact of incident response activities.
- **Zero Dependencies** — Single HTML file, works offline, deploys to GitHub Pages instantly.

## Included Playbooks

Ships with 8 ready-to-use playbooks covering common incident types:

| Playbook | ATT&CK | D3FEND |
|----------|--------|--------|
| Phishing Attack Response | T1566, T1204, T1078 | Email Removal, Homoglyph Detection |
| Ransomware Incident Response | T1486, T1490, T1021 | Network Isolation, Backup Analysis |
| Password Spraying Attack | T1110.003, T1078, T1087 | Account Locking, MFA |
| Process Injection Response | T1055, T1059, T1003 | Memory Analysis, Process Spawn Analysis |
| Drive-by Compromise | T1189, T1203, T1071 | Web Filtering, Browser Isolation |
| Supply Chain Compromise | T1195, T1059, T1105 | Software Verification, Hash Validation |
| Insider Threat Response | T1078, T1074, T1530 | User Behavior Analysis, Access Modeling |
| Data Exfiltration Response | T1041, T1560, T1048 | Network Traffic Analysis, DLP |

## The Metamodel

RaccoonIR is based on the FRIPP metamodel (Shaked et al. 2023), combining PROVE artifact-centric process modelling, hierarchical dependency models with probability propagation, and CiO scoring for quantifying response effectiveness. The tool enforces strict metamodel conformance while keeping the UX approachable for IR practitioners.


## [Try It Here](https://benjitrapp.github.io/incident-response-playbooks/)
