---
layout: memory
title: Basic OS similar CMDs
---

Quick writeup of some basic but useful commands for Windows, Linux, and MacOS.

## System information

| task              | Windows CMD                              | Linux CMD                 | MacOS CMD                          |
| ----------------- | ---------------------------------------- | ------------------------- | ---------------------------------- |
| OS System Version | winver                                   | lsb_release -a / uname -a | sw_vers -productVersion            |
| Hardware Specs    | systeminfo                               | lshw /lscpu               | system_profiler SPHardwareDataType |
| System Uptime     | systeminfo/ net statistics / workstation | uptime / cat /proc/uptime | uptime                             |
| Network Config    | ipconfig/ ifconfig                       | ip addr / ifconfig        | ifconfig/ ipconfig getifaddr en0   |

## File System and Directory Structure

| task                        | Windows CMD       | Linux CMD           | MacOS CMD           |
| --------------------------- | ----------------- | ------------------- | ------------------- |
| File and Folder Permissions | icacls, takeown   | ls -k, chmod, chown | ls -l, chmod, chown |
| Check Disk Usage            | dir, fsutil, wmic | df,du               | df,du               |

## User and Group Management

| task                       | Windows CMD     | Linux CMD                 | MacOS CMD                             |
| -------------------------- | --------------- | ------------------------- | ------------------------------------- |
| Listing Users              | net user, wmic  | cat /etc/passwd           | dscl . -list /Users                   |
| Managing User Accounts     | net user, wmic  | useradd, usermod, userdel | sudo dscl . -create /USers/<username> |
| User abd Group Permissions | icacls, takeown | chmod, chown, chgrp       | chmod, chown, chgrp                   |

## Process Management

| task                      | Windows CMD    | Linux CMD            | MacOS CMD            |
| ------------------------- | -------------- | -------------------- | -------------------- |
| Viewing running processes | tasklist       | ps, top              | ps, top              |
| Managing process info     | taskkill       | kill, pkill, killall | kill, pkill, killall |
| Investigate Process Info  | tasklist, wmic | ps -ef, lsof, fuser  | ps -ef, lsof, fuser  |

## Network and Connectivity Services  

| task                                | Windows CMD                   | Linux CMD        | MacOS CMD                             |
| ----------------------------------- | ----------------------------- | ---------------- | ------------------------------------- |
| Check Connectivity                  | ping, tracert                 | ping, traceroute | ping, traceroute                      |
| Identify active Network Connections | netstat, Get-NetICPConnection | netstat ss       | netstat, lsof -i, lsof -i port_number |

## System Services  

| task                       | Windows CMD                                   | Linux CMD                                                                     | MacOS CMD      |
| -------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- | -------------- |
| Viewing running service    | services.msc, sc query                        | systemctl list-units, service --status-all                                    | launchctl list |
| Start/Stop/Restart service | services.msc, sc start/stop/restart <service> | systemctl start/stop/restart <service>, service <service> /start/stop/restart | sudo launchctl start/stop/ |

## System Logs and Monitoring  

| task                             | Windows CMD                       | Linux CMD         | MacOS CMD                   |
| -------------------------------- | --------------------------------- | ----------------- | --------------------------- |
| Accessing System Logs            | vent Viewer, wevutil              | syslog journalctl | /var/log/system.log         |
| Monitoring System Resource Usage | Task Manager, Performance Monitor | top, htop         | Activity Monitor, top, htop |
| Analyzing Log Files              | Event Viewer, wevutil             | grep, tail, less  | grep, tail, less            |

## Security and Encryption

| task                               | Windows CMD                                | Linux CMD                       | MacOS CMD                        |
| ---------------------------------- | ------------------------------------------ | ------------------------------- | -------------------------------- |
| Check File integrity               | certutil -hashfile <file> <hash_algorithm> | sha256sum <file>, md5sum <file> | shasum -a 256 <file>, md5 <file> |
| Working With Encryption Tools/Keys | BitLocker, EFS                             | GPG, OpenSSL                    | FileVault, encryption utilities  |
| Scan for Malware                   | Windows Defender, Security Essentials      | ClamAV, rkhunter, chkrootkit    | XProtect, ClamAV, EtreCheck, KnockKnock |

## System Maintenance and Automation 

| task                                   | Windows CMD                          | Linux CMD            | MacOS CMD                            |
| -------------------------------------- | ------------------------------------ | -------------------- | ------------------------------------ |
| Scheduling/Managing Tasks & CronJobs   | Task Scheduler                       | Cron, crontab        | launchd, cron                        |
| Automate repetitive Tasks with SCripts | Batch files (.bat, .cmd), PowerShell | Bash Scripts         | Bash Scripts, Automator, AppleScript |
| Config System Backups                  | Windows Backup, third-party tools    | rsync, tar, cron, dd | Time Machine, rsync, cron, dd        |
