---
layout: defense
title: Dockerized/AWS Splunk Attack Range Lab
---

If you strife like me constantly to become better and looking for chances to train this one is for you. With Attack Range you can easily replay common attacks based on the MITRE ATT&CK Framework. Make sure that you check out [splunk/attack_data](https://github.com/splunk/attack_data) to understand the magic of this solution.

<p align="center">
<img width=600  src="/images/attack-range.png">
</p>

> “The Attack Range is a detection development platform, which solves three main challenges in detection engineering. First, the user is able to build quickly a small lab infrastructure as close as possible to a production environment. Second, the Attack Range performs attack simulation using different engines such as Atomic Red Team or Caldera in order to generate real attack data. Third, it integrates seamlessly into any Continuous Integration / Continuous Delivery (CI/CD) pipeline to automate the detection rule testing process.” — [Splunk Attack Range GitHub](https://github.com/splunk/attack_range)

## What is the Attack Range?

So the Attack Range in a nutshell is a way to spin up an environment where you can simulate activities done by a threat actor. Based on the performed traces you can then look at detecting it with the newly generated telemetry in Splunk. The threats can be emulated in 3 ways:

* MITRE Caldera (GUI included)
* Atomic Red Team (CLI via Python within the Docker container, super easy to use)
* Kali Linux box (Provided in the lab)

## Tiny step by step install manual

Prerequisite: Make sure that you've installed [Docker](https://docs.docker.com/engine/install/) or [Podman](https://podman-desktop.io/) (they also provide a Desktop version with a GUI if you're new to Docker)

### Step 1 — Download the Container and run it

Splunk provide a link to the container page, this can be found [here](https://github.com/splunk/attack_range/wiki/Using-Docker)

The Attack Range can also be run from a docker container

Run the following command in the terminal:

`docker pull splunkresearch/attack_range`

You can now run the image as a container by run

`docker run --rm -d -it --name attack_range splunkresearch/attack_range`

After running this make sure, to copy the container ID which is printed. This is required in the next step

### Step 2 — Configure AWS side

Let's start creating the AWS IAM with Programmatic Access. You can find it [here](https://github.com/splunk/attack_range/wiki/Creating-AWS-Credentials)

Once you’ve created the credentials, connect to the container via shell by running:

`docker exec -it <container ID> /bin/bash`

After accessing the bash in the container you can setup the AWS side by running:

`aws configure`

Running this command will then take you through the steps to add the Access Key and Secret you created in the AWS IAM steps provided above.

### Step 3 — Configure your range

Read before beginning:

> You need to subscribe on AWS marketplace to two Operating Systems, go to the AWS Marketplace, search & subscribe for these two:

* CentOS 7 (x86_64) — with Updates HVM
* Kali Linux (you can also use my [boxed-kali](https://github.com/BenjiTrapp/boxed-kali/blob/main/Makefile) for this)

Now you can run the commands below (has to be python3) with the argument ‘configure’ and follow through the configuration wizard.

> NOTE: Set your master password as something memorable, the wizard will generate one but it’s better to make one yourself. This is the password used to login to your CALDERA GUI and Splunk. Your username will default to “admin”.

> NOTE: You need to know what your preferred AWS region is, when in the console you can look in the top right for a region list, I opted for ‘eu-west-1'.

> NOTE: I opted to deploy: Windows DC, Windows Server and Kali. I left Zeek, Phantom and Windows client out. Extra configuration is required for Windows client and Phantom, Zeek gave me some errors but I didn’t require Zeek for this lab.

`python3 attack_range.py configure`

Once configured, the wizard will finish, you can then run the same command, this time with the ‘build’ argument.

`python3 attack_range.py build`

This command will automatically provision the lab for you, it’ll take around 20 minutes so grab a ☕

### Step 4 — Enjoy

Here’s some useful tips to get you started.

* Splunk is accessible via the Splunk servers IP:8000
* MITRE CALDERA GUI is accessible via the Splunk servers IP:8888

You can find instructions to run the [Atomic Red Team](https://github.com/redcanaryco/atomic-red-team) tests at the Splunk attack range repo, an example is:

`python attack_range.py simulate -st T1003.001 -t ar-win-dc-default-username-38042`

You simply change out the T1003.001 (Tactic number and Technique number) for any others in the Atomic Red Team library. Don’t forget to substitute `ar-win-dc-default-username-38042` for whatever target machine name is in your lab.

To ‘stop’ the lab, run the command:

`python3 attack_range.py stop`

To ‘destroy’ the lab, run the command

`python3 attack_range.py destroy`
