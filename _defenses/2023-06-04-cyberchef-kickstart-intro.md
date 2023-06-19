---
layout: defense
title: CyberChef introduction
---

## Summary

To come back to our initial questions related to IOCs we can now dig deeper and summarize the following results:

1. The PowerShell drops a reverse Shell, so this script can be seen as malicious.
2. The target URL 10.20.30.40 on Port 4711 belongs to our adversary.
3. Now you should check at least the following things:
   1. Stop the attack and contain the machine to kick the attacker out of your network.
   2. Did the EDR/AV block the attack?
   3. Are there other outbound connection to the IP? Maybe from other machines?
   4. How was the attacker able to implant the script? Which hole did the attacker use?

If you want to learn more about the payload itself and dig deeper into the property of the Red Team, check this [Gist File](https://gist.github.com/BenjiTrapp/c7df0f9307ff236f863b2b271ae9d64d) out.
