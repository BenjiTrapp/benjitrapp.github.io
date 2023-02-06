---
layout: post
title: Beat IAM Vulnerabilities with ChatGPT
---

<img height="200" align="left" src="/images/chatgpt_meme.jpg" > After playing around with ChatGPT and f.e. created some CloudCustodian policies, Splunk queries and other cool things like unit tests for written code, it's time to move on to something else. Since IAM is the killer feature, but also the killer feature - we could simply use the APIs and get some automated feedback. This isn't entirely automated yet but still a lot of fun to see. The results are nearly always very precise  and astonishing. I used [BishopFox/iam-vulnerable](https://github.com/BishopFox/iam-vulnerable) in a Sandbox, as a proof of concept since I don't want to mess around with my real stuff in combination with an AI.

Anyway here's the Code Snippet, to run it you require boto3 and openai as dependencies:

```python
import os
from typing import Dict, List

import boto3
import openai


def get_role_names() -> List[str]:
    role_names = []

    for response in client.get_paginator('list_roles').paginate():
        role_names.extend([role.get('RoleName') for role in response['Roles']])

    return role_names


def get_policies_attached_to_roles() -> Dict[str, List[Dict[str, str]]]:
    policy_map = {}
    policy_paginator = client.get_paginator('list_attached_role_policies')

    for role_name in get_role_names():
        role_policies = []
        for response in policy_paginator.paginate(RoleName=role_name):
            role_policies.extend(response.get('AttachedPolicies'))
        policy_map.update({role_name: role_policies})

    return policy_map


def check_policy(unchecked_policy):
    response = openai.Completion.create(
        model="text-davinci-003",
        prompt=f'Does this AWS policy have any security vulnerabilities: \n{unchecked_policy}',
        temperature=0.5,
        max_tokens=500,
        top_p=1,
        frequency_penalty=0.0,
        presence_penalty=0.0,
        stream=False
    )
    print(f"ChatGPT Answer:\n {response.choices[0]['text']}")


def get_policy_by_arn(arn):
    return client.get_policy_version(
        PolicyArn=arn,
        VersionId=retrieved_policy['Policy']['DefaultVersionId']
    )


if __name__ == '__main__':
    openai.api_key = os.getenv('OPENAI_KEY', '###ADD_YOUR_OPENAI_API_KEY_HERE###')
    session = boto3.session.Session()
    client = session.client('iam')

    for name, value in get_policies_attached_to_roles().items():
        for policy in value:
            arn = policy['PolicyArn']
            retrieved_policy = get_policy_by_arn(arn)

            print('==================================')
            print(f'{name} -> {arn}\n{retrieved_policy}')
            print(f'{check_policy(retrieved_policy)}')
            print('==================================')
```





