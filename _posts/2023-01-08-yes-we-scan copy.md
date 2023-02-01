---
layout: post
title: Yes we Scan
---

<img height="200" align="left" src="https://github.com/BenjiTrapp/yes-we-scan/raw/main/static/yws.jpg" > Want to perform a [NMAP](https://nmap.org) scan and have a tiny automated workflow around it? The GitHub Worflow uses [vulnersCom/nmap-vulners](https://github.com/vulnersCom/nmap-vulners) as a Vulnerability Scanner and get`s feed by adding the targets into [scan.txt](https://github.com/BenjiTrapp/yes-we-scan/blob/main/containerfiles/scan.txt).  

After performing a push into the master branch, the GitHub Workflow get's triggered. The results will be posted as a [GitHub issue](https://github.com/BenjiTrapp/yes-we-scan/issues) to keep things simplified


Check out the repo [here](https://github.com/BenjiTrapp/yes-we-scan/)
