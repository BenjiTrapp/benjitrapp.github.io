---
layout: defense
title: Internet-Facing Attack Surface
---

<img height="200" align="left" src="/images/attack_surface_logo.png" >
Based on the internet-facing applications of your corporate, you can derive the attack surface and look through the eyes of an attacker. With this post I'll try to do some definitions, explain why, and give some best practices how you could adopt it to the cloud.

## What are internet-facing applications? 

> Internet-facing applications are programs and services that are accessible from the internet, as opposed to only through an internal network

Typically internet-facing applications are required for multiple reasons:
* Interaction with customers, remote maintenance, or business partners
* Necessary for employees who are working from home or out in the field

An example for an internet application includes:
* Web Applications
* APIs
* SSH/RDP/VNC Service to access/administrate machines
* VPN- or other Gateways
* Cloud services/resources
* Internet-facing Firewalls
* Any other remotely accessible services that are either deliberately or placed by accident on an internet-facing server

For the sake of being internet-facing: `it doesn't care if the assets resides on-premises, in the cloud, or in any hybrid combination of hosted, managed ,or virtualized infrastructure.` 

Another approach to phrase it could sound like the definition of the [United States Postal Service](https://www.uspsoig.gov/document/internet-facing-devices): 

> Internet-facing hosts are entry points that are typically the most attacked hosts on an organization’s network


## Why identify internet-facing applications?

Without keeping a complete and frequently-updated inventory of internet-facing applications, its hart to know what data is potentially vulnerable and how attackers may target your organization. When looking at the [Cyber Kill Chain](https://benjitrapp.github.io/defenses/2022-10-01-cyberkillchain-meets-mitre/) a lot of attacks begin with an external attacker gaining a foothold in a organization through an initial compromise of an internet-facing application.

Professional attackers like [Sandworm](https://collaborate.mitre.org/attackics/index.php/Group/G0007), [Magic Hound](https://attack.mitre.org/groups/G0059/), and [Axiom](https://attack.mitre.org/groups/G0001/) keep track of critical vulnerabilities and use a range of techniques to compromise internet-facing applications (mostly in a 100% automated way). 


## How can internet-facing applications systematically be found? 

To help you identify the internet-facing applications in your organization, we can derive quite a lot of actions from the philosophies of [Sun Tzu](https://en.wikipedia.org/wiki/Sun_Tzu). 

>  “If you know the enemy and know yourself, you need not fear the result of a hundred battles. If you know yourself but not the enemy, for every victory gained you will also suffer a defeat. If you know neither the enemy nor yourself, you will succumb in every battle.” ― Sun Tzu, The Art of War 

This could be translated like this:
* __Know Yourself__:  Identify the assets important to the business.
* __Know Your Team__: Identify where the assets are located within your network and other services provided by your organization
* __Know What the World Knows__: Attempt to find your public-facing systems (f.e. by DNS reconnaissance or network scanning techniques)
* __Know How to Collect and Access Discovery Data__: Organize the information obtained from the previous steps.
* __Know What Lies in the Cloud__: Determine your responsibility with respect to external assets and information hosted by a third party


## Let's combine the list of knowledge with Cloud Security

### Know Yourself

Start this process by talking with different business groups in the organizations, and establish what your assets are. It begins with asking about the core concerns of your company:

* What is the core business go and their related services?
* What is your main source of revenue?
* How do certain services and data contribute to these goals?
* How would the compromise of particular services or data undermine these goals?

This exercise will not only help you to identify and prioritize key assets but will also open a communication channel with other groups not usually involved in ensuring software security. Both of these achievements will make security related requirements in the future go more smoothly than ever, thanks to that improved communication. Also this is a great baseline for finding participants in a [Threat Modeling](https://benjitrapp.github.io/cultures/2022-06-11-threat-modeling/) workshop.

### Know Your Team

Once you have a picture of your asset categories and priorities, find your organization’s Network Engineer. They can help you answer important questions, especially when it comes to the essential focus of firewalls.

Firewalls protect the perimeter of the network, guarding your internal data from external attacks. Firewalls are a default-closed technology, which means if a user, either accidentally or on-purpose, creates a service in your network, it won't be exposed to the internet unless the firewall is instructed to allow it. If your firewalls are correctly configured, only the internet facing applications are explicitly allowed by the firewall. This is also a great source of information for creating an internet-facing application asset list, an essential resource to refer to in the event of a breach.

There are some exceptions that are important to address:

* Applications that are not behind a firewall, either intentionally or unintentionally. Even if there is a sound reason for not placing certain applications behind a firewall, it’s essential to identify them on the internet-facing application asset list so that teams know where to look in the event of a breach.
* Firewalls work at the protocol level, which means that if a protocol is allowed, most firewalls are not able to distinguish which instances of the application are allowed so long as they operate on the same protocol. In order to fully assess which applications are exposed, you need to identify not only those that were intentionally allowed but also those that may have been unintentionally allowed under the same protocol.
* Tunnels, VPNs, and (some) Firewalls are interfaces that connect networks together. Therefore, anything on the other end of a tunnel is likely a separate network that would have its own separate firewall perimeter.
* Anything that operates outside your network can still have internet facing applications. This can include external cloud environments, services, and applications that your organization may be unaware are owned by you but hosted elsewhere on the internet.


### Know What the World Knows

The easiest way is to ask a Service like [shodan.io](shodan.io/) or use a port scanner like NMAP on the corporate IP ranges to cover most of the internet-facing assets. Some additional sources could be:

#### DNS Reconnaissance

Knowing and cataloging which domains is used is a strong starting point, though this goes further. DNS Reconnaissance should include knowing what information a DNS lookup on the company name reveals, finding out what security limitations are placed on zone transfer requests, identifying mail servers, websites, and addresses associated with your business, and tracking ownership of those assets.Like said before shodan.io is also having your back on this.

WHOIS records also provide searchable data sources for the owners of domain names. The expiry of domain ownership is an especially important bit of information for attackers, since expired domains can be claimed, or may hold unmaintained applications. Performing DNS reconnaissance is an important step in identifying your internet facing applications, because it is also the starting point for many attackers.

#### Certificate Transparency Reconnaissance

TLS certificates are used to identify a host and bind a cryptographic key to the hostname, allowing users to establish an encrypted connection that is verified by a certificate authority. The global certificate authority infrastructure has created a public transparency log that is required to create and sign valid TLS certificates. This provides a log of all TLS certificates created globally.

This data, when carefully analyzed, can help discover if someone in your organization is creating certificates or hosts outside of the usual procedure. This can also be a useful threat intel indicator if an attacker is attempting to create lookalike domains, or otherwise targeting your TLS infrastructure.

#### Host and Port Detection

This begins with knowing and cataloging the IP ranges that belong to your company, including IPv4 and IPv6. Tools such as NMAP can be used to scan across those IP ranges and detect what hosts and services exist on that range. Consider establishing an external host from which all external discovery scans are performed, and then whitelisting that scanning host in the firewall or IDS, so you can get a true external view of available services. This should be done on a regular basis in order to identify new or changed hosts.

NMAP is used to detect ports and services that are running on identified hosts. NMAP allows a broad range of scanning options including TCP services, UDP services, and more detailed script scans that enumerate services in more detail. These essential scans should be conducted simultaneously with the host detection scans mentioned above. This information allows you to identify expected and unexpected services, investigate unexpected services, and figure out which services should be taken down or built into updated firewall or IDS configurations.

It’s crucial to remember that these scans should not be one-and-done. Rather, host and port detection should be an ongoing process that identifies any changes to the internet-facing exposure and allows your team to make adjustments accordingly.

#### Attack Surface Mapping

In addition to network services, web applications are a large part of an external attack surface. Mapping that part of the attack surface requires regularly assessing web applications for OWASP Top Ten vulnerabilities, as well as others that connect to what threat groups are using to attack web applications.

This verification can involve web-specific vulnerability scanners, as well as manual application assessment from security experts who specialize in web application assessment. The more detailed and thorough you are up front, the faster and more efficient future queries will become.

For a company of any size, discovering the external footprint is a large data collection project. Gathering that data is necessary, but it also matters to collect and keep this data in a scalable and accessible form. That way, you can track and respond to changes as you scan your internet-facing applications and services weekly, bi-weekly, or as often as your information security policy deems fit.

#### Know How to Collect and Access Discovery Data

Discovering what the world knows means little if you do not also log and track that information in a way that allows you to take action and increase your security. There are multiple ways to do this.

For small data sets, one useful way is to parse the information in Comma Separated Values (CSV) format and add it to a spreadsheet with various pages based on scan date. You may need to do some scripting to parse the information in a way that is meaningful to you.

An example would be to use PowerShell, Python or other scripting language to parse the output of the various data sources and aggregate it into a meaningful format. This can then give you a searchable and visual way to read and compare footprint data.

Larger datasets may require different tools. More and more data points can be aggregated from threat intel, OSINT and infrastructure management and monitoring tools. The data processing and management for an organization’s assets and exposure mapping can quickly become a full time job. There are also commercial services that automate much of this effort and provide a searchable interface of the results.

There is no single right way to keep track of scan data — just ensure that the data is well documented, easily retrievable, and presentable when the moment requires it.

#### Know What Lies in the Cloud

> Friends don't let friends build data centers - [AWS](https://aws.amazon.com/de/blogs/apn/friends-dont-let-friends-build-data-centers/) 

With the rise of the cloud, more and more data and services get moved into the cloud. Knowing what is there and what internet-facing services those cloud operations require becomes crucial. Knowing your cloud attack surface and your level of responsibility requires performing the following tasks:

* Identify the cloud services your business is using.
* Identify what data is associated with each of those cloud services.
* Identify what internet-facing services are required to interact with those cloud services.
* Be aware of the relationship your cloud service provider has with you, including their implementation of shared responsibility.
* Know what security testing is consistently performed by the cloud services provider.
* Know what security testing is or is not allowed to be performed by your organization.
* Understand the security configurations that are available for each cloud service, and use that knowledge to document and apply a proper security policy for each application or service. AWS f.e. provides great guides and sources like the [TrendMicro Knowledge Base](https://www.trendmicro.com/cloudoneconformity/) help you out here


> The key to identify resources which are internet-facing is tagging and best done in an automated way f.e. with Yor or CloudCustodian

A lot of organizations utilize the cloud in some way. The external service or application is still considered a public-facing entity of your organization. As part of your attack surface mapping, thoroughly tracking every cloud element optimizes your processes for future queries.

The level of responsibility you have for those services changes based on the type of service you are using. For example: are you using Infrastructure as a Service (IaaS), Software as a Service (SaaS), or Platform as a Service (PaaS)? In most cases, there is a level of shared responsibility between your organization and the cloud service provider, and there are also often rules for what security testing is allowed or not allowed by a cloud provider. In all scenarios, it is still your responsibility to ensure due diligence is done to identify risks in the cloud and secure your data, and don't forget: "All your data belongs to you".
