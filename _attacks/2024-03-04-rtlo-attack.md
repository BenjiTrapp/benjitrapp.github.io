---
layout: attack
title: Short journey and exploitation of RTLO
---

<img height="150" align="left" src="/images/rtlo-attack-logo.png" >
[Right-to-Left Override (RTLO)](https://unicode-explorer.com/c/202E) attacks exploit users' trust in text files by disguising malicious executables with innocuous `.txt` extensions. By leveraging invisible Unicode characters to alter file names, attackers deceive users into executing harmful code unknowingly. These attacks often bypass email security measures, making them a potent tool for cyber criminals aiming to deliver malware payloads via phishing tactics.


![](/images/rtlo-comic.png)


## What exactly is a Right-to-Left Override Attack?
A Right-to-Left Override (RTLO) attack capitalizes on users' implicit trust in text files by disguising an executable file with a `.txt` extension. This sophisticated phishing technique deceives users into believing they're accessing a harmless text document, only to unwittingly launch a malicious executable instead. It stands as one among the myriad methods employed by ransomware operators to infiltrate corporate computer systems.

## The Role of Right-to-Left Unicode Characters
While English follows a left-to-right reading pattern, languages such as Arabic and Hebrew adhere to a right-to-left convention. Consequently, operating systems like Windows are engineered to accommodate diverse linguistic needs, including those of Arabic and Hebrew. By default, these systems display characters from left to right, but a special Unicode character prompts the system to display characters from right to left when required.

Represented in writing as [U+202e], this Unicode character can be conveniently copied and pasted from the Windows Character Map. Simply type "Character Map" in the Windows 10 / 11 search bar to access it. Upon enabling "Advanced View" and typing "202e" in the "Go to Unicode" field, you can copy the character to your clipboard and subsequently paste it into a document. Being non-displayable, this character doesn't manifest visually when pasted into a file.

## Demonstrating the Right-to-Left Unicode Character
An easy way to showcase the right-to-left Unicode character involves altering a file name. Consider the following:

- Original file name: `mytextfile.txt`
- Modified file name with Unicode character: `mytext[U+202e]file.txt`

Notice that you can copy the character directly from the Windows Character Map to ensure accurate input. Subsequently, right-click the file and select "Properties" to observe the change in the file name:

- Original: `mytextfile.txt`
- Modified: `mytexttxt.elif`

The reversal of letters following the Unicode character underscores this operating system feature's susceptibility to exploitation in phishing attacks, that allow attackers to trick email systems into injecting malicious executables into target users' inboxes, tricking them into unknowingly executing malware.

## Time for an additional example with some Code
This is a really simple example on how to create a file with a unicode right to left override character, used to disguise the real extension of the file.

In this example the .sh file get's disguised as a .jpg file. To weaponize this, not that much effort is required.

```python
#!/usr/bin/python3
filename = 'legit-img_sjvl\u202Egpj.sh'
with open(filename, 'w') as f:
    f.write('#!/usr/bin/bash\necho "THIS COULD BE A MALICIOUS FUNCTION CALL"')
```

## Integration with Phishing Tactics

THis technique is listed under [T1036.002](https://attack.mitre.org/techniques/T1036/002/) and is defined as a sub-technique of masquerading.

> Adversaries may abuse the right-to-left override (RTLO or RLO) character (U+202E) to disguise a string and/or file name to make it appear benign . . . Adversaries may abuse the RTLO character as a means of tricking a user into executing what they think is a benign file type.

Email represents a prime conduit for cyber threats, with phishing emails often serving as the precursor to major data breaches. While some phishing endeavors aim to extract sensitive data like authentication credentials, RTLO attacks primarily seek to trick users into running malicious software.

However, circumventing email security measures poses a challenge for attackers. While most email clients and recipient servers automatically block executable files, some also flag `.zip` attachments. Yet, in business contexts, zipped files are often necessary for sharing multiple files in a single attachment. Attackers exploiting RTLO resort to embedding malicious executables within zip archives, occasionally securing them with passwords. The password is then transmitted alongside the email to facilitate access for the targeted victim.

A plethora of file types, including .exe, .bat, .cmd, .vbs, .ps1 (PowerShell), and .com, serve as conduits for malware infiltration. Leveraging users' trust in the innocuousness of .txt files, attackers append the `.txt` extension to malicious files, capitalizing on the invisibility of the right-to-left Unicode character to deceive users. Consequently, when a seemingly benign file like `mytextexe.txt` is appended with the Unicode character and executed, it translates to `mytexttxt.exe`, enables the malware to carry out its nefarious intentions.

In numerous instances, attackers package malware executables within zip archives to evade email filters. Upon opening the archive and encountering the disguised text file, users unwittingly execute the payload, often resulting in the installation of ransomware or other malicious software on their devices. 

## RTLO Character encodings

The RTLO character is usually represented as its Unicode character code, U+202E, however, there are numerous other ways which are displayed in the table below:

|Encodings                          | Representation                  |
| ----------------------------------| ------------------------------- |
| HTML Entity (decimal)             | &#8238;                         |
| HTML Entity (hex)                 | &#x202e;                        | 
| How to type in Microsoft Windows  | Alt +202E                       | 
| UTF-8 (hex)                       | 0xE2 0x80 0xAE (e280ae)         | 
| UTF-8 (binary)                    | 11100010:10000000:10101110      | 
| UTF-16 (hex)	                    | 0x202E (202e)                   | 
| UTF-16 (decimal)                  | 8.238                           | 
| UTF-32 (hex)	                    | 0x0000202E (202e)               | 
| UTF-32 (decimal)	                | 8.238                           | 
| C/C++/Java source code	        | "\u202E"                        | 
| Python source code                | u"\u202E"                       | 