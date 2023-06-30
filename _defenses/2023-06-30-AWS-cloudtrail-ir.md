---
layout: defense
title: AWS CloudTrail events for Incident Response
---

Writeup of critical CloudTrail events, that can be used for Incident Response purposes or Detection Engineering

| Initial Access | Execution | Persistence | Privilege Escalation | Defense Evasion | Credential Access | Discovery | Lateral Movement | Exfiltration | Impact |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ConsoleLogin | StartInstance | CreateAccessKey | CreateGroup | StopLogging | GetSecretValue | ListUsers | AssumeRole | CreateSnapShot | PutBucketVersioning |
| PasswordRecoveryRequested | StartInstances | CreateUser | CreateRole | DeleteTrail | GetPasswordData | ListRoles | SwitchRole | ModifySnapshotAttributes  | RunInstances |
|  | Invoke | CreateNetworkAclEntry | UpdateAccessKey | UpdateTrail | RequestCertificate | ListIdentities |  | ModifyImageAttribute | DeleteAccountPublicAccessBlock  |
|  | SendCommand | CreateRoute | PutGroupPolicy | PutEventSelectors | UpdateAssumeRolePolicy | ListAccessKeys |  | SharedSnapshotCopyInitiated |  |
|  |  | CreateLoginProfile | PutRolePolicy | DeleteFlowLogs |  | ListServiceQuotas |  | SharedSnapshotVolumeCreated |  |
|  |  | AuthorizeSecurityGroupEgress | PutUserPolicy | DeleteDetector |  | ListInstanceProfiles |  | ModifyDBSnapshotAttribute |  |
|  |  | AuthorizeSecurityGroupIngress | AddRoleToInstanceProfile | DeleteMembers |  | ListBuckets |  | PutBucketPolicy |  |
|  |  | CreateVirtualMFADevice | AddUserToGroup | DeleteSnapshot |  | ListGroups |  | PutBucketAcl |  |
|  |  | CreateConnection |  | DeactivateMFADevice |  | GetSendQuota |  |  |  |
|  |  | ApplySecurityGroupsToLoadBalancer |  | DeleteCertificate |  | GetCallerIdentity |  |  |  |
|  |  | SetSecurityGroups |  | DeleteConfigRule |  | DescribeInstances |  |  |  |
|  |  | AuthorizeDBSecurityGroupIngress |  | DeleteAccessKey |  | GetBucketAcl |  |  |  |
|  |  | CreateDBSecurityGroup |  | LeaveOrganization |  | GetBucketVersioning |  |  |  |
|  |  | ChangePassword |  | DisassociateFromMasterAccount |  | GetAccountAuthorizationDetails |  |  |  |
|  |  |  |  | DisassociateMembers |  |  |  |  |  |
|  |  |  |  | StopMonitoringMembers |  |  |  |  |  |
