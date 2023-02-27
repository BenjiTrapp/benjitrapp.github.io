---
layout: defense
title: Linux Hardening - etckeeper
---
<!-- cSpell:disable -->

## etckeeper

A versioning of configuration directories is meaningful from documentation and backup view. Thus all changes to configuration files are logged and versioned, in addition earlier versions can be restored in the case of error. Completely without caution these features are not to be enjoyed, since protectable information is in the etc directory. Encryption and restrictive file permissions when transferring or backing up the repo in which the etc directory is versioned should therefore be taken into account. This article shows the versioning with the software etckeeper with git.
Table of Contents


### Install etckeeper

The source code of etckeeper can be obtained from the etckeeper git repository (etckeeper.branchable.com). On Ubuntu, it is recommended to install from the repositories:

```bash
sudo apt-get install git 
sudo apt-get install etckeeper
```

### Configure etckeeper

Enter Git in the etckeeper configuration:

```bash
sudo vi /etc/etckeeper/etckeeper.conf
```

# The VCS to use.
#VCS="hg"
VCS="git"
#VCS="bzr"
#VCS="darcs"
[...]

Other important options are AVOID_DAILY_AUTOCOMMITS and AVOID_COMMIT_BEFORE_INSTALL. These are both disabled by default. If you are more involved with etckeeper and want to create meaningful commits for all changes, you should enable them.

AVOID_DAILY_AUTOCOMMITS=1
AVOID_COMMIT_BEFORE_INSTALL=1

Before the first initialization the following GIT settings (see Git basic commands#Configuration of user and email information) should be done. Otherwise, when using git together with sudo, there may be a problem that "root" is always entered as the committer.

:~$ git config --global user.name "Test User"
:~$ git config --global user.email "tktest@example.com"
:~$ git config --global core.editor "vim"

After that the repository can be initialized:

:~$ cd /etc/
:/etc$ sudo etckeeper init
Initialized empty Git repository in /etc/.git/

On the first commit, all existing files in etc will be added to the repo and versioned from now on:

:/etc$ sudo etckeeper commit "Initial etc commit".

Using etckeeper

If a file is now edited, the changes are logged using Git:

:/etc$ sudo vi /etc/phpmyadmin/apache.conf 
:/etc$ sudo git status
# On branch master
# Changes not staged for commit:
# (use "git add <file>..." to update what will be committed)
# (use "git checkout -- <file>..." to discard changes in working directory)
#
# modified: phpmyadmin/apache.conf
#
no changes added to commit (use "git add" and/or "git commit -a")

The change can then be discarded or committed to the repo:

:/etc# git commit -a -m "Changed phpmyadmin apache.conf"
[master d589a0a] Changed phpmyadmin apache.conf
[...]
:/etc# git log
commit d589a0a6dfecbb19a5e24be0d6f3a02d2e915d28
Author: root <root@icinga.(none)>
Date: Thu Nov 8 15:21:53 2012 +0100

    Changed phpmyadmin apache.conf
[...]

File/Directory Metadata

Since git itself does not record complete file/directory metadata, a pre-commit hook (/etc/.git/hooks/pre-commit) was introduced by etckeeper. This records in the file /etc/.etckeeper the chmod and chgrp commands for all files that do not match the default permissions.

...
maybe chmod 0755 './apticron'
maybe chmod 0644 './apticron/apticron.conf'
maybe chgrp daemon './at.deny'
maybe chmod 0640 './at.deny
maybe chmod 0644 './bash.bashrc
maybe chmod 0644 './bash_completion
maybe chmod 0755 './bash_completion.d
...

Add file to gitignore

Files that should not be versioned by git in the /etc/ directory are added to the /etc/.gitignore file. This already contains a list of files that are excluded from etckeeper by default. After the paths managed by etckeeper - marked by a comment # end section managed by etckeeper, the own paths are entered. The following example excludes the vmware-tools' folder of a VMware guest machine from versioning:

:/etc$ sudo vi .gitignore
[...]
# end section managed by etckeeper
# begin manually added section
vmware-tools/*

Since the files are already in the index, they need to be removed from it - git status still shows that vmware-tools/locations would have changed. A git rm --cached only removes the file from the index and leaves the file itself untouched:[2]

:/etc$ sudo git rm --cached vmware-tools/locations
rm 'vmware-tools/locations'
:/etc$ sudo git add .gitignore
:/etc$ sudo git status
# On branch master
# Changes to be committed:
# (use "git reset HEAD <file>..." to unstage)
#
# modified: .gitignore
# deleted: vmware-tools/locations
#
:/etc$ sudo git commit -a -m "Removed vmware-tools"
[master 79111f9] Removed vmware-tools
 3 files changed, 3 insertions(+), 4082 deletions(-)
 delete mode 100644 vmware-tools/locations

Testing configuration changes in a branch

If you want to test new configurations of files in /etc, you can create your own Git branch. In this example, we call it no-apt-sources for testing an apt configuration without src repositories. We then use git checkout to switch to the branch:

sudo git branch no-apt-sources
sudo git checkout no-apt-sources

Now we make changes to the apt configuration and then run a git commit to version the change:

sudo vi /etc/apt/sources.list
sudo git commit -a

After testing, we switch back to the master branch:

sudo git checkout master

Now we have 2 options:

    We want to commit the change we made. To do this, we run a git merge for the branch and then delete the branch that is now no longer needed:

        sudo git merge no-apt-sources

        sudo git branch -d no-apt-sources

    We want to permanently discard the changes. Note: this will completely delete the branch we created earlier:

        sudo git branch -D no-apt-sources

Itemize

etckeeper git repository (etckeeper.branchable.com)
git-rm documentation (kernel.org)
<!-- cSpell:enable -->