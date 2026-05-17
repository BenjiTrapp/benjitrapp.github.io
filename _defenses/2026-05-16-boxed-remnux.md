---
layout: defense
title: Boxed REMnux 
---

<img height="200" align="left" src="https://github.com/BenjiTrapp/boxed-remnux/raw/main/static/logo.png" > Boxed REMnux brings the full [REMnux](https://remnux.org/) malware analysis toolkit into a Docker container that you can access directly from your browser via NoVNC. Built on the official `remnux/remnux-distro:noble` image with XFCE4, TigerVNC, and noVNC layered on top, it provides a complete graphical desktop environment — no local installation or VM setup required.

<br clear="left"/>

## Why Boxed REMnux?

Analyzing suspicious files on your host machine is risky. Boxed REMnux gives you a disposable, isolated environment that you can spin up in seconds and tear down when you're done. The containerization approach ensures that any malware you examine stays sandboxed, while the browser-based access makes it easy to run on headless servers, cloud instances, or any machine with Docker installed.

## What's Inside?

The image ships with the entire REMnux tool suite plus a curated set of additions:

- **Reverse Engineering** — Ghidra, radare2, Rizin, Cutter, Capstone, Unicorn, Keystone, and angr for static and dynamic binary analysis
- **Malware Analysis** — YARA, PEframe, olevba/oledump, pefile, dnfile, binwalk, and foremost for triaging samples across PE, ELF, Office, PDF, and firmware formats
- **Dynamic Analysis & Debugging** — GDB, strace, ltrace, Frida, Speakeasy (Windows kernel/user-mode emulation), and Malduck for runtime inspection and config extraction
- **Network Forensics** — Wireshark, mitmproxy, ngrep, tcpflow, Sniffnet, and Snitch for capturing, intercepting, and dissecting network traffic
- **Memory Forensics** — Volatility for deep-dive memory analysis during incident response
- **OSINT & Threat Intel** — ioc-finder, vt-py, STIX2, TAXII2 client, and whois for enriching indicators and consuming threat feeds
- **Productivity** — tmux, vim, jq, CyberChef CLI, SQLite3, p7zip, curl/wget, and git to keep your workflow smooth

## Getting Started

```bash
git clone https://github.com/BenjiTrapp/boxed-remnux.git
cd boxed-remnux
make build   # Build the Docker image (~15 GB)
make start   # Start the container
make browser # Open noVNC in your default browser
```

Then connect at `http://localhost:9020/vnc.html` with the default password `remnux`. Mount a local directory with `-v /path/to/samples:/home/remnux/files` to share files with the container.

Check out the repo [here](https://github.com/BenjiTrapp/boxed-remnux)
