---
layout: post
title: RaccoonRoute - Visual Network Pivot Planner
---

<img height="150" align="left" src="/images/raccoon-route.png"> Planning multi-hop pivots during a pentest or red team engagement can get messy fast. RaccoonRoute is a browser-based, zero-dependency pivot planner that lets you visually build tunnel chains, generate runbook commands, and export diagrams - all from a single HTML file with no server or build step required.

## Why RaccoonRoute?

During network penetration tests, pivoting through multiple compromised hosts is one of the most error-prone phases. You need to keep track of IPs, ports, users, tunnel directions, and the exact syntax for whichever tunneling tool you're using — often across several hops. A small mistake in a ProxyJump chain or a Chisel listener command can cost valuable time.

RaccoonRoute solves this by giving you an interactive diagram where you define your chain visually, configure each node's details, and let the tool auto-generate correct, copy-pasteable commands for every hop. No more flipping between cheat sheets and terminal tabs.

## Key Features

- **Interactive Drag-and-Drop Canvas** — Place Origin, Pivot, and Target nodes on an animated canvas with zoom, pan, and auto-layout
- **Unlimited Pivot Hops** — Insert as many intermediate pivot nodes as your engagement requires; commands update automatically for the entire chain
- **Subnet Overlays** — Add resizable subnet boxes that visually attach to chain nodes for clearer network segmentation
- **Component Catalog** — Quickly add infrastructure components from a searchable catalog
- **Three Operation Modes** — Switch between Tunneling, File Transfer, and Firewall modes to get context-specific commands
- **Auto-Generated Runbooks** — Each tool provides Setup, Verify, Next Hop, and Reference tabs with IP/user/port placeholders auto-substituted from your diagram
- **SSH Config Generator** — Produces `~/.ssh/config` entries and ProxyJump commands for your chain
- **All-In-One View** — Combined runbook output across all tabs for easy copy-paste into your engagement notes
- **Category & Chain Filtering** — Filter tools by category (Classic, Modern, Native/LoL, Proxy, Multi-Protocol) or scope commands to a specific hop
- **Node Configuration** — Double-click any node to set label, IP, ports, OS, user, interface, protocol, firewall rules, and notes
- **Export/Import** — Save and load diagram state as JSON; export the canvas as PNG for reports
- **Persistent State** — Auto-saves to localStorage so you don't lose your work
- **Zero Dependencies** — Single `index.html` file, works offline, no build step, no server

### Tunneling

| Tool | Category |
|------|----------|
| SSH | Classic |
| Chisel | Modern |
| Ligolo-ng | Modern |
| SSHuttle | Classic |
| socat | Classic |
| iptables | Native/LoL |
| OpenSSL | Native/LoL |
| BurpSuite | Proxy |
| gost | Multi-Protocol |



Check out the repo [here](https://benjitrapp.github.io/raccoon-route)
