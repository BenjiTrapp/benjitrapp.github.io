---
layout: defense
title: "BOSS of the SOC - Dockerized Blue Team CTF Training"
---

<img height="150" align="left" src="/images/bots-logo.png"> 
BOSS of the SOC (BOTS) is Splunk's blue-team CTF series that drops you into realistic security investigations. With the [splunk-bots-docker](https://github.com/BenjiTrapp/splunk-bots-docker) project, you can spin up all three BOTSv1–v3 datasets locally in Docker containers with a single command — no cloud dependency, no manual app installs, just instant threat hunting practice.

> "The best way to get better at detection engineering is to practice on real attack data — repeatedly, locally, on your own schedule."

## What is BOSS of the SOC?

BOSS of the SOC (BOTS) are blue-team Capture the Flag exercises created by Splunk. Each version presents a different security scenario with pre-loaded datasets containing real attack traces:

| Version | Year | Scenario | Focus Area |
|---------|------|----------|------------|
| **BOTSv1** | 2016 | APT infiltration + Ransomware outbreak | Endpoint forensics, web attacks, malware |
| **BOTSv2** | 2017 | Nation-state APT hunting | Advanced persistent threats, lateral movement |
| **BOTSv3** | 2018 | Multi-vector threat detection | Cloud (AWS/Azure), O365, multi-source correlation |

Each dataset contains multiple sourcetypes from diverse security tools — firewalls, EDR, Sysmon, IDS/IPS, web proxies, authentication logs, and more. This makes them perfect training grounds for building SPL skills and developing detection logic.

## Why Docker?

Running BOTS locally in Docker solves several pain points:

1. **No expiring cloud labs** — Practice whenever you want, no time pressure
2. **Reproducible environment** — `docker compose up` gives you a clean slate every time
3. **Offline capable** — After initial dataset download, everything runs locally
4. **Cross-platform** — Works on macOS, Linux, and Windows
5. **License renewal** — Simply `docker compose down && docker compose up -d` resets the 30-day trial

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/engine/install/) with Docker Compose
- ~15 GB disk space (datasets are 3–5 GB each)
- 8 GB+ RAM recommended

### Installation

```bash
# macOS / Linux
git clone https://github.com/BenjiTrapp/splunk-bots-docker.git
cd splunk-bots-docker
./install.sh

# Windows (PowerShell 7+)
git clone https://github.com/BenjiTrapp/splunk-bots-docker.git
cd splunk-bots-docker
.\install.ps1
```

The installer handles everything automatically:
1. Checks for Docker
2. Verifies all 50+ Splunk apps & add-ons are present
3. Prompts for an admin password
4. Spins up the containers
5. Prints your access URLs

You can also start a specific version only:

```bash
./install.sh bots2
```

### Access URLs

| Version | URL | Login |
|---------|-----|-------|
| BOTSv1 | `http://localhost:8000` | admin / your-password |
| BOTSv2 | `http://localhost:8020` | admin / your-password |
| BOTSv3 | `http://localhost:8030` | admin / your-password |

> Datasets (~3–5 GB each) download from AWS S3 on first boot. Initial startup takes 5–15 minutes.

## Architecture

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   bots1      │  │   bots2      │  │   bots3      │
│  :8000       │  │  :8020       │  │  :8030       │
│              │  │              │  │              │
│ Splunk 9.0.4 │  │ Splunk 9.0.4 │  │ Splunk 9.0.4 │
│ BOTSv1 data  │  │ BOTSv2 data  │  │ BOTSv3 data  │
│  8 apps      │  │  20 apps     │  │  25 apps     │
└──────────────┘  └──────────────┘  └──────────────┘
```

Each container is self-contained with the relevant Splunk apps, technology add-ons, and investigation data:

- **BOTSv1** — Fortinet, Sysmon, Windows, Stream, Suricata, Tenable, URL Toolbox
- **BOTSv2** — Palo Alto, Apache, IIS, Sysmon, Windows, Symantec, Unix, CIM, Security Essentials
- **BOTSv3** — AWS, Azure, Cisco ASA, GuardDuty, Office 365, Code42, osquery, CIM, VirusTotal

## SPL Searchhead Cheatsheet

To help navigate the BOTS datasets effectively, there is a dedicated [SPL Searchhead Cheatsheet](https://benjitrapp.github.io/splunk-bots-docker/splunk-searchhead-cheatsheet.html) that covers the essential SPL concepts step by step:

- **Basis-Suche & Pipe-Operator** — How to structure queries from left to right
- **Index & Sourcetype** — Narrowing down data sources efficiently
- **Metadata discovery** — Finding available indexes, sourcetypes, and hosts in an unknown environment
- **Time handling** — Relative/absolute time ranges and conversions
- **Core SPL commands** — `stats`, `eval`, `rex`, `where`, `table`, `transaction`, and more
- **CSIRT-specific queries** — Brute-force detection, PowerShell hunting, lateral movement, IOC lookups
- **Performance tips** — Filter early, avoid leading wildcards, use `tstats`

## Getting Started with BOTSv1

Once your container is running, here are some initial exploration queries to orient yourself:

### Discover available data

```
| metadata type=sourcetypes index=botsv1
| table sourcetype, totalCount, recentTime
| sort -totalCount
```

### Find all hosts reporting in

```
| metadata type=hosts index=botsv1
| table host, totalCount, recentTime
```

### Hunt for web attacks

```
index=botsv1 sourcetype=stream:http
| stats count by http_method, status, site
| sort -count
```

### Detect brute-force attempts

```
index=botsv1 sourcetype=WinEventLog:Security EventCode=4625
| stats count by src_ip, Account_Name
| where count > 10
| sort -count
```

### Look for suspicious PowerShell execution

```
index=botsv1 sourcetype=XmlWinEventLog:Microsoft-Windows-Sysmon/Operational
  EventCode=1 Image="*powershell*"
| table _time, Computer, User, CommandLine
| sort -_time
```

## Manual Docker Control

```bash
# Start all three versions
docker compose up -d

# Start a specific version
docker compose up -d bots1

# Follow logs
docker compose logs -f bots3

# Stop everything
docker compose down

# Full reset (renews 30-day license)
docker compose down && docker compose up -d
```

## Customization

Override any setting via environment variables:

```bash
export SPLUNK_PASSWORD="MySecur3P@ss"
export BOTS1_PORT=8080
export BOTS2_PORT=8081
export BOTS3_PORT=8082
./install.sh
```

| Variable | Default | Description |
|----------|---------|-------------|
| `SPLUNK_PASSWORD` | `changeme` | Admin password (min 8 chars) |
| `BOTS1_PORT` | `8000` | Host port for BOTSv1 |
| `BOTS2_PORT` | `8020` | Host port for BOTSv2 |
| `BOTS3_PORT` | `8030` | Host port for BOTSv3 |

## Training Approach

A recommended approach for working through the BOTS datasets:

1. **Start with BOTSv1** — It has the most community walkthroughs and documentation available
2. **Use the cheatsheet** — Keep the [SPL Searchhead Cheatsheet](https://benjitrapp.github.io/splunk-bots-docker/splunk-searchhead-cheatsheet.html) open as a reference
3. **Explore with metadata** — Before diving into queries, understand what data sources are available
4. **Build detection logic** — Try to create SPL queries that would work as alerts in production
5. **Progress to BOTSv2/v3** — Each version increases in complexity and requires more advanced correlation

## Sources and useful links

- [splunk-bots-docker on GitHub](https://github.com/BenjiTrapp/splunk-bots-docker)
- [SPL Searchhead Cheatsheet](https://benjitrapp.github.io/splunk-bots-docker/splunk-searchhead-cheatsheet.html)
- [BOTS Original CTF Platform](https://bots.splunk.com/login?redirect=/)
- [Splunk BOTS Official Page](https://www.splunk.com/en_us/blog/security/boss-of-the-soc-scoring-server.html)
- [BOTSv1 Dataset on GitHub](https://github.com/splunk/botsv1)
- [BOTSv2 Dataset on GitHub](https://github.com/splunk/botsv2)
- [BOTSv3 Dataset on GitHub](https://github.com/splunk/botsv3)
- [Splunk Attack Range Lab](/defenses/2022-10-09-splunk-attack-range/)
- [Splunk SPL Cheatsheet](/defenses/2022-08-25-Splunk-Cheatsheet/)
