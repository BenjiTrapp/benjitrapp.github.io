---
layout: defense
title: iptables - Firewall Management Script
---

<img height="200" align="left" src="/images/firewall_manager_logo.png" >
This Bash script is designed to facilitate the management of `iptables` firewall rules. It provides a more user-friendly command-line interface for listing, adding, and deleting `iptables` rules.

## Features

- **List Current Rules**: Displays all current `iptables` rules with enhanced formatting for better readability.
- **Add New Rule**: Allows the user to add a new rule to the `iptables`, with inputs for chain, protocol, port, and action.
- **Delete Rule**: Enables the user to delete a specific rule by specifying the chain and rule number.

## Compatible Linux Distributions

The iptables management script is compatible with a wide range of Linux distributions that support `iptables` and have a Bash shell environment. Below is a list of some popular distributions where the script should work without issues:

- **Ubuntu**: All recent and LTS (Long Term Support) versions.
- **Debian**: Stable, Testing, and Unstable branches.
- **Fedora**: Including current and some previous versions.
- **CentOS**: Versions 6, 7, and 8 (CentOS 8 has shifted to using `nftables` by default but iptables are still supported).
- **Red Hat Enterprise Linux (RHEL)**: Versions 6, 7, and 8 (Similar to CentOS, RHEL 8 uses `nftables` by default but supports iptables).
- **Arch Linux**: Rolling release model ensures up-to-date iptables and Bash versions.
- **Manjaro**: Based on Arch Linux, hence fully compatible.
- **openSUSE Leap** and **Tumbleweed**: Both the regular release and rolling release versions.
- **Mint**: Based on Ubuntu and Debian, so it's fully compatible.
- **Slackware**: One of the oldest distributions that still maintain iptables and Bash in its environment.

## Prerequisites

Before running the script, ensure that `iptables` is installed and that you have `sudo` or root access to manage firewall rules. Some distributions may use `nftables` as a default firewall management tool. In such cases, you might need to install `iptables` or use its compatibility layer.


```bash
#!/bin/bash
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' 

function is_number() {
    [[ $1 =~ ^[0-9]+$ ]]
}

function list_rules() {
    echo -e "${GREEN}Current iptables rules:${NC}"
    echo "---------------------------------------------"
    iptables -L --line-numbers -n -v | while IFS= read -r line; do
        if [[ $line =~ ^Chain ]]; then
            echo -e "${RED}$line${NC}"
            echo "---------------------------------------------"
        else
            echo "$line"
        fi
    done
    echo "---------------------------------------------"
    echo ""
}

function add_rule() {
    read -p "Enter the chain (INPUT, FORWARD, OUTPUT): " chain
    read -p "Enter the protocol (tcp, udp, icmp, all): " protocol
    read -p "Enter the port number: " port
    read -p "Enter the action (ACCEPT, DROP, REJECT): " action

    if ! is_number "$port"; then
        echo -e "${RED}Error: Port must be a number.${NC}"
        return
    fi
    iptables -A "$chain" -p "$protocol" --dport "$port" -j "$action"
    echo -e "${GREEN}Rule added successfully.${NC}"
}

function delete_rule() {
    read -p "Enter the chain (INPUT, FORWARD, OUTPUT) from which to delete the rule: " chain
    read -p "Enter the rule number to delete: " rule_number
    if ! is_number "$rule_number"; then
        echo -e "${RED}Error: Rule number must be a number.${NC}"
        return
    fi
    iptables -D "$chain" "$rule_number"
    echo -e "${GREEN}Rule deleted successfully.${NC}"
}

function main_menu() {
    clear
    readonly SPLASH="""
    ____ _ ____ ____ _ _ _ ____ _    _       _  _ ____ _  _ ____ ____ ____ ____ 
    |___ | |__/ |___ | | | |__| |    |       |\/| |__| |\ | |__| | __ |___ |__/ 
    |    | |  \ |___ |_|_| |  | |___ |___    |  | |  | | \| |  | |__] |___ |  \ 
    """
    echo -e "${GREEN}${SPLASH}${NC}"
    options=("List current rules" "Add a new rule" "Delete a rule" "Exit")
    select opt in "${options[@]}"
    do
        case $opt in
            "List current rules")
                list_rules
                break
                ;;
            "Add a new rule")
                add_rule
                break
                ;;
            "Delete a rule")
                delete_rule
                break
                ;;
            "Exit")
                echo "Exiting script."
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid option, please choose a number between 1 and 4.${NC}"
                ;;
        esac
    done
}

trap "echo 'Script interrupted'; exit 0" SIGINT SIGTERM

while true; do
    main_menu
    read -p "Press Enter to continue..."
done
```
