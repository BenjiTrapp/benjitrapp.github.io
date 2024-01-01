---
layout: post
title: AWS Login Guard
---

<img height="200" align="left" src="/images/aws_login_guard.png">
> Ever wondered who is lurking around in the shadows of your AWS Account? Get notified if strange login activities occurred in your AWS Account

<br><br><br><br><br><br><br><br>
If the event `AwsConsoleSigning` get's triggered, the Event Bridge shall trigger a lambda function, that gathers some info about "who is logging in" and try to check if it's a Pentester. Most of the guys are forgetting to disguise their user agents. In this first version we stay "detective", in later version also an automatic remediation could be implemented. Let's see how this script evolves :)

![]({{ site.baseurl }}/images/AWSLoginGuard.png)


[AWS-LoginGuard Repo](https://github.com/BenjiTrapp/AWS-LoginGuard)

**Currently still work in progress**
