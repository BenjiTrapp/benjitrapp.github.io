---
layout: post
title: AWS CloudTrail Threat Hunting 
---



<img height="200" align="left" src="https://github.com/BenjiTrapp/aws-threat-hunting/raw/main/static/aws-threathunting.png">
CloudTrail is the central logging source for each AWS account. It provides a perfect foundation for creating threat hunting queries, which can be used for offline analysis or integrated into a SIEM based on Athena, (H)ELK, Splunk, or a custom solution.

The CloudTrail dataset can be enriched with information such as geoIP, threat data, access level, and MITRE ATT&CK TTPs.

Other AWS offerings that can provide deeper insights into your AWS environment include S3 bucket access logs, VPC FlowLogs, VPC DNS queries (collected over Route 53 Resolver Query Logs), CloudWatch Logs, load balancer access logs, and traffic mirroring (one of the most awesome features of Nitro Instances).

All or even a subset of these log sources can be used to build a mature threat hunting and alerting system for your AWS cloud.

More ideas for hunting queries can be found in my [Blog](https://benjitrapp.github.io/defenses/2023-06-30-AWS-cloudtrail-ir/)

Happy hunting!

Check out the Repository: [AWS CloudTrail Threat Hunting](https://github.com/BenjiTrapp/aws-threat-hunting)