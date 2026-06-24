---
layout: culture
title: "The Unified Ransomware Kill Chain"
---
<img height="200" align="left" src="/images/unified-ransomware-kill-chain.png">
Ransomware is no longer a smash-and-grab operation. Modern ransomware groups operate as full businesses — with HR, affiliate programmes, SLAs, and PR teams. Understanding their **kill chain** is the prerequisite for stopping them at any stage. This article maps the unified end-to-end ransomware attack lifecycle, ties each phase to MITRE ATT&CK tactics, and connects them to the MITRE impact categories defenders must use when writing incident impact statements.

**Related:** [Threat Modeling](https://benjitrapp.github.io/cultures/2022-06-11-threat-modeling/) | [Attack Trees](https://benjitrapp.github.io/cultures/2026-06-20-attack-trees/) | [Security Maturity Models](https://benjitrapp.github.io/cultures/2022-03-27-security-maturity-models/)

- [Why a "Unified" Kill Chain?](#why-a-unified-kill-chain)
- [Kill Chain at a Glance](#kill-chain-at-a-glance)
- [The Eight Phases](#the-eight-phases)
  - [Phase 1 — Initial Access](#phase-1--initial-access)
  - [Phase 2 — Execution](#phase-2--execution)
  - [Phase 3 — Persistence & Privilege Escalation](#phase-3--persistence--privilege-escalation)
  - [Phase 4 — Defense Evasion](#phase-4--defense-evasion)
  - [Phase 5 — Credential Access & Discovery](#phase-5--credential-access--discovery)
  - [Phase 6 — Lateral Movement](#phase-6--lateral-movement)
  - [Phase 7 — Exfiltration (Double Extortion)](#phase-7--exfiltration-double-extortion)
  - [Phase 8 — Impact](#phase-8--impact)
- [MITRE Attack Effect Categories](#mitre-attack-effect-categories)
- [Writing Impact Statements](#writing-impact-statements)
- [Detection Signals per Phase](#detection-signals-per-phase)
- [Defense-in-Depth Mapping](#defense-in-depth-mapping)
- [IR Recovery Considerations](#ir-recovery-considerations)

---

## Why a "Unified" Kill Chain?

Lockheed Martin's original Cyber Kill Chain was designed for nation-state intrusions. MITRE ATT&CK extended it into a detailed tactics-and-techniques matrix. Neither was purpose-built for ransomware — which adds phases the original model never anticipated: **pre-encryption data staging**, **backup destruction**, and **negotiation leverage**.

The Unified Ransomware Kill Chain stitches these together:

| Source model | Contribution |
|---|---|
| Lockheed Kill Chain | Linear phase structure: recon → weaponize → deliver → exploit → install → C2 → act |
| MITRE ATT&CK | Granular techniques and sub-techniques mapped to each phase |
| Ransomware-specific research | Double/triple extortion, backup destruction, affiliate TTPs |
| Blue Team Handbook (MITRE) | Impact categorization framework for incident response statements |

The result is a model defenders can use both **offensively** (to simulate attacks in purple-team exercises) and **defensively** (to map controls, generate detection rules, and write accurate impact statements for leadership).

---

## Kill Chain at a Glance

<div class="ghidra-mock">
  <div class="gm-bar">
    <div class="gm-dots"><span class="gm-dot"></span><span class="gm-dot"></span><span class="gm-dot"></span></div>
    Unified Ransomware Kill Chain — Overview
  </div>
  <div style="padding:18px 20px 22px; font-family:'Consolas','Monaco','Courier New',monospace; font-size:12px;">

    <!-- ═══ PHASE ARROW RIBBON ═══ -->
    <div style="display:flex; overflow-x:auto; padding-bottom:2px;">

      <div style="position:relative; z-index:1; flex:1; min-width:78px; background:#1d4ed8; clip-path:polygon(0 0,calc(100% - 12px) 0,100% 50%,calc(100% - 12px) 100%,0 100%); padding:8px 20px 8px 8px; color:#fff; text-align:center; user-select:none;">
        <div style="font-size:19px; font-weight:700; opacity:0.3; line-height:1;">1</div>
        <div style="font-size:9px; font-weight:700; line-height:1.35;">Initial<br>Access</div>
      </div>

      <div style="position:relative; z-index:2; flex:1; min-width:78px; background:#4c1d95; clip-path:polygon(12px 0,calc(100% - 12px) 0,100% 50%,calc(100% - 12px) 100%,12px 100%,0 50%); margin-left:-12px; padding:8px 20px 8px 20px; color:#fff; text-align:center; user-select:none;">
        <div style="font-size:19px; font-weight:700; opacity:0.3; line-height:1;">2</div>
        <div style="font-size:9px; font-weight:700; line-height:1.35;">Execution</div>
      </div>

      <div style="position:relative; z-index:3; flex:1; min-width:78px; background:#6b21a8; clip-path:polygon(12px 0,calc(100% - 12px) 0,100% 50%,calc(100% - 12px) 100%,12px 100%,0 50%); margin-left:-12px; padding:8px 20px 8px 20px; color:#fff; text-align:center; user-select:none;">
        <div style="font-size:19px; font-weight:700; opacity:0.3; line-height:1;">3</div>
        <div style="font-size:9px; font-weight:700; line-height:1.35;">Persist &amp;<br>PrivEsc</div>
      </div>

      <div style="position:relative; z-index:4; flex:1; min-width:78px; background:#a21caf; clip-path:polygon(12px 0,calc(100% - 12px) 0,100% 50%,calc(100% - 12px) 100%,12px 100%,0 50%); margin-left:-12px; padding:8px 20px 8px 20px; color:#fff; text-align:center; user-select:none;">
        <div style="font-size:19px; font-weight:700; opacity:0.3; line-height:1;">4</div>
        <div style="font-size:9px; font-weight:700; line-height:1.35;">Defense<br>Evasion</div>
      </div>

      <div style="position:relative; z-index:5; flex:1; min-width:78px; background:#be185d; clip-path:polygon(12px 0,calc(100% - 12px) 0,100% 50%,calc(100% - 12px) 100%,12px 100%,0 50%); margin-left:-12px; padding:8px 20px 8px 20px; color:#fff; text-align:center; user-select:none;">
        <div style="font-size:19px; font-weight:700; opacity:0.3; line-height:1;">5</div>
        <div style="font-size:9px; font-weight:700; line-height:1.35;">Cred Access<br>&amp; Discovery</div>
      </div>

      <div style="position:relative; z-index:6; flex:1; min-width:78px; background:#c2410c; clip-path:polygon(12px 0,calc(100% - 12px) 0,100% 50%,calc(100% - 12px) 100%,12px 100%,0 50%); margin-left:-12px; padding:8px 20px 8px 20px; color:#fff; text-align:center; user-select:none;">
        <div style="font-size:19px; font-weight:700; opacity:0.3; line-height:1;">6</div>
        <div style="font-size:9px; font-weight:700; line-height:1.35;">Lateral<br>Movement</div>
      </div>

      <div style="position:relative; z-index:7; flex:1; min-width:78px; background:#b91c1c; clip-path:polygon(12px 0,calc(100% - 12px) 0,100% 50%,calc(100% - 12px) 100%,12px 100%,0 50%); margin-left:-12px; padding:8px 20px 8px 20px; color:#fff; text-align:center; user-select:none;">
        <div style="font-size:19px; font-weight:700; opacity:0.3; line-height:1;">7</div>
        <div style="font-size:9px; font-weight:700; line-height:1.35;">Exfiltration<br>(double ×)</div>
      </div>

      <div style="position:relative; z-index:8; flex:1; min-width:78px; background:#7f1d1d; clip-path:polygon(12px 0,100% 0,100% 100%,12px 100%,0 50%); margin-left:-12px; padding:8px 8px 8px 20px; color:#fff; text-align:center; user-select:none;">
        <div style="font-size:19px; font-weight:700; opacity:0.3; line-height:1;">8</div>
        <div style="font-size:9px; font-weight:700; line-height:1.35;">Impact</div>
      </div>

    </div>

    <!-- ═══ DWELL TIME INDICATOR ═══ -->
    <div style="display:flex; margin:5px 0 18px; font-size:9px; user-select:none;">
      <div style="width:12.5%; border-top:2px solid #1d4ed8; padding-top:3px; color:#4a6fc0; text-align:center;">hours</div>
      <div style="width:12.5%; border-top:2px solid #4c1d95; padding-top:3px; color:#6040a0; text-align:center;"></div>
      <div style="width:50%; border-top:2px solid #fbbf24; padding-top:3px; color:#fbbf24; text-align:center; letter-spacing:0.3px;">↔ dwell: days to weeks &mdash; defender's detection window</div>
      <div style="width:12.5%; border-top:2px solid #b91c1c; padding-top:3px; color:#c04040; text-align:center;">hrs</div>
      <div style="width:12.5%; border-top:2px solid #7f1d1d; padding-top:3px; color:#903030; text-align:center;">min</div>
    </div>

    <!-- ═══ PHASE DETAIL CARDS ═══ -->
    <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:18px;">

      <div style="flex:1 1 calc(25% - 8px); min-width:148px; background:rgba(29,78,216,0.09); border:1px solid rgba(29,78,216,0.3); border-left:3px solid #1d4ed8; border-radius:4px; padding:10px 11px; box-sizing:border-box;">
        <div style="color:#60a5fa; font-weight:700; font-size:10.5px; margin-bottom:6px;">01 Initial Access</div>
        <div style="color:#4a4a4a; font-size:9.5px; line-height:1.75;">
          <div>▸ Phishing / HTML smuggling</div>
          <div>▸ Exposed RDP / VPN CVEs</div>
          <div>▸ IAB credential purchase</div>
          <div>▸ Supply chain compromise</div>
        </div>
        <div style="margin-top:7px; font-size:8.5px; color:#3b6fd8; background:rgba(29,78,216,0.12); padding:2px 6px; border-radius:2px; display:inline-block;">TA0001</div>
      </div>

      <div style="flex:1 1 calc(25% - 8px); min-width:148px; background:rgba(76,29,149,0.09); border:1px solid rgba(76,29,149,0.3); border-left:3px solid #6d28d9; border-radius:4px; padding:10px 11px; box-sizing:border-box;">
        <div style="color:#a78bfa; font-weight:700; font-size:10.5px; margin-bottom:6px;">02 Execution</div>
        <div style="color:#4a4a4a; font-size:9.5px; line-height:1.75;">
          <div>▸ PowerShell / WMI LOLBins</div>
          <div>▸ Macro-enabled documents</div>
          <div>▸ DLL sideloading</div>
          <div>▸ In-memory process injection</div>
        </div>
        <div style="margin-top:7px; font-size:8.5px; color:#6d28d9; background:rgba(76,29,149,0.15); padding:2px 6px; border-radius:2px; display:inline-block;">TA0002</div>
      </div>

      <div style="flex:1 1 calc(25% - 8px); min-width:148px; background:rgba(107,33,168,0.09); border:1px solid rgba(107,33,168,0.3); border-left:3px solid #7e22ce; border-radius:4px; padding:10px 11px; box-sizing:border-box;">
        <div style="color:#c084fc; font-weight:700; font-size:10.5px; margin-bottom:6px;">03 Persist &amp; PrivEsc</div>
        <div style="color:#4a4a4a; font-size:9.5px; line-height:1.75;">
          <div>▸ Sched. tasks / WMI subs</div>
          <div>▸ Kerberoasting / AS-REP</div>
          <div>▸ Pass-the-Hash / Ticket</div>
          <div>▸ Token impersonation</div>
        </div>
        <div style="margin-top:7px; font-size:8.5px; color:#7e22ce; background:rgba(107,33,168,0.15); padding:2px 6px; border-radius:2px; display:inline-block;">TA0003 / TA0004</div>
      </div>

      <div style="flex:1 1 calc(25% - 8px); min-width:148px; background:rgba(162,28,175,0.09); border:1px solid rgba(162,28,175,0.3); border-left:3px solid #a21caf; border-radius:4px; padding:10px 11px; box-sizing:border-box;">
        <div style="color:#e879f9; font-weight:700; font-size:10.5px; margin-bottom:6px;">04 Defense Evasion</div>
        <div style="color:#4a4a4a; font-size:9.5px; line-height:1.75;">
          <div>▸ AMSI / ETW patching</div>
          <div>▸ BYOVD (EDR kill)</div>
          <div>▸ Log clearing (wevtutil)</div>
          <div>▸ Timestomping</div>
        </div>
        <div style="margin-top:7px; font-size:8.5px; color:#a21caf; background:rgba(162,28,175,0.15); padding:2px 6px; border-radius:2px; display:inline-block;">TA0005</div>
      </div>

      <div style="flex:1 1 calc(25% - 8px); min-width:148px; background:rgba(190,24,93,0.09); border:1px solid rgba(190,24,93,0.3); border-left:3px solid #be185d; border-radius:4px; padding:10px 11px; box-sizing:border-box;">
        <div style="color:#fb7185; font-weight:700; font-size:10.5px; margin-bottom:6px;">05 Cred Access &amp; Discovery</div>
        <div style="color:#4a4a4a; font-size:9.5px; line-height:1.75;">
          <div>▸ LSASS dump / NTDS.dit</div>
          <div>▸ BloodHound / SharpHound</div>
          <div>▸ Domain trust mapping</div>
          <div>▸ Browser creds / SSH keys</div>
        </div>
        <div style="margin-top:7px; font-size:8.5px; color:#be185d; background:rgba(190,24,93,0.15); padding:2px 6px; border-radius:2px; display:inline-block;">TA0006 / TA0007</div>
      </div>

      <div style="flex:1 1 calc(25% - 8px); min-width:148px; background:rgba(194,65,12,0.09); border:1px solid rgba(194,65,12,0.3); border-left:3px solid #c2410c; border-radius:4px; padding:10px 11px; box-sizing:border-box;">
        <div style="color:#fb923c; font-weight:700; font-size:10.5px; margin-bottom:6px;">06 Lateral Movement</div>
        <div style="color:#4a4a4a; font-size:9.5px; line-height:1.75;">
          <div>▸ PsExec / WMI / WinRM</div>
          <div>▸ Golden / Silver Tickets</div>
          <div>▸ GPO abuse → mass deploy</div>
          <div>▸ ESXi hypervisor pivot</div>
        </div>
        <div style="margin-top:7px; font-size:8.5px; color:#c2410c; background:rgba(194,65,12,0.15); padding:2px 6px; border-radius:2px; display:inline-block;">TA0008</div>
      </div>

      <div style="flex:1 1 calc(25% - 8px); min-width:148px; background:rgba(185,28,28,0.09); border:1px solid rgba(185,28,28,0.3); border-left:3px solid #b91c1c; border-radius:4px; padding:10px 11px; box-sizing:border-box;">
        <div style="color:#f87171; font-weight:700; font-size:10.5px; margin-bottom:6px;">07 Exfiltration</div>
        <div style="color:#4a4a4a; font-size:9.5px; line-height:1.75;">
          <div>▸ Rclone → MEGA / S3</div>
          <div>▸ Double extortion staging</div>
          <div>▸ Throttled slow-burn upload</div>
          <div>▸ PII / IP / legal docs</div>
        </div>
        <div style="margin-top:7px; font-size:8.5px; color:#b91c1c; background:rgba(185,28,28,0.15); padding:2px 6px; border-radius:2px; display:inline-block;">TA0010</div>
      </div>

      <div style="flex:1 1 calc(25% - 8px); min-width:148px; background:rgba(127,29,29,0.14); border:1px solid rgba(239,68,68,0.35); border-left:3px solid #ef4444; border-radius:4px; padding:10px 11px; box-sizing:border-box;">
        <div style="color:#ef4444; font-weight:700; font-size:10.5px; margin-bottom:6px;">08 Impact</div>
        <div style="color:#4a4a4a; font-size:9.5px; line-height:1.75;">
          <div>▸ VSS / backup destruction</div>
          <div>▸ AES-256 + RSA encryption</div>
          <div>▸ Ransom note deployment</div>
          <div>▸ ESXi mass VM lockout</div>
        </div>
        <div style="margin-top:7px; font-size:8.5px; color:#ef4444; background:rgba(239,68,68,0.12); padding:2px 6px; border-radius:2px; display:inline-block;">TA0040</div>
      </div>

    </div>

    <!-- ═══ MITRE IMPACT CATEGORIES LEGEND ═══ -->
    <div style="border-top:1px solid #333; padding-top:13px;">
      <div style="color:#3a3a3a; font-size:9px; letter-spacing:1.5px; margin-bottom:8px; text-transform:uppercase;">MITRE Impact Categories — Blue Team Handbook</div>
      <div style="display:flex; flex-wrap:wrap; gap:5px;">
        <div style="padding:3px 8px; border-radius:3px; font-size:9.5px; background:rgba(96,165,250,0.1); border:1px solid rgba(96,165,250,0.25); color:#60a5fa;"><strong>Degradation</strong> — performance measurable before/after</div>
        <div style="padding:3px 8px; border-radius:3px; font-size:9.5px; background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.25); color:#fbbf24;"><strong>Interruption</strong> — asset unavailable for a period</div>
        <div style="padding:3px 8px; border-radius:3px; font-size:9.5px; background:rgba(167,139,250,0.1); border:1px solid rgba(167,139,250,0.25); color:#a78bfa;"><strong>Modification</strong> — data / filesystem altered at rest or in transit</div>
        <div style="padding:3px 8px; border-radius:3px; font-size:9.5px; background:rgba(34,197,94,0.09); border:1px solid rgba(34,197,94,0.25); color:#22c55e;"><strong>Fabrication</strong> — new or suspect information introduced</div>
        <div style="padding:3px 8px; border-radius:3px; font-size:9.5px; background:rgba(249,115,22,0.1); border:1px solid rgba(249,115,22,0.25); color:#f97316;"><strong>Unauthorized Use</strong> — resources used for attacker's own purposes</div>
        <div style="padding:3px 8px; border-radius:3px; font-size:9.5px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); color:#ef4444;"><strong>Interception</strong> — information leaked and used by attacker</div>
      </div>
    </div>

  </div>
</div>

---

## The Eight Phases

### Phase 1 — Initial Access

**Goal:** Get a foothold inside the target network.

Ransomware operators — whether direct threat actors or RaaS affiliates — almost always enter through one of four vectors:

| Vector | Examples | Prevalence |
|---|---|---|
| **Phishing / spear-phishing** | Macro-enabled Office docs, HTML smuggling, QR-code lures | Highest |
| **Exposed remote services** | RDP on port 3389, VPN appliances (Citrix, Pulse, Fortinet), Exchange | High |
| **Valid credentials (purchased)** | Initial Access Brokers sell stolen VPN/RDP creds on darknet markets | Growing |
| **Supply chain / trusted software** | Trojanised updates, compromised MSP tools (Kaseya, ConnectWise) | Targeted |
| **Drive-by / watering hole** | Malvertising chains, exploit kits against unpatched browsers | Low but persistent |

**MITRE ATT&CK:** `T1566` (Phishing), `T1133` (External Remote Services), `T1078` (Valid Accounts), `T1195` (Supply Chain Compromise)

> **Defender note:** The single most impactful control at this phase is **MFA on every internet-facing service**. RDP and VPN accounts without MFA are the number-one ransomware entry point year after year.

---

### Phase 2 — Execution

**Goal:** Run the initial payload on the victim machine.

Modern ransomware loaders avoid dropping executable files where possible. They prefer to live entirely in memory or abuse signed Windows binaries:

- **PowerShell / WMI** — `IEX(New-Object Net.WebClient).DownloadString(...)` executes in-memory stagers
- **LOLBins (Living off the Land)** — `mshta.exe`, `regsvr32.exe`, `certutil.exe`, `wscript.exe` all execute attacker-controlled payloads while appearing as legitimate Windows processes
- **Malicious macros** — Still effective; Office macro execution is blocked by default in current Microsoft 365 policies but legacy environments lag behind
- **DLL sideloading** — Drop a malicious DLL next to a legitimate signed executable; the OS loads it automatically

**MITRE ATT&CK:** `T1059` (Command and Scripting Interpreter), `T1218` (System Binary Proxy Execution), `T1055` (Process Injection)

---

### Phase 3 — Persistence & Privilege Escalation

**Goal:** Survive reboots and reach SYSTEM or Domain Admin.

Ransomware operators do not immediately encrypt. They dwell — often for **days to weeks** — establishing persistence and escalating privileges before detonating. This dwell time is the defender's window.

**Persistence mechanisms:**
- Registry run keys (`HKCU\Software\Microsoft\Windows\CurrentVersion\Run`)
- Scheduled tasks with system-level triggers
- Windows services (install a new service or hijack a vulnerable one)
- WMI subscriptions (survive across reboots silently)
- Boot/pre-OS persistence (bootkits — rare, used by Fancy Bear and some RaaS groups)

**Privilege escalation paths:**
- **Unpatched local privilege escalation** — PrintNightmare, EternalBlue, LocalPotato
- **Token impersonation** — Steal tokens from higher-privileged processes using `SeImpersonatePrivilege`
- **Kerberoasting** — Request TGS tickets for service accounts with SPNs, crack offline
- **AS-REP Roasting** — Accounts without pre-auth enabled; no credentials needed to get a crackable hash
- **Pass-the-Hash / Pass-the-Ticket** — Harvest NTLM hashes or Kerberos TGTs and reuse

**MITRE ATT&CK:** `T1053` (Scheduled Task), `T1543` (Create/Modify System Process), `T1558` (Steal/Forge Kerberos Tickets), `T1134` (Access Token Manipulation)

---

### Phase 4 — Defense Evasion

**Goal:** Blind or bypass the defender's visibility tools before the noisy phases begin.

This is where sophisticated ransomware groups separate themselves from commodity ransomware:

| Technique | What it does |
|---|---|
| **AMSI bypass** | Patches `AmsiScanBuffer` in memory; PowerShell scripts become invisible to antivirus |
| **ETW patching** | Disables Windows Event Tracing; EDRs that depend on ETW go blind |
| **Timestomping** | Modifies file `$STANDARD_INFORMATION` timestamps to hide new files |
| **Log clearing** | `wevtutil cl Security`, `wevtutil cl System` — erases Windows event logs |
| **EDR tampering** | Kills EDR agent processes or drivers via vulnerable signed drivers (BYOVD — Bring Your Own Vulnerable Driver) |
| **Process injection** | Injects malicious code into legitimate processes (svchost, explorer) to evade process-based whitelisting |
| **Signed binary abuse** | Code-signed malware or abusing Microsoft-signed binaries |

**MITRE ATT&CK:** `T1562` (Impair Defenses), `T1070` (Indicator Removal), `T1055` (Process Injection), `T1553` (Subvert Trust Controls)

> **BYOVD alert:** Groups like BlackCat/ALPHV and Clop have used vulnerable drivers from legitimate vendors (Gigabyte, Dell) to terminate EDR processes with kernel-level privileges. Monitor for new kernel driver loads (`Sysmon Event ID 6`) from unusual paths.

---

### Phase 5 — Credential Access & Discovery

**Goal:** Harvest every credential available; map the entire network.

With elevated privileges, operators dump credentials aggressively:

**Credential harvesting:**
- `lsass.exe` memory dump via Task Manager, `procdump`, `comsvcs.dll`, or direct syscall (`NanoDump`, `SilentProcessExit`)
- SAM database extraction (`reg save HKLM\SAM`)
- `NTDS.dit` extraction from Domain Controllers (the keys to the kingdom — contains every AD password hash)
- Browser credential stores (Chrome's `Login Data` SQLite database, credential manager)
- SSH keys, API tokens, cloud credentials from developer workstations

**Network discovery:**
- `nltest /dclist` — enumerate Domain Controllers
- `net group "Domain Admins"` — list privileged accounts
- `AdFind.exe`, `BloodHound` / `SharpHound` — graph Active Directory attack paths
- `nmap`, `masscan`, `Advanced IP Scanner` — map reachable hosts and open ports
- SMB share enumeration to identify file servers holding valuable data

**MITRE ATT&CK:** `T1003` (OS Credential Dumping), `T1018` (Remote System Discovery), `T1087` (Account Discovery), `T1482` (Domain Trust Discovery)

---

### Phase 6 — Lateral Movement

**Goal:** Spread across the network to high-value targets (domain controllers, file servers, backup infrastructure, ESXi hypervisors).

| Technique | Tool / method | Why ransomware operators prefer it |
|---|---|---|
| **Pass-the-Hash** | `Mimikatz`, `Impacket` | No plaintext password needed — reuse NTLM hash |
| **PsExec / SMBExec** | `PsExec.exe`, `Impacket psexec.py` | Runs commands remotely over SMB using admin shares |
| **WMI / WinRM** | `wmic.exe /node:`, PowerShell remoting | Built-in, usually not blocked internally |
| **RDP hijacking** | Hijack existing disconnected sessions | Interactive sessions with no new logon event |
| **GPO abuse** | Modify Group Policy Objects to push malware to all domain members | One action infects thousands of machines |
| **Golden / Silver Tickets** | `Mimikatz kerberos::golden` | Forge Kerberos tickets after NTDS.dit compromise; valid for 10 years by default |

> **The ESXi pivot:** Modern ransomware families (Black Basta, ESXiArgs, Royal) specifically target VMware ESXi hypervisors. A single encrypted hypervisor can take down hundreds of virtual machines simultaneously — maximising impact while minimising the number of hosts that need to be reached.

**MITRE ATT&CK:** `T1550` (Use Alternate Authentication Material), `T1021` (Remote Services), `T1484` (Domain Policy Modification)

---

### Phase 7 — Exfiltration (Double Extortion)

**Goal:** Steal a copy of sensitive data *before* encrypting it, creating a second extortion lever.

Double extortion became the standard ransomware model around 2020 (pioneered by Maze). Triple extortion adds a third lever: DDoS attacks against the victim or direct contact with their customers.

**Exfiltration methods:**

- **Rclone** — The tool of choice; syncs local directories to attacker-controlled cloud storage (MEGA, Backblaze, S3-compatible). Frequently seen with obfuscated config files.
- **Custom upload tools** — FTP/SFTP/HTTPS to attacker infrastructure
- **Staging in cloud services** — OneDrive, SharePoint abuse; data blend into legitimate traffic
- **Slow-and-slow exfiltration** — Throttled uploads to avoid bandwidth anomaly detection

**What gets stolen:**
- Legal documents, M&A agreements
- Employee PII, health records, payroll data
- Customer databases
- Intellectual property, source code
- Credentials and access data for further leverage

**MITRE ATT&CK:** `T1048` (Exfiltration Over Alternative Protocol), `T1567` (Exfiltration Over Web Service), `T1020` (Automated Exfiltration)

> **Detection window:** Rclone activity is highly detectable. Look for `rclone.exe` or renamed variants (`svchost32.exe`, `OneDriveSetup.exe`), unusual outbound data volumes to cloud storage endpoints, and the presence of `rclone.conf` files in `%APPDATA%` or `%TEMP%`.

---

### Phase 8 — Impact

**Goal:** Maximise pressure on the victim to pay.

This is the final, irreversible phase. Operators have already achieved their primary objectives — persistent access, credential harvest, data exfiltration. Encryption is the trigger that forces the victim to engage.

**Pre-encryption preparation:**
- Delete Volume Shadow Copies: `vssadmin delete shadows /all /quiet` — removes Windows' built-in snapshot backups
- Disable Windows Recovery: `bcdedit /set {default} recoveryenabled No`
- Stop backup processes: kill agents from Veeam, Backup Exec, Acronis, SQL Server backup jobs
- Wipe network-accessible backup repositories (NAS, tape libraries reached via SMB)

**Encryption execution:**
- Target specific file extensions (documents, databases, images) while skipping system files to keep the OS bootable
- Use hybrid encryption: generate a per-file AES-256 key, encrypt it with the attacker's RSA public key — fast bulk encryption, no key stored on victim system
- Rename files: `.locked`, `.BlackCat`, `.conti`, etc.
- Drop ransom note in every directory: `README.txt`, `DECRYPT_MY_FILES.html`

**MITRE ATT&CK:** `T1490` (Inhibit System Recovery), `T1489` (Service Stop), `T1486` (Data Encrypted for Impact), `T1491` (Defacement)

---

## MITRE Attack Effect Categories

When documenting a ransomware incident for leadership, legal, or insurance, defenders must translate technical findings into **business impact language**. The MITRE framework (sourced from *Blue Team Handbook: Incident Response Edition*, referencing MITRE Scott Mussman et al. Jul 2010 and NIST SP 800-115) defines six impact categories:

| Category | Definition | Ransomware manifestation |
|---|---|---|
| **Degradation** | Performance impact that can be measured before or after the event | Encryption process consumes 100% CPU/disk I/O; systems become unusable before full encryption completes |
| **Interruption** | Asset or system unavailable for a time period | Encrypted servers, locked workstations, downed ESXi hypervisors — business operations halt |
| **Modification** | Data, filesystem, software, or packets altered either at rest or in transit | Every encrypted file is a modification; ransomware also modifies the MBR (some variants), registry, and scheduled tasks |
| **Fabrication** | New or suspect information introduced into a system | Ransom notes deposited in every directory; rogue user accounts created; fake scheduled tasks and services installed |
| **Unauthorized Use** | Resources used for attacker's own purposes, or inappropriately used by a person in a position of trust | Victim compute and storage used for crypto-mining during dwell time; exfiltrated data used to harm third parties |
| **Interception** | Information leaked and used by an attacker | Double extortion: stolen customer PII, financial records, and IP published on leak sites if ransom not paid |

These categories map directly onto the phases:

| Kill Chain Phase | Primary MITRE Impact Category |
|---|---|
| Phase 4 — Defense Evasion | Modification (log clearing, ETW patching) |
| Phase 7 — Exfiltration | Interception, Unauthorized Use |
| Phase 8 — Impact (encryption) | Modification, Interruption |
| Phase 8 — Backup destruction | Modification, Degradation |
| Dwell time (crypto-mining) | Unauthorized Use, Degradation |
| Ransom note / data leak | Fabrication, Interception |

---

## Writing Impact Statements

Impact statements bridge the gap between technical incident findings and business-level reporting. They answer the question: **how does this event affect the organisation's ability to operate?**

A well-formed impact statement follows this structure:

> *"The [asset/service] was [MITRE impact category] by [threat actor action], resulting in the [organisation] being unable to [business capability] for [duration/scope]."*

**Examples by phase:**

| Phase | Raw technical finding | Impact statement |
|---|---|---|
| Phase 7 — Exfiltration | Rclone uploaded 200 GB to MEGA | "Customer PII records were **intercepted** by the threat actor; the organisation is unable to guarantee data confidentiality for approximately 45,000 customers." |
| Phase 8 — Encryption | `.BlackCat` extension on all file servers | "The order management system was **interrupted** for 72 hours, preventing the organisation from **processing customer orders** or **generating invoices**." |
| Phase 8 — Backup destruction | VSS snapshots deleted, Veeam repo wiped | "Backup infrastructure was **modified** and rendered non-functional; recovery time was **extended by an estimated 5–7 days** compared to a scenario with intact backups." |
| Phase 3 — Privilege escalation | Domain Admin compromised | "Domain administrative credentials were **modified** (passwords reset), rendering the organisation unable to **authenticate users** or **manage IT infrastructure** until a full Active Directory rebuild." |

> **Source:** *Blue Team Handbook: Incident Response Edition* — "Write Impact Statements based on the org's ability to execute against its goals (sell online, provide services) which describe how the event affects the organization. Use phrases like: 'perform activity X', 'achieve objective X', or 'effects on time to deliver product X or service Y'."

---

## Detection Signals per Phase

| Phase | High-signal detection |
|---|---|
| 1 — Initial Access | Failed VPN/RDP auth spikes; new user-agent on web gateway; OAuth app consent events |
| 2 — Execution | PowerShell with `-enc` or `-nop -w hidden`; `mshta.exe` spawning `cmd.exe`; `certutil.exe -urlcache` |
| 3 — Persistence | New scheduled task created by non-admin process; new service with random name; WMI subscription creation |
| 3 — Privilege Esc | Kerberos TGS requests for service accounts; `SeImpersonatePrivilege` use outside IIS/SQL; `whoami /priv` calls |
| 4 — Defense Evasion | `vssadmin.exe` or `wbadmin.exe` invocation; `wevtutil cl`; new kernel driver load from `%TEMP%` |
| 5 — Credential Access | `lsass.exe` accessed by non-system process; `reg save HKLM\SAM`; NTDS.dit read outside `ntdsutil` |
| 5 — Discovery | `nltest /dclist`; `BloodHound`/`SharpHound` execution; mass LDAP queries from a workstation |
| 6 — Lateral Movement | PsExec service creation; `wmic /node:` remote execution; RDP from server-to-server |
| 7 — Exfiltration | `rclone.exe` process; large outbound data to cloud storage; DNS queries to MEGA/Backblaze domains |
| 8 — Impact | Mass file rename events (millions/hour); `bcdedit` recovery modification; backup agent process killed |

---

## Defense-in-Depth Mapping

A single control is never sufficient. Map defenses across the entire chain:

| Phase | Primary control | Secondary control |
|---|---|---|
| Initial Access | MFA on all remote access | Patch internet-facing services within 24h of critical CVE |
| Execution | Disable Office macros via GPO | Application allowlisting (AppLocker / WDAC) |
| Persistence | Monitor scheduled task and service creation | Privileged Access Workstations (PAW) for admin tasks |
| Privilege Escalation | Tiered AD model (Tier 0/1/2) | LAPS for local admin passwords |
| Defense Evasion | Tamper-protected EDR with kernel sensor | Immutable centralised log shipping (SIEM) |
| Credential Access | Credential Guard (blocks LSASS access) | Disable NTLM where possible; enable Protected Users group |
| Lateral Movement | Network segmentation / micro-segmentation | Restrict SMB/WMI/WinRM between workstations |
| Exfiltration | CASB / DLP on egress | DNS filtering to block known exfil infrastructure |
| Impact | **Immutable, air-gapped backups** — the ultimate ransomware control | Test restores quarterly; know your RTO/RPO |

> **The backup rule:** The 3-2-1-1-0 strategy — **3** copies, on **2** different media, **1** offsite, **1** offline/air-gapped, **0** backup errors on last test. Ransomware operators target online backups specifically because they know defenders rely on them.

---

## IR Recovery Considerations

> *"Amount of damage increases recovery activity."* — Blue Team Handbook: Incident Response Edition

The MITRE impact categories directly translate to recovery effort. Every additional category affected multiplies complexity:

| Impact category present | Recovery implication |
|---|---|
| **Interruption only** (no modification) | Restore from backup; relatively straightforward |
| **Modification** (encrypted/altered data) | Must determine scope of affected data before restore |
| **Modification + Fabrication** (rogue accounts, persistence) | Must rebuild trust in the identity layer before restoring services |
| **Interception** (data exfiltrated) | Breach notification obligations triggered (GDPR, HIPAA, state laws); legal and PR response required in parallel |
| **All categories** (full double-extortion attack) | Parallel workstreams: IR, legal, comms, ransom negotiation, backup restoration, identity rebuild |

**Recovery sequence for a full ransomware event:**

1. **Isolate** — segment affected subnets; preserve forensic state on a sample of encrypted hosts before reimaging
2. **Identify scope** — which systems are affected, which are clean, what data was exfiltrated
3. **Eradicate** — remove all attacker persistence (accounts, scheduled tasks, services, WMI subscriptions, drivers) — do not skip this step before restoring
4. **Recover** — restore from the last known-good backup *after* eradication is confirmed; rebuild AD if NTDS.dit was compromised
5. **Validate** — run threat hunting across restored environment; verify integrity of backup before trusting it
6. **Post-incident** — produce impact statements for each MITRE category; update detection rules; run tabletop exercise within 90 days

> **The hardest lesson:** Organisations that pay the ransom without completing eradication are frequently re-encrypted within weeks. Payment buys a decryption key — it does not buy attacker removal.