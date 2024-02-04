---
layout: memory
title: GitHub search syntax fpr API Keys/Secrets/Tokens
---

Cheatsheet that enhances the [GitHub dork list](https://benjitrapp.github.io/memories/2022-09-04-github-dorks/) to hunt with the GitHub search syntax for leaked API keys, secrets, and tokens. This list isn't complete but a good starting point.

- [GitHub Search Syntax for Finding API Keys/Secrets/Tokens](#github-search-syntax-for-finding-api-keyssecretstokens)
  - [Search Syntax:](#search-syntax)
  - [Examples:](#examples)
  - [Screenshot:](#screenshot)
  - [Parameters Used](#parameters-used)
    - [File Extensions](#file-extensions)
    - [Keynames](#keynames)
  - [Other Useful Tools:](#other-useful-tools)


# GitHub Search Syntax for Finding API Keys/Secrets/Tokens
e created a comprehensive search list using powerful search syntax that enables the search of thousands of leaked keys and secrets in a single search.

## Search Syntax:

```js
(path:*.{File_extension1} OR path:*.{File_extension-N}) AND ({Keyname1} OR {Keyname-N}) AND (({Signature/pattern1} OR {Signature/pattern-N}) AND ({PlatformTag1} OR {PlatformTag-N}))
```

## Examples: 

**1. OpenAI API keys**

```js
(path:*.xml OR path:*.json OR path:*.properties OR path:*.sql OR path:*.txt OR path:*.log OR path:*.tmp OR path:*.backup OR path:*.bak OR path:*.enc OR path:*.yml OR path:*.yaml OR path:*.toml OR path:*.ini OR path:*.config OR path:*.conf OR path:*.cfg OR path:*.env OR path:*.envrc OR path:*.prod OR path:*.secret OR path:*.private OR path:*.key) AND (access_key OR secret_key OR access_token OR api_key OR apikey OR api_secret OR apiSecret OR app_secret OR application_key OR app_key OR appkey OR auth_token OR authsecret) AND ("sk-" AND (openai OR gpt))
```

## Screenshot:  

![](/images/github-search.png)



**2. Github OAuth/App/Personal/Refresh Access Token**

```js
(path:*.xml OR path:*.json OR path:*.properties OR path:*.sql OR path:*.txt OR path:*.log OR path:*.tmp OR path:*.backup OR path:*.bak OR path:*.enc OR path:*.yml OR path:*.yaml OR path:*.toml OR path:*.ini OR path:*.config OR path:*.conf OR path:*.cfg OR path:*.env OR path:*.envrc OR path:*.prod OR path:*.secret OR path:*.private OR path:*.key) AND (access_key OR secret_key OR access_token OR api_key OR apikey OR api_secret OR apiSecret OR app_secret OR application_key OR app_key OR appkey OR auth_token OR authsecret) AND (("ghp_" OR "gho_" OR "ghu_" OR "ghs_" OR "ghr_") AND (Github OR OAuth))
```

**3. Slack Token**

```js
(path:*.xml OR path:*.json OR path:*.properties OR path:*.sql OR path:*.txt OR path:*.log OR path:*.tmp OR path:*.backup OR path:*.bak OR path:*.enc OR path:*.yml OR path:*.yaml OR path:*.toml OR path:*.ini OR path:*.config OR path:*.conf OR path:*.cfg OR path:*.env OR path:*.envrc OR path:*.prod OR path:*.secret OR path:*.private OR path:*.key) AND (access_key OR secret_key OR access_token OR api_key OR apikey OR api_secret OR apiSecret OR app_secret OR application_key OR app_key OR appkey OR auth_token OR authsecret) AND (xox AND Slack)
```

**4. Google API key**

```js
(path:*.xml OR path:*.json OR path:*.properties OR path:*.sql OR path:*.txt OR path:*.log OR path:*.tmp OR path:*.backup OR path:*.bak OR path:*.enc OR path:*.yml OR path:*.yaml OR path:*.toml OR path:*.ini OR path:*.config OR path:*.conf OR path:*.cfg OR path:*.env OR path:*.envrc OR path:*.prod OR path:*.secret OR path:*.private OR path:*.key) AND (access_key OR secret_key OR access_token OR api_key OR apikey OR api_secret OR apiSecret OR app_secret OR application_key OR app_key OR appkey OR auth_token OR authsecret) AND (AIza AND Google)
```

**5. Square OAuth/access token**

```js
(path:*.xml OR path:*.json OR path:*.properties OR path:*.sql OR path:*.txt OR path:*.log OR path:*.tmp OR path:*.backup OR path:*.bak OR path:*.enc OR path:*.yml OR path:*.yaml OR path:*.toml OR path:*.ini OR path:*.config OR path:*.conf OR path:*.cfg OR path:*.env OR path:*.envrc OR path:*.prod OR path:*.secret OR path:*.private OR path:*.key) AND (access_key OR secret_key OR access_token OR api_key OR apikey OR api_secret OR apiSecret OR app_secret OR application_key OR app_key OR appkey OR auth_token OR authsecret) AND (("sq0atp-" OR "sq0csp-") AND (square OR OAuth))
```

**6. Shopify shared secret, access token, private/custom app access token**

```js
(path:*.xml OR path:*.json OR path:*.properties OR path:*.sql OR path:*.txt OR path:*.log OR path:*.tmp OR path:*.backup OR path:*.bak OR path:*.enc OR path:*.yml OR path:*.yaml OR path:*.toml OR path:*.ini OR path:*.config OR path:*.conf OR path:*.cfg OR path:*.env OR path:*.envrc OR path:*.prod OR path:*.secret OR path:*.private OR path:*.key) AND (access_key OR secret_key OR access_token OR api_key OR apikey OR api_secret OR apiSecret OR app_secret OR application_key OR app_key OR appkey OR auth_token OR authsecret) AND (("shpss_" OR "shpat_" OR "shpca_" OR "shppa_") AND "Shopify")
```

## Parameters Used

### File Extensions

|File Extension|Description|
|:----|:----|
|.xml|XML file format|
|.json|JSON (JavaScript Object Notation) file format|
|.properties|Properties file format used for configuration settings|
|.sql|SQL (Structured Query Language) file format used for database queries|
|.txt|Plain text file format|
|.log|Log file format used for recording events or activities|
|.tmp|Temporary file format|
|.backup|Backup file format|
|.bak|Backup file format|
|.enc|Encrypted file format|
|.yml|YAML (YAML Ain't Markup Language) file format used for configuration settings|
|.yaml|YAML (YAML Ain't Markup Language) file format used for configuration settings|
|.toml|TOML (Tom's Obvious, Minimal Language) file format used for configuration settings|
|.ini|INI (Initialization) file format used for configuration settings|
|.config|Configuration file format|
|.conf|Configuration file format|
|.cfg|Configuration file format|
|.env|Environment file format|
|.envrc|Environment file format specific to the Direnv tool|
|.prod|Production file format|
|.secret|Secret file format|
|.private|Private file format|
|.key|Key file format|


### Keynames

|Keynames|Description|
|:----|:----|
|access_key|Variable name to store the key used for accessing a resource or service|
|secret_key|Variable name to store the key used for authentication or encryption|
|access_token|Variable name to store the token used for accessing an API or resource|
|api_key|Variable name to store the key used for accessing an API or service|
|apikey|Shortened version of "api_key"|
|api_secret|Variable name to store the secret key used for API authentication|
|apiSecret|An alternate of "api_secret"|
|app_secret|Variable name to store the secret key used for application authentication|
|application_key|Variable name to store the key used for identifying an application|
|app_key|Variable name to store the key used for identifying an application|
|appkey|Shortened version of "app_key"|
|auth_token|Variable name to store the token used for authentication or authorization|
|authsecret|Variable name to store the secret key used for authentication or authorization|


## Other Useful Tools: 

- Online IDE Search: https://redhuntlabs.com/online-ide-search/
- Keyhacks on GitHub: https://github.com/streaak/keyhacks
- Google Hacking Database: https://www.exploit-db.com/google-hacking-database