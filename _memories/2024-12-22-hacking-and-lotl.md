---
layout: memory
title: Hacking and Living off the Land Links
---

<img height="200" align="left" src="/images/lotl_collection_logo.png">

<!-- cSpell:disable -->

A curated set of references that I keep coming back to. The first half collects broad hacking knowledge bases, cheat sheets and playbooks. The second half is dedicated to Living off the Land (LOTL), the practice of abusing software that is already trusted and present on a system, so that an attacker never has to drop an obvious tool.

## Summary

- [Summary](#summary)
- [Resources and Guides](#resources-and-guides)
  - [Knowledge Bases and Methodology](#knowledge-bases-and-methodology)
  - [Web and Application Security](#web-and-application-security)
  - [Cloud Security](#cloud-security)
  - [Recon and OSINT](#recon-and-osint)
  - [Defense, DFIR and Threat Hunting](#defense-dfir-and-threat-hunting)
  - [Linux and Privilege Escalation](#linux-and-privilege-escalation)
  - [Tools and Reference](#tools-and-reference)
- [Living off the Land](#living-off-the-land)
  - [The LOL Project Family](#the-lol-project-family)
  - [Windows](#windows)
  - [Unix and Linux](#unix-and-linux)
  - [macOS](#macos)
  - [Cloud and Trusted Infrastructure](#cloud-and-trusted-infrastructure)
  - [Hardware](#hardware)
  - [Files and Applications](#files-and-applications)
  - [Certificates](#certificates)
  - [Detection and False Positives](#detection-and-false-positives)
  - [Collections and Meta](#collections-and-meta)

## Resources and Guides

### Knowledge Bases and Methodology

| Resource | What it covers |
| --- | --- |
| [HackTricks](https://book.hacktricks.xyz/) | The broad reference for pentesting and exploitation, organized by service and technique |
| [Red Team Notes](https://www.ired.team/) | Hands on red team techniques with a strong focus on Active Directory |
| [Exploit Notes](https://exploit-notes.hdks.org/) | Short, searchable exploitation notes grouped by topic |
| [Pentest Book by n3t_hunt3r](https://n3t-hunt3r.gitbook.io/pentest-book) | A structured methodology that walks through a full engagement |
| [Oblivion RedOps](https://oblivions-research.gitbook.io/journal) | An offensive research journal with deep technical writeups |
| [DarthSidious](https://hunter2.gitbook.io/darthsidious) | A step by step path from zero access to full domain compromise |

### Web and Application Security

| Resource | What it covers |
| --- | --- |
| [Application Security Cheat Sheet](https://0xn3va.gitbook.io/cheat-sheets) | Practical web and API security cheat sheets |
| [AppSecExplained](https://appsecexplained.gitbook.io/appsecexplained) | Core application security concepts explained in plain language |
| [Bug Hunter Handbook](https://gowthams.gitbook.io/bughunter-handbook) | Bug bounty methodology, tips and recurring vulnerability patterns |

### Cloud Security

| Resource | What it covers |
| --- | --- |
| [Hacking The Cloud](https://hackingthe.cloud/) | Offensive techniques for AWS, Azure and GCP |
| [HackTricks Cloud](https://cloud.hacktricks.xyz/welcome/readme) | The cloud focused companion to HackTricks |
| [CloudSec.Cybr](https://cloudsec.cybr.com/) | Cloud security labs, notes and learning paths |

### Recon and OSINT

| Resource | What it covers |
| --- | --- |
| [Subdomain Enumeration Guide](https://sidxparab.gitbook.io/subdomain-enumeration-guide) | A complete workflow for discovering subdomains and attack surface |
| [OH SHINT!](https://ohshint.gitbook.io/oh-shint-its-a-blog) | A large collection of OSINT resources and methodology |

### Defense, DFIR and Threat Hunting

| Resource | What it covers |
| --- | --- |
| [Digital Forensics and Incident Response](https://www.iblue.team/) | Blue team playbooks for forensics and incident response |
| [Threat Hunter Playbook](https://threathunterplaybook.com/intro.html) | Data driven hunting analytics mapped to attacker behavior |
| [Check Point Research Evasion Techniques](https://evasions.checkpoint.com/) | A catalog of how malware detects and evades sandboxes |

### Linux and Privilege Escalation

| Resource | What it covers |
| --- | --- |
| [Linux Privilege Escalation](https://morgan-bin-bash.gitbook.io/linux-privilege-escalation) | Techniques to go from a low privileged shell to root |
| [Linux SysOps Handbook](https://abarrak.gitbook.io/linux-sysops-handbook) | A solid Linux administration reference that doubles as recon background |

### Tools and Reference

| Resource | What it covers |
| --- | --- |
| [C2 Matrix](https://howto.thec2matrix.com/) | Compare command and control frameworks side by side |
| [CyberChef](https://gchq.github.io/CyberChef/) | The swiss army knife for encoding, decoding and data transformation |
| [Nuclei Templates Directory](https://nuclei-templates.netlify.app/) | A searchable index of the public Nuclei template library |
| [offsec.tools](https://offsec.tools/) | A searchable directory of offensive security tools |
| [Ciphersuite Info](https://ciphersuite.info/) | Look up any TLS cipher suite and its security rating |
| [endoflife.date](https://endoflife.date/) | Track end of life and support windows for common products |

## Living off the Land

Living off the Land means reaching for binaries, scripts, drivers and services that a defender already trusts. Because the tooling is native, the activity blends into normal operations and is far harder to flag. The projects below map out which trusted components can be abused on each platform.

### The LOL Project Family

<pre class="mermaid">
mindmap
  root((Living off the Land))
    Windows
      LOLBAS binaries
      MalAPI Windows APIs
      WADComs Windows and AD
      HijackLibs DLL hijacking
      LOLDrivers drivers
      Bootloaders
      Persistence info
    Unix and Linux
      GTFOBins
    macOS
      LOOBins
    Cloud and trusted infra
      LOFLCAB foreign land
      LOTS trusted sites
      LOTP pipelines
    Hardware
      LOTHardware
    Files and apps
      Filesec extensions
      LOLAPPS applications
    Certificates
      LoLCerts
    Detection
      LoFP false positives
    Collections
      LOLOL
      ARTToolkit
      Unprotect
      WTFBins
</pre>

### Windows

| Resource | What it covers |
| --- | --- |
| [LOLBAS](https://lolbas-project.github.io/) | Trusted Windows binaries, scripts and libraries that attackers abuse |
| [MalAPI](https://malapi.io/) | Windows API functions mapped to the malicious techniques they enable |
| [WADComs](https://wadcoms.github.io/) | Offensive techniques and commands for Windows and Active Directory |
| [HijackLibs](https://hijacklibs.net/) | DLL hijacking opportunities found in legitimate software |
| [LOLDrivers](https://www.loldrivers.io/) | Vulnerable and malicious Windows drivers |
| [Bootloaders](https://www.bootloaders.io/) | Bootloaders that can be abused to bypass security controls |
| [Persistence-info](https://persistence-info.github.io/) | A catalog of Windows persistence techniques |

### Unix and Linux

| Resource | What it covers |
| --- | --- |
| [GTFOBins](https://gtfobins.github.io/) | Unix binaries that can break out of restricted shells and escalate privileges |

### macOS

| Resource | What it covers |
| --- | --- |
| [LOOBins](https://www.loobins.io/) | Native macOS binaries documented for offensive use |

### Cloud and Trusted Infrastructure

| Resource | What it covers |
| --- | --- |
| [LOFLCAB](https://lofl-project.github.io/) | Cmdlets and binaries for living off the foreign land |
| [LOTS](https://lots-project.com/) | Trusted sites that attackers use for download, hosting and exfiltration |
| [LOTP](https://boostsecurityio.github.io/lotp/) | Living off the pipeline, abusing CI and CD systems |
| [BYOL](https://cloud.google.com/blog/topics/threat-intelligence/bring-your-own-land-novel-red-teaming-technique/) | Bring your own land, a red teaming technique writeup from Google |

### Hardware

| Resource | What it covers |
| --- | --- |
| [LOTHardware](https://lothardware.com.tr/) | Living off the hardware, abusing firmware and physical components |

### Files and Applications

| Resource | What it covers |
| --- | --- |
| [Filesec](https://filesec.io/) | File extensions and how attackers weaponize them |
| [LOLAPPS](https://lolapps-project.github.io/) | Legitimate applications that can be abused by attackers |

### Certificates

| Resource | What it covers |
| --- | --- |
| [LoLCerts](https://github.com/WithSecureLabs/lolcerts) | A collection of leaked code signing certificates |

### Detection and False Positives

| Resource | What it covers |
| --- | --- |
| [LoFP](https://br0k3nlab.com/LoFP/) | Legitimate activity that commonly triggers false positives in detections |

### Collections and Meta

| Resource | What it covers |
| --- | --- |
| [LOLOL](https://lolol.farm/) | An index that aggregates the many living off the land projects |
| [LOLBins CTI-Driven](https://lolbins-ctidriven.vercel.app/#) | LOLBins prioritized by real threat intelligence |
| [ARTToolkit](https://arttoolkit.github.io/) | A red team toolkit collection |
| [Unprotect Project](https://unprotect.it/) | A searchable database of malware evasion techniques |
| [WTFBins](https://wtfbins.wtf/) | Benign binaries that behave suspiciously enough to fool defenders |

<!-- cSpell:enable -->
