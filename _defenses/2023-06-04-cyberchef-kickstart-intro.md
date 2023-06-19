---
layout: defense
title: CyberChef introduction
---

Below you'll find a quick introduction into CyberChef, it's UI, and a example. CyberChef can be used to: Encode, Decode, Format data, Parse data, Encrypt, Decrypt, Compress data, Extract data, perform arithmetic functions against data, defang data, and many other functions.

This article is mainly dedicated for folks, that are new into the subject "CyberChef". For experts, feel free to skip this article and directly jump into more advanced topics [here](https://benjitrapp.github.io/defenses/2023-06-18-cyberchef-recipes-cheatsheet/).

## Short intro into the UI

After spinning up the [BenjiTrapp/boxed-cyberchef](https://github.com/BenjiTrapp/boxed-cyberchef) or [online version](https://gchq.github.io/CyberChef/) it's time to get get used to the UI of CyberChef.

<p align="center">
<img width="600" src="/images/cyberchef_ui.jpg">
</p>

Based on the picture from above, all sections can be described as:

1. **Operations** – These are the single actions that can be performed on the data provided over the Input.

2. **Recipe** – Instructions for telling CyberChef what to do with the data. A Recipe usually consists of multiple Operations

3. **Input Section** – The provided data that you’re manipulating.

4. **Output section** – The result of the Input based on the applied Recipe functions.

5. **Bake** - The magic button to run the Recipe and derive some output.

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
