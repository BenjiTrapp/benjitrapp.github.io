---
layout: post
title: MostShittyAV - Building an Antivirus to learn bypassing
---

<img height="150" align="left" src="/images/mostshittyav.png"> In the world of cybersecurity, understanding how antivirus software works is crucial for both defenders and red teamers. MostShittyAV is an educational antivirus engine built from scratch in Nim to demonstrate the fundamental concepts of malware detection, signature-based scanning, and heuristic analysis. While the name suggests it's "shitty," the project provides valuable insights into AV internals and serves as an excellent learning platform.

The project has evolved into the **AMSI Raccoon Lab** - a full-featured challenge platform with 43 challenges across 6 categories, complete with solutions and an interactive web interface.

- [What is MostShittyAV?](#what-is-mostshittyav)
- [🛠️ Technical Features](#️-technical-features)
- [🎪 The Challenge Lab](#-the-challenge-lab)
- [How the Scanner Works](#how-the-scanner-works)
- [Challenge Categories](#challenge-categories)
- [Known Vulnerabilities](#known-vulnerabilities)
- [Quick Start](#quick-start)


## What is MostShittyAV?

MostShittyAV is a lightweight, educational antivirus engine designed to demonstrate the fundamental principles behind malware detection systems. Unlike commercial AV solutions, this project prioritizes transparency and learning over production-ready security. It's perfect for:

- **Security researchers** understanding AV internals
- **Red teamers** learning AV evasion techniques  
- **Students** studying malware analysis and detection
- **Developers** interested in building security tools

## 🛠️ Technical Features

- **AMSI Provider Interface**
  - Compatible with Windows AMSI
  - Provider architecture pattern
  - Extensible scanning engine

- **Detection Engines**
  - Signature scanning (ASCII pattern matching, case-insensitive)
  - Heuristic analysis (extensions, non-printable byte ratio, entropy, tiny executables)

- **Detailed Logging**
  - Timestamped output
  - Color-coded results
  - Step-by-step analysis

## 🎪 The Challenge Lab

> **Can you bypass the engine?**  
> This scanner uses common detection heuristics found in real AV products.  
> Your mission: Evade detection while executing your "payloads"!

The AMSI Raccoon Lab now features **43 challenges** across **6 categories** with full solutions available. Access the interactive challenge platform here:

**[Launch the AMSI Raccoon Lab](https://benjitrapp.github.io/MostShittyAV)**

From the lab you can browse [Challenges](https://benjitrapp.github.io/MostShittyAV/challenges/), view [Solutions](https://benjitrapp.github.io/MostShittyAV/solutions/), read the [Architecture](https://benjitrapp.github.io/MostShittyAV/architecture) docs, or get a deep dive into [AMSI Explained](https://benjitrapp.github.io/MostShittyAV/amsi-explained).

## How the Scanner Works

The scanner implements **6 detection checks** with intentional weaknesses:

| Check | Method | Action | Exploitable? |
|-------|--------|--------|:------------:|
| 1 | Signature Scan (7 known strings) | **BLOCKS** | Yes |
| 2 | Extension Heuristic (11 extensions) | Warning only | Yes |
| 3 | Non-Printable Ratio (>40%, files >= 64B) | **BLOCKS** | Yes |
| 4 | Small Executable (<32B + suspicious ext) | **BLOCKS** | Yes |
| 5 | Suspicious Pattern (IEX, WebClient...) | Warning only | Yes |
| 6 | Entropy Check (>7.2 bits/byte, >= 128B) | Warning only | Yes |

## Challenge Categories

| Category | Challenges | Difficulty | Description |
|----------|:----------:|:----------:|-------------|
| Signature Detection Bypass | 14 | Easy - Hard | Evade static string matching by transforming, encoding, or fragmenting known malware signatures |
| Non-Printable Ratio Bypass | 5 | Easy - Medium | Defeat the scanner's non-printable byte analysis through encoding, padding, and size manipulation |
| Small Executable Bypass | 2 | Easy | Circumvent the small executable heuristic that flags tiny files with suspicious extensions |
| Extension Heuristic Bypass | 9 | Easy - Hard | Exploit weaknesses in extension-based file type detection using Unicode tricks, ADS, and polyglots |
| AMSI Bypass | 13 | Medium - Hard | Disable or circumvent the Windows Antimalware Scan Interface through memory patching, hijacking, and more |

## Known Vulnerabilities

- 🔓 Extension checking doesn't enforce blocking
- 🔓 Limited signature database
- 🔓 Uncommon extensions not flagged (`.hta`, `.com`, `.wsf`, `.pif`)
- 🔓 No deep content inspection
- 🔓 Case sensitivity issues
- 🔓 No archive/container scanning

## Quick Start

```bash
# Clone the repository
git clone https://github.com/BenjiTrapp/MostShittyAV.git

# Build the scanner
nimble build

# Scan a file
.\nim_antimalware_sim.exe scan <file>

# Try your first challenge!
```

---

**Explore the code, contribute, and learn:** [MostShittyAV on GitHub](https://github.com/BenjiTrapp/MostShittyAV)

**Try the challenges:** [AMSI Raccoon Lab](https://benjitrapp.github.io/MostShittyAV)