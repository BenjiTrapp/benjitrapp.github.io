---
layout: post
title: MostShittyAV - Building an Antivirus to learn bypassing
---

<img height="150" align="left" src="/images/mostshittyav.png"> In the world of cybersecurity, understanding how antivirus software works is crucial for both defenders and red teamers. MostShittyAV is an educational antivirus engine built from scratch in Nim to demonstrate the fundamental concepts of malware detection, signature-based scanning, and heuristic analysis. While the name suggests it's "shitty," the project provides valuable insights into AV internals and serves as an excellent learning platform.

- [What is MostShittyAV?](#what-is-mostshittyav)
- [🛠️ Technical Features](#️-technical-features)
- [🎪 The Challenge](#-the-challenge)
- [Known Vulnerabilities](#known-vulnerabilities)


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

- **Detailed Logging**
  - Timestamped output
  - Color-coded results
  - Step-by-step analysis

## 🎪 The Challenge

> **Can you bypass the engine?**  
> This scanner uses common detection heuristics found in real AV products.  
> Your mission: Evade detection while executing your "payloads"!

## Known Vulnerabilities

- 🔓 Extension checking doesn't enforce blocking
- 🔓 Limited signature database
- 🔓 Uncommon extensions not flagged (`.hta`, `.com`, `.wsf`, `.pif`)
- 🔓 No deep content inspection
- 🔓 Case sensitivity issues
- 🔓 No archive/container scanning




---

**Explore the code, contribute, and learn:** [MostShittyAV on GitHub](https://github.com/BenjiTrapp/MostShittyAV)