---
layout: defense
title: Zero Trust Journey
---

This blog post provides an overview of Zero Trust principles and their implementation in a security-conscious organization. It's crucial to continually align your security practices with evolving threats and challenges in today's digital landscape.

## Objective

Let's explore the concept of "Zero Trust" and its key principles. We'll also discuss how to implement a Zero Trust model in your organization gradually. This blog post is based on industry best practices, such as the NIST publication SP 800-207 "Zero Trust Architecture" and CISA's paper "Toward a Zero Trust Architecture."

## Definition of Zero Trust

Zero Trust is a cybersecurity approach that assumes a breach is possible or already happened and recognizes the constant threat to corporate networks (also well known as the perimeter) from both external and internal sources. This approach challenges the outdated belief that everything inside a corporate perimeter is safe. Instead, Zero Trust advocates for continuous verification and least-privilege access.

> In other words: In a Zero Trust model, trust is never granted by default but is continually verified for every user, device, and data flow.

## Tenets of Zero Trust

NIST SP 800-207 outlines several key principles, or tenets, that should guide your Zero Trust implementation:

### Secure Communication Regardless of Location

In a Zero Trust model, communication is always secure, with a focus on confidentiality, integrity, and source authentication. Trust isn't assumed based solely on network location. All resources, whether inside or outside the corporate perimeter, must meet Zero Trust security requirements.

### Per-Session Resource Access

Access to enterprise resources is granted on a per-session basis. The trustworthiness of requestors is evaluated before granting access. Authentication and authorization for one resource do not automatically apply to others. Dynamic policies consider factors like user identity, device state, behavior, and environmental attributes.

### Dynamic Access Policies

Access to resources is determined by dynamic policies that consider client identity, application/service, and other attributes. Decisions account for the current threat level and the business process's needs. Attributes include identity, device state, behavior, and environment.

### Monitoring Asset Security

The enterprise continuously monitors and measures the security posture of owned and associated assets. Changes in security posture trigger appropriate remediations, such as applying patches or adjusting access levels.

### Dynamic Authentication and Authorization

Authentication and authorization are dynamic and strictly enforced, reevaluated throughout user transactions and sessions. Dynamic policies aim to balance security, availability, usability, and cost-efficiency.

### Data-Driven Security Improvement

The enterprise collects and utilizes data about the current state of assets, network infrastructure, and communications to enhance security posture. Insight from collected data informs dynamic policy creation and remediation/mitigation.

### Least Privilege Strategy

Adopting a least privilege strategy is a core objective in the Zero Trust model. It involves managing privilege consistently across locations and resource types, both at the network and application layers. Users are only authorized to access services they're explicitly granted access to, enhancing security.


# Implementation of Zero Trust

## Key Message

One common misconception is viewing Zero Trust as merely a choice of tools. Instead, it's a journey that affects all aspects of your organization's communication. This implementation should follow gradual steps and align with the tenets we've discussed.

## Security Guardrails

To successfully implement the Zero Trust Model, specific security guardrails, based on NIST's guidance, should be in place:

- All resources with access to the corporate environment should mutually authenticate themselves.
- Trust in resources must be continuously monitored and reevaluated.
- Network location should not imply trust.
- Changes in resource trust should trigger appropriate actions.
- All communication between resources should be encrypted and protected.
- Access and authorization decisions should align with business needs and risk tolerance.
- Access and authorization should be dynamic and regularly reassessed.
- Decisions should consider parameters and attributes that indicate the trust and threat level of the requesting resource.
- Data about the security posture should inform access and authorization decisions.
- Resources not meeting these requirements should remain in a traditional, untrusted network.

## Towards Zero Trust

When considering the types of resources in your environment, Zero Trust principles can be applied to various areas. The current maturity level might be advanced in some aspects, but gaps may exist, particularly in network segmentation and centralized authorization for application workloads.

> Be aware: Zero Trust is NOT the holy grail of cyber security, it's a journey

CISA's Zero Trust model describes them as follows and can affect one or multiple of these areas:

![](images/pillars_zta.png)

Based on the pillars the maturity can be assessed, like described by CISA. The maturity can be  seen in general on three levels: traditional, advanced, and optimal as shown in the model below:

![](images/zta-maturity.png)


... TO BE CONTINUED ...

### Sources and useful links

- [Zero trust model - modern security architecture (no date). Microsoft.](https://www.microsoft.com/en-us/security/business/zero-trust) (Accessed: October 12, 2023).

- [Spitael, D. (2020) Governments need to get serious about digital identities. Deloitte.](https://www.deloitte.com/global/en/services/risk-advisory/perspectives/zero-trust-the-next-evolution-in-an-organizations-identity-journey.html) (Accessed: October 12, 2023).

- [Hughes, C. (2021) 7 tenets of Zero Trust explained, CSO spotlight: Zero Trust. CSO Online.](https://www.csoonline.com/article/3626432/7-tenets-of-zero-trust-explained.html) (Accessed: October 12, 2023).

- [Rose, S. et al. (2020) Zero trust architecture, CSRC. National Institute of Standards and Technology.](https://csrc.nist.gov/publications/detail/sp/800-207/final) (Accessed: October 12, 2023).

- [Koilpilla, J. (2021) Towards a zero trust architecture: CSA, Towards a Zero Trust Architecture | CSA. Cloud Security Alliance.](https://cloudsecurityalliance.org/artifacts/towards-a-zero-trust-architecture/) (Accessed: October 12, 2023).

- [What is a Zero trust architecture (no date). Palo Alto Networks.](https://www.paloaltonetworks.com/cyberpedia/what-is-a-zero-trust-architecture) (Accessed: October 12, 2023).
