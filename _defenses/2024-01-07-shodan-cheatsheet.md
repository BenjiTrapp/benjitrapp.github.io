---
layout: defense
title: Shodan for Defenders
---

<img height="200" align="left" src="/images/shodan_defender_logo.png" >
Shodan, a search engine for finding internet-connected devices. This post covers basic search commands, the Shodan Command Line tool, and incident response tactics for detecting Cobalt Strike Servers, Metasploit, Empire, and Responder. It includes valuable resources and cheat sheets for further exploration.

<br>
## Attack Surface 

Based on your company domain you could do the following to see your infrastructure with the eyes of an attacker:

```
https://shodan.io/domain/<company domain like google.com>
```

## Basic Searching

`port:` Search by specific port  
`net:` Search based on an IP/CIDR  
`hostname:` Locate devices by hostname  
`os:` Search by Operating System  
`city:` Locate devices by city  
`country:` Locate devices by country  
`geo:` Locate devices by coordinates  
`org:` Search by organization  
`before/after:` Timeframe delimiter  
`hash:` Search based on banner hash  
`has_screenshot:true` Filter search based on a screenshot being present  
`title:` Search based on text within the title  
`asn:` Search ASN e.g. 'AS12345'  
`ssl.jarm:` Search by JARM fingerprint  

## Shodan Command Line

**Credits**:  
Every query credit gets you up to 100 results, which means that you can download at least 10,000 results every month - regardless of the type of search you're performing.

**Initializing**:  
`shodan init YOUR_API_KEY`  

Basic syntax:  
`shodan download --limit <number of results> <filename> <search query>`

NB: the filename should be `.json.gz`  

Using the `parse` command:  
`shodan parse --fields ip_str,port,hostname --separator , youroutput.json.gz`

Convert to CSV:  
`shodan convert output.json.gz csv`

<!-- cSpell:disable -->
## Incident Response

### Cobalt Strike Servers
```
"HTTP/1.1 404 Not Found" "Content-Type: text/plain" "Content-Length: 0" "Date" -"Server" -"Connection" -"Expires" -"Access-Control" -"Set-Cookie" -"Content-Encoding" -"Charset"
```

### Hunting Metaspolit
```
ssl:"MetasploitSelfSignedCA" http.favicon.hash:"-127886975"
```

### Hunting Empire
```
http.html_hash:"611100469"
```

### Hunting Havoc C2
```
X-Havoc: true
```

[Shodan Hunting Rule](https://www.shodan.io/search?query=X-Havoc%3A+true&source=post_page-----2d7bb4e46d64--------------------------------)

### Hunting OST 
```
server2003.smb.local
```

[Shodan Hunting Rule](https://www.shodan.io/search?query=HTTP%2F1.1+401+Unauthorized+Date%3A+Wed+12+Sep+2012+13%3A06%3A55+GMT&source=post_page-----2d7bb4e46d64--------------------------------)

### Hunting Responder
```
"HTTP/1.1 401 Unauthorized" "Date: Wed, 12 Sep 2012 13:06:55 GMT"
```

#### Sources     
* [https://thor-sec.com/cheatsheet/shodan/shodan_cheat_sheet/](https://thor-sec.com/cheatsheet/shodan/shodan_cheat_sheet/)
* [https://developer.shodan.io/api/banner-specification](https://developer.shodan.io/api/banner-specification)  
* [http://orkish5.ddns.net/wp-content/uploads/2018/07/Shodan-Complete-Guide.pdf](http://orkish5.ddns.net/wp-content/uploads/2018/07/Shodan-Complete-Guide.pdf)
* [https://twitter.com/cglyer/status/1182024668099862528](https://twitter.com/cglyer/status/1182024668099862528)
* [https://twitter.com/felixaime/status/1182549481688109056](https://twitter.com/felixaime/status/1182549481688109056)
<!-- cSpell:enable -->
