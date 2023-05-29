---
layout: memory
title: GCP Cheat Sheet
---

Writeup and collection around GCP and some first steps into the Google Cloud

<!-- cSpell:disable -->
- [0.1. References](#01-references)
- [0.2. Other cheatsheets](#02-other-cheatsheets)
- [0.3. Manage multiple gcloud config configurations](#03-manage-multiple-gcloud-config-configurations)
  - [0.3.1. Switch gcloud context with gcloud config](#031-switch-gcloud-context-with-gcloud-config)
- [0.4. Credentials](#04-credentials)
- [0.5. info](#05-info)
- [0.6. projects](#06-projects)
- [0.7. zones \& regions](#07-zones--regions)
- [0.8. Organization](#08-organization)
- [0.9. billing](#09-billing)
- [0.10. IAM](#010-iam)
- [0.11. service account](#011-service-account)
  - [0.11.1. as an identity](#0111-as-an-identity)
  - [0.11.2. service account as a resource](#0112-service-account-as-a-resource)
  - [0.11.3. GCS bucket level](#0113-gcs-bucket-level)
- [0.12. App engine](#012-app-engine)
- [0.13. Cloud Build](#013-cloud-build)
  - [0.13.1. Cloud build trigger GCE rolling replace/start](#0131-cloud-build-trigger-gce-rolling-replacestart)
- [0.14. KMS](#014-kms)
- [0.15. Secret Manager](#015-secret-manager)
- [0.16. Compute Engine](#016-compute-engine)
  - [0.16.1. gcloud command for creating an instance](#0161-gcloud-command-for-creating-an-instance)
  - [0.16.2. list compute images](#0162-list-compute-images)
  - [0.16.3. list an instance](#0163-list-an-instance)
  - [0.16.4. move instance](#0164-move-instance)
  - [0.16.5. ssh \& scp](#0165-ssh--scp)
  - [0.16.6. SSH via IAP](#0166-ssh-via-iap)
  - [0.16.7. ssh port forwarding for elasticsearch](#0167-ssh-port-forwarding-for-elasticsearch)
  - [0.16.8. ssh reverse port forwarding](#0168-ssh-reverse-port-forwarding)
  - [0.16.9. generate ssh config](#0169-generate-ssh-config)
  - [0.16.10. Windows RDP reset windows password](#01610-windows-rdp-reset-windows-password)
  - [0.16.11. debugging](#01611-debugging)
  - [0.16.12. instance level metadata](#01612-instance-level-metadata)
  - [0.16.13. project level metadata](#01613-project-level-metadata)
  - [0.16.14. instances, template, target-pool and instance group](#01614-instances-template-target-pool-and-instance-group)
  - [0.16.15. MIG with startup and shutdown scripts](#01615-mig-with-startup-and-shutdown-scripts)
  - [0.16.16. disk snapshot](#01616-disk-snapshot)
  - [0.16.17. regional disk](#01617-regional-disk)
- [0.17. Networking](#017-networking)
  - [0.17.1. network and subnets](#0171-network-and-subnets)
  - [0.17.2. route](#0172-route)
  - [0.17.3. firewall rules](#0173-firewall-rules)
  - [0.17.4. Network LB](#0174-network-lb)
  - [0.17.5. Global LB](#0175-global-lb)
  - [0.17.6. forwarding-rules](#0176-forwarding-rules)
  - [0.17.7. address](#0177-address)
  - [0.17.8. private service access](#0178-private-service-access)
  - [0.17.9. shared vpc](#0179-shared-vpc)
- [0.18. interconnect](#018-interconnect)
- [0.19. GCP managed ssl certificates](#019-gcp-managed-ssl-certificates)
- [0.20. Cloud logging](#020-cloud-logging)
- [0.21. Service](#021-service)
  - [0.21.1. list service available](#0211-list-service-available)
  - [0.21.2. Enable Service](#0212-enable-service)
- [0.22. Client libraries you can use to connect to Google APIs](#022-client-libraries-you-can-use-to-connect-to-google-apis)
- [0.23. chaining gcloud commands](#023-chaining-gcloud-commands)
- [0.24. one liner to purge GCR images given a date](#024-one-liner-to-purge-gcr-images-given-a-date)
- [0.25. GKE](#025-gke)
  - [0.25.1. create a GKE cluster with label and query it later](#0251-create-a-gke-cluster-with-label-and-query-it-later)
- [0.26. Cloud SQL](#026-cloud-sql)
- [0.27. Cloud Run](#027-cloud-run)
- [0.28 Artifact registry](#028-artifact-registry)
- [0.29. Machine Learning](#029-machine-learning)
## 0.1. References
* [have fun with them](https://cloudplatform.googleblog.com/2016/06/filtering-and-formatting-fun-with.html)
* [projections](https://cloud.google.com/sdk/gcloud/reference/topic/projections)
* [filters](https://cloud.google.com/sdk/gcloud/reference/topic/filters)
* [resource-keys](https://cloud.google.com/sdk/gcloud/reference/topic/resource-keys)
* [scripting-gcloud](https://cloud.google.com/sdk/docs/scripting-gcloud)
* [gcloud alpha interactive](http://cloudplatform.googleblog.com/2018/03/introducing-GCPs-new-interactive-CLI.html)
* https://medium.com/@Joachim8675309/getting-started-with-gcloud-sdk-part-1-114924737
* https://medium.com/@Joachim8675309/getting-started-with-gcloud-sdk-part-2-4d049a656f1a
* https://gist.github.com/bborysenko/97749fe0514b819a5a87611e6aea3db8
* https://about.gitlab.com/blog/2020/02/12/plundering-gcp-escalating-privileges-in-google-cloud-platform/

## 0.2. Other cheatsheets

* https://cloud.google.com/sdk/docs/cheatsheet

## 0.3. Manage multiple gcloud config configurations

* https://www.jhanley.com/google-cloud-understanding-gcloud-configurations/
* https://medium.com/infrastructure-adventures/working-with-multiple-environment-in-gcloud-cli-93b2d4e8cf1e

```bash
gcloud config configurations create pythonrocks
gcloud config configurations list
gcloud config configurations activate pythonrocks
gcloud config set core/account pythonrocks@gmail.com
gcloud projects list
gcloud config set project mygcp-demo
```

### 0.3.1. Switch gcloud context with gcloud config

```bash
gcloud config list
gcloud config set account pythonrocks@gmail.com 
gcloud config set project mygcp-demo
gcloud config set compute/region us-west1
gcloud config set compute/zone us-west1-a
alias demo='gcloud config set account pythonrocks@gmail.com && gcloud config set project mygcp-demo && gcloud config set compute/region us-west1 && gcloud config set compute/zone us-west1-a'

cluster=$(gcloud config get-value container/cluster 2> /dev/null)
zone=$(gcloud config get-value compute/zone 2> /dev/null)
project=$(gcloud config get-value core/project 2> /dev/null)

#switch project based on the name
gcloud config set project $(gcloud projects list --filter='name:wordpress-dev' --format='value(project_id)')

command -v gcloud >/dev/null 2>&1 || { \
 echo >&2 "I require gcloud but it's not installed.  Aborting."; exit 1; }

REGION=$(gcloud config get-value compute/region)
if [[ -z "${REGION}" ]]; then
    echo "https://cloud.google.com/compute/docs/regions-zones/changing-default-zone-region" 1>&2
    echo "gcloud cli must be configured with a default region." 1>&2
    echo "run 'gcloud config set compute/region REGION'." 1>&2
    echo "replace 'REGION' with the region name like us-west1." 1>&2
    exit 1;
fi

```

## 0.4. Credentials

* https://stackoverflow.com/questions/53306131/difference-between-gcloud-auth-application-default-login-and-gcloud-auth-logi/53307505
* https://medium.com/google-cloud/local-remote-authentication-with-google-cloud-platform-afe3aa017b95

```bash
# List all credentialed accounts.
gcloud auth list
# to authenticate with a user identity (via web flow) which then authorizes gcloud and other SDK tools to access Google Cloud Platform.
gcloud auth login
# Display the current account's access token.
gcloud auth print-access-token

gcloud auth application-default login
gcloud auth application-default  print-access-token
# Service Account: to authenticate with a user identity (via a web flow) but using the credentials as a proxy for a service account.
gcloud auth activate-service-account --key-file=sa_key.json
# use GOOGLE_APPLICATION_CREDENTIALS pointing to JSON key

export GCP_REGION="us-east1"
gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev
```

kubectl uses OAuth token generated by 
* `gcloud config config-helper --format='value(credential.access_token)'`


## 0.5. info
```
gcloud info --format flattened
export PROJECT=$(gcloud info --format='value(config.project)')
```

## 0.6. projects

```bash

# create a project
gcloud projects create ${PROJECT_ID} --organization=${ORGANIZATION_ID} --folder=${FOLDER_ID}
# link the project with a given billing account
gcloud beta billing projects link ${PROJECT_ID} --billing-account ${BILLING_ACCOUNT_ID}

# delete a project
gcloud projects delete --quiet ${PROJECT_ID}

# various way to get project_id
PROJECT_ID=$(gcloud config get-value core/project 2>/dev/null)
PROJECT_ID=$(gcloud config list project --format='value(core.project)')
PROJECT_ID=$(gcloud info --format='value(config.project)')

# get project_number
PROJECT_NUMBER=$(gcloud projects list --filter="project_id:${PROJECT_ID}"  --format='value(project_number)')
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
PROJECT_NUMBER=$(gcloud projects list --filter="name:${project_name}"  --format='value(project_number)')
```

```bash
# get uri e.g.
gcloud projects list --uri
```


## 0.7. zones & regions

To return a list of zones given a region

```bash
gcloud compute zones list --filter=region:us-central1
# list regions
gcloud compute regions list
```

## 0.8. Organization

```bash
gcloud organizations list

# for a single org, get its id
ORG_ID=$(gcloud organizations list --format 'value(ID)')

# list top level projects
gcloud projects list --filter "parent.id=$ORG_ID AND  parent.type=organization"

# list top level folders
gcloud resource-manager folders list --organization=$ORG_ID
# list sub folders given upper level folder id
gcloud resource-manager folders list --folder=$FOLDER_ID
# get iam policy for the folder
gcloud resource-manager folders get-iam-policy $FOLDER_ID

# grant roles to a user
ORGANIZATION_ADMIN_ADDRESS='user:developer1@example.com'
gcloud resource-manager folders add-iam-policy-binding ${folder_id} \
  --member=${ORGANIZATION_ADMIN_ADDRESS} \
  --role=roles/resourcemanager.folderAdmin
gcloud resource-manager folders add-iam-policy-binding ${folder_id} \
  --member=${ORGANIZATION_ADMIN_ADDRESS} \
  --role=roles/storage.admin
gcloud resource-manager folders add-iam-policy-binding ${folder_id} \
  --member=${ORGANIZATION_ADMIN_ADDRESS} \
  --role=roles/billing.projectManager
```

## 0.9. billing

```bash
gcloud beta billing accounts list
# enable a billing account with a project, assuming the user or service account has "Billing Account User" role. 
gcloud beta billing projects link ${project_id} \
            --billing-account ${ORGANIZATION_BILLING_ACCOUNT}
```

## 0.10. IAM

* https://github.com/darkbitio/gcp-iam-role-permissions

```bash
# list roles
gcloud iam roles list --filter='etag:AA=='
gcloud iam roles describe roles/container.admin
gcloud iam list-testable-permissions <uri>
e.g gcloud iam list-testable-permissions //cloudresourcemanager.googleapis.com/projects/$PROJECT_ID

gcloud iam list-grantable-roles <uri>
e.g. 
gcloud iam list-grantable-roles //cloudresourcemanager.googleapis.com/projects/$PROJECT_ID
gcloud iam list-grantable-roles https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/zones/us-central1-a/instances/iowa1
```

```
# list custom roles
gcloud iam roles list --project $PROJECT_ID

# create custom role in the following 2 ways, either on project level (--project [PROJECT_ID]) or org level (--organization [ORGANIZATION_ID])
1. gcloud iam roles create editor --project $PROJECT_ID --file role-definition.yaml
2. gcloud iam roles create viewer --project $PROJECT_ID --title "Role Viewer" --description "Custom role description." --permissions compute.instances.get,compu
te.instances.list --stage ALPHA
```

## 0.11. service account

* [When granting IAM roles, you can treat a service account either as a resource or as an identity](https://cloud.google.com/iam/docs/granting-roles-to-service-accounts)

### 0.11.1. as an identity

```bash
export SA_EMAIL=$(gcloud iam service-accounts list \
    --filter="displayName:jenkins" --format='value(email)')
export PROJECT=$(gcloud info --format='value(config.project)')

# create and list sa
gcloud iam service-accounts create jenkins --display-name jenkins
gcloud iam service-accounts list
gcloud iam service-accounts list --filter='email ~ [0-9]*-compute@.*'   --format='table(email)'

# create & list sa key  
gcloud iam service-accounts keys create jenkins-sa.json --iam-account $SA_EMAIL    
gcloud iam service-accounts keys list --iam-account=vault-admin@<project_id>.iam.gserviceaccount.com
gcloud iam service-accounts keys create connect-sa-key.json \
   --iam-account=connect-sa@${PROJECT_ID}.iam.gserviceaccount.com

# get-iam-policy
gcloud projects get-iam-policy ${PROJECT} --flatten="bindings[].members" --filter="bindings.members:serviceAccount:terraform@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects get-iam-policy ${PROJECT} \
    --flatten="bindings[].members" \
    --filter="bindings.members:user:$(gcloud config get-value core/account 2>/dev/null)"

gcloud projects add-iam-policy-binding $PROJECT  --role roles/storage.admin \
    --member serviceAccount:$SA_EMAIL
gcloud projects add-iam-policy-binding $PROJECT --role roles/compute.instanceAdmin.v1 \
    --member serviceAccount:$SA_EMAIL
gcloud projects add-iam-policy-binding $PROJECT --role roles/compute.networkAdmin \
    --member serviceAccount:$SA_EMAIL
gcloud projects add-iam-policy-binding $PROJECT --role roles/compute.securityAdmin \
    --member serviceAccount:$SA_EMAIL
gcloud projects add-iam-policy-binding $PROJECT --role roles/iam.serviceAccountActor \
    --member serviceAccount:$SA_EMAIL

# for Anthos GKE on prem
gcloud projects add-iam-policy-binding ${PROJECT} \
 --member="serviceAccount:connect-sa@${PROJECT}.iam.gserviceaccount.com" \
 --role="roles/gkehub.connect"
```

### 0.11.2. service account as a resource

* https://cloud.google.com/iam/docs/creating-short-lived-service-account-credentials
* https://medium.com/@tanujbolisetty/gcp-impersonate-service-accounts-36eaa247f87c
* https://medium.com/wescale/how-to-generate-and-use-temporary-credentials-on-google-cloud-platform-b425ef95a00d
* https://cloud.google.com/iam/credentials/reference/rest/v1/projects.serviceAccounts/generateAccessToken shows the lifetime of the OAuth token of 3600 seconds by default

```bash
gcloud iam service-accounts get-iam-policy <sa_email>, eg. 
gcloud iam service-accounts get-iam-policy secret-accessor-dev@$PROJECT_ID.iam.gserviceaccount.com --project $PROJECT_ID
bindings:
- members:
  - serviceAccount:<project-id>.svc.id.goog[default/secret-accessor-dev]
  role: roles/iam.workloadIdentityUser
etag: BwWhFqqv9aQ=
version: 1

gcloud iam service-accounts add-iam-policy-binding infrastructure@retviews.iam.gserviceaccount.com --member='serviceAccount:infrastructure@retviews-154908.iam.gserviceaccount.com' --role='roles/iam.serviceAccountActor'
```

We can impersonate service account from a user or another service account, a short-lived token is used instead of service account key.

```bash
# serviceAccount:ansible  impersonate as a svc account terraform@${PROJECT_ID}.iam.gserviceaccount.com
# ${SA_PROJECT_ID} is the global project storing all the service accounts
TF_SA_EMAIL=terraform@${SA_PROJECT_ID}.iam.gserviceaccount.com
ANSIBLE_SA_EMAIL="ansible@${SA_PROJECT_ID}.iam.gserviceaccount.com"
gcloud iam service-accounts add-iam-policy-binding ${TF_SA_EMAIL} \
    --project ${SA_PROJECT_ID} \
    --member "serviceAccount:$ANSIBLE_SA_EMAIL" \
    --role roles/iam.serviceAccountTokenCreator
# create a gcp project $A_PROJECT_ID under $A_FOLDER_ID
gcloud projects --impersonate-service-account=$TF_SA_EMAIL create $A_PROJECT_ID --name=$A_PROJECT_NAME --folder=$A_FOLDER_ID
```

```bash
# user:pythonrocks@gmail.com impersonate as a svc account terraform@${PROJECT_ID}.iam.gserviceaccount.com
TF_SA_EMAIL=terraform@your-service-account-project.iam.gserviceaccount.com
gcloud iam service-accounts add-iam-policy-binding  $TF_SA_EMAIL --member=user:pythonrocks@gmail.com \
--role roles/iam.serviceAccountTokenCreator

gcloud container clusters list --impersonate-service-account=terraform@${PROJECT_ID}.iam.gserviceaccount.com
```


### 0.11.3. GCS bucket level

```bash
gsutil iam get gs://${BUCKET_NAME}  -p ${PROJECT_ID}
COMPUTE_ENGINE_SA_EMAIL=$(gcloud iam service-accounts list --filter="name:Compute Engine default service account" --format "value(email)")
gsutil iam ch serviceAccount:${COMPUTE_ENGINE_SA_EMAIL}:objectViewer gs://${BUCKET_NAME}
```


## 0.12. App engine
* https://medium.com/google-cloud/app-engine-project-cleanup-9647296e796a

## 0.13. Cloud Build

```
# user defined
gcloud builds submit --config=cloudbuild.yaml --substitutions=_BRANCH_NAME=foo,_BUILD_NUMBER=1 .

# override built in TAG_NAME
gcloud builds submit --config=cloudbuild.yaml --substitutions=TAG_NAME=v1.0.1

# cloud build with artifact registry
export GCP_REGION="us-east1"
export TEST_IMAGE="us-docker.pkg.dev/google-samples/containers/gke/hello-app:1.0"
export IMAGE_NAME="hello-app"
export REPO_NAME=team1
export TAG_NAME="tag1"
docker pull $TEST_IMAGE
docker tag $TEST_IMAGE \
    ${GCP_REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:${TAG_NAME}
docker push ${GCP_REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:${TAG_NAME}
# build / push image to artifact registry (using local Dockerfile)
gcloud builds submit --tag ${GCP_REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:${TAG}
```

### 0.13.1. Cloud build trigger GCE rolling replace/start
* https://medium.com/google-cloud/continuous-delivery-in-google-cloud-platform-cloud-build-with-compute-engine-a95bf4fd1821
* https://cloud.google.com/compute/docs/instance-groups/updating-managed-instance-groups#performing_a_rolling_replace_or_restart

```bash
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: [ 'build', '-t', 'gcr.io/$PROJECT_ID/gcp-cloudbuild-gce-angular', '.' ]
- name: 'gcr.io/cloud-builders/gcloud'
  args: [ 'beta', 'compute', 'instance-groups', 'managed', 'rolling-action', 'restart', 'gce-angular-instance-group', '--zone=us-east1-b' ]
images:
- 'gcr.io/$PROJECT_ID/gcp-cloudbuild-gce-angular'

```

## 0.14. KMS

* [cloud-encrypt-with-kms](https://codelabs.developers.google.com/codelabs/cloud-encrypt-with-kms/#0)
* [Integrated with cloud build](https://cloud.google.com/cloud-build/docs/securing-builds/use-encrypted-secrets-credentials)

```bash
# list all keyrings 
gcloud kms keyrings list --location global
# list all keys in my_key_ring
gcloud kms keys list --keyring my_key_ring --location global

# grant KMS IAM permission to a sv account $USER_EMAIL 
gcloud kms keyrings add-iam-policy-binding $KEYRING_NAME \
    --location global \
    --member user:$USER_EMAIL \
    --role roles/cloudkms.admin
gcloud kms keyrings add-iam-policy-binding $KEYRING_NAME \
    --location global \
    --member user:$USER_EMAIL \
    --role roles/cloudkms.cryptoKeyEncrypterDecrypter
    
# Encrypt and Decrypt in REST API
curl -v "https://cloudkms.googleapis.com/v1/projects/$DEVSHELL_PROJECT_ID/locations/global/keyRings/$KEYRING_NAME/cryptoKeys/$CRYPTOKEY_NAME:encrypt" \
  -d "{\"plaintext\":\"$PLAINTEXT\"}" \
  -H "Authorization:Bearer $(gcloud auth application-default print-access-token)"\
  -H "Content-Type:application/json" \
| jq .ciphertext -r > 1.encrypted

curl -v "https://cloudkms.googleapis.com/v1/projects/$DEVSHELL_PROJECT_ID/locations/global/keyRings/$KEYRING_NAME/cryptoKeys/$CRYPTOKEY_NAME:decrypt" \
  -d "{\"ciphertext\":\"$(cat 1.encrypted)\"}" \
  -H "Authorization:Bearer $(gcloud auth application-default print-access-token)"\
  -H "Content-Type:application/json" \
| jq .plaintext -r | base64 -d    
```

## 0.15. Secret Manager

```bash
# create a secret
gcloud secrets create SECRET_NAME --replication-policy="automatic"
#create a secret version
gcloud secrets versions add "SECRET_NAME" --data-file="/path/to/file.txt"
# list
gcloud secrets list
# read
gcloud secrets versions access latest --secret=my_ssh_private_key
#update the labels (metadata) of a secret
gcloud secrets update SECRET_NAME --update-labels=KEY=VALUE
```

## 0.16. Compute Engine

### 0.16.1. gcloud command for creating an instance

from web console
```bash
gcloud compute instances create [INSTANCE_NAME] \
  --image-family [IMAGE_FAMILY] \
  --image-project [IMAGE_PROJECT] \
  --create-disk image=[DISK_IMAGE],image-project=[DISK_IMAGE_PROJECT],size=[SIZE_GB],type=[DISK_TYPE]
  
gcloud compute instances create micro1 --zone=us-west1-a --machine-type=f1-micro --subnet=default --network-tier=PREMIUM --maintenance-policy=MIGRATE --service-account=398028291895-compute@developer.gserviceaccount.com --scopes=https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/trace.append --min-cpu-platform=Automatic --image=debian-9-stretch-v20180510 --image-project=debian-cloud --boot-disk-size=10GB --boot-disk-type=pd-standard --boot-disk-device-name=micro1
```

### 0.16.2. list compute images

```bash
gcloud compute images list --filter=name:debian --uri
https://www.googleapis.com/compute/v1/projects/debian-cloud/global/images/debian-8-jessie-v20180109
https://www.googleapis.com/compute/v1/projects/debian-cloud/global/images/debian-9-stretch-v20180105

# Use the following command to see available non-Shielded VM Windows Server images
gcloud compute images list --project windows-cloud --no-standard-images
# Use the following command to see a list of available Shielded VM images, including Windows images
gcloud compute images list --project gce-uefi-images --no-standard-images
```

### 0.16.3. list an instance

* [filters](https://cloud.google.com/sdk/gcloud/reference/topic/filters)
* [resource-keys](https://cloud.google.com/sdk/gcloud/reference/topic/resource-keys)

```bash
gcloud compute instances list --filter="zone:us-central1-a"
gcloud compute instances list --project=dev --filter="name~^es"
gcloud compute instances list --project=dev --filter=name:kafka --format="value(name,INTERNAL_IP)"
gcloud compute instances list --filter=tags:kafka-node
gcloud compute instances list --filter='machineType:g1-small'

# list gke instances with an autogenerated tag from GKE 
gcloud compute instances list --filter='tags.items:(gke-whatever)'
```

### 0.16.4. move instance

`gcloud compute instances move <instance_wanna_move> --destination-zone=us-central1-a --zone=us-central1-c`

### 0.16.5. ssh & scp

```bash
#--verbosity=debug is great for debugging, showing the SSH command 
# the following is a real word example for running a bastion server that talks to a GKE cluster (master authorized network)
gcloud compute ssh --verbosity=debug <instance_name> --command "kubectl get nodes"

gcloud compute scp  --recurse ../manifest <instance_name>:
```

### 0.16.6. SSH via IAP

* https://cloud.google.com/iap/docs/using-tcp-forwarding

```bash
# find out access-config-name's name
gcloud compute instances describe oregon1
# remove the external IP
gcloud compute instances delete-access-config  oregon1 --access-config-name "External NAT"
# connect via IAP, assuming the IAP is granted to the account used for login. 
gcloud beta compute ssh oregon1 --tunnel-through-iap
```

### 0.16.7. ssh port forwarding for elasticsearch

```bash
gcloud compute --project "foo" ssh --zone "us-central1-c" "elasticsearch-1"  --ssh-flag="-L localhost:9200:localhost:9200"
```
The 2nd `localhost` is relative to  elasticsearch-1`

### 0.16.8. ssh reverse port forwarding 

For example, how to connect to home server's flask server (tcp port 5000) for a demo or a local game server in development.

```bash
GOOGLE_CLOUD_PROJECT=$(gcloud config get-value project)
gcloud compute --project "${GOOGLE_CLOUD_PROJECT}" ssh --zone "us-west1-c" --ssh-flag="-v -N -R :5000:localhost:5000" "google_cloud_bastion_server"
```

### 0.16.9. generate ssh config

```bash
gcloud compute config-ssh
```

### 0.16.10. Windows RDP reset windows password

returns the IP and password for creating the RDP connection. 
```bash
gcloud compute reset-windows-password instance --user=jdoe

ip_address: 104.199.119.166
password:   Ks(;_gx7Bf2d.NP
username:   jode
```



### 0.16.11. debugging

* `gcloud  compute instances list --log-http`
* [serial port debug](https://cloud.google.com/compute/docs/instances/interacting-with-serial-console)

### 0.16.12. instance level metadata

```bash
curl -s "http://metadata.google.internal/computeMetadata/v1/instance/?recursive=true&alt=text" -H "Metadata-Flavor: Google"
leader=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/attributes/leader" -H "Metadata-Flavor: Google")
```

### 0.16.13. project level metadata

```bash
gcloud compute project-info describe
gcloud compute project-info describe --flatten="commonInstanceMetadata[]"
```

### 0.16.14. instances, template, target-pool and instance group

```bash
cat << EOF > startup.sh
#! /bin/bash
apt-get update
apt-get install -y nginx
service nginx start
sed -i -- 's/nginx/Google Cloud Platform - '"\$HOSTNAME"'/' /var/www/html/index.nginx-debian.html
EOF

gcloud compute instance-templates create nginx-template  --metadata-from-file startup-script=startup.sh
gcloud compute target-pools create nginx-pool
gcloud compute instance-groups managed create nginx-group \
         --base-instance-name nginx \
         --size 2 \
         --template nginx-template \
         --target-pool nginx-pool
```

### 0.16.15. MIG with startup and shutdown scripts

https://cloud.google.com/vpc/docs/special-configurations#multiple-natgateways

```bash
gsutil cp gs://nat-gw-template/startup.sh .

gcloud compute instance-templates create nat-1 \
    --machine-type n1-standard-2 --can-ip-forward --tags natgw \
    --metadata-from-file=startup-script=startup.sh --address $nat_1_ip

gcloud compute instance-templates create nat-2 \
    --machine-type n1-standard-2 --can-ip-forward --tags natgw \
    --metadata-from-file=startup-script=startup.sh  --address $nat_2_ip
```
### 0.16.16. disk snapshot

```bash
gcloud compute disks snapshot kafka-data1-1 --async --snapshot-names=kafka-data-1 --project project_a --zone us-west1-a
Use [gcloud compute operations describe URI] command to check the status of the operation(s).
```

### 0.16.17. regional disk

```bash
 gcloud beta compute instance attach-disk micro1 --disk pd-west1 --disk-scope regional
```

## 0.17. Networking
### 0.17.1. network and subnets

```bash
 gcloud compute networks create privatenet --subnet-mode=custom
 gcloud compute networks subnets create privatesubnet-us --network=privatenet --region=us-central1 --range=172.16.0.0/24
 gcloud compute networks subnets create privatesubnet-eu --network=privatenet --region=europe-west1 --range=172.20.0.0/20
 gcloud compute networks subnets list --sort-by=NETWORK
```

### 0.17.2. route

tag the instances with `no-ip`

```bash
gcloud compute instances add-tags existing-instance --tags no-ip
gcloud compute routes create no-ip-internet-route \
    --network custom-network1 \
    --destination-range 0.0.0.0/0 \
    --next-hop-instance nat-gateway \
    --next-hop-instance-zone us-central1-a \
    --tags no-ip --priority 800
```

### 0.17.3. firewall rules

* https://medium.com/@swongra/protect-your-google-cloud-instances-with-firewall-rules-69cce960fba

```bash
# allow SSH, RDP and ICMP for the given network
gcloud compute firewall-rules create managementnet-allow-icmp-ssh-rdp --direction=INGRESS --priority=1000 --network=managementnet --action=ALLOW --rules=tcp:22,3389,icmp --source-ranges=0.0.0.0/0
# allow internal from given source range
gcloud compute firewall-rules create mynetwork-allow-internal --network \
mynetwork --action ALLOW --direction INGRESS --rules all \
--source-ranges 10.128.0.0/9
gcloud compute firewall-rules list --filter="network:mynetwork"

## DENY
gcloud compute firewall-rules create mynetwork-deny-icmp \
--network mynetwork --action DENY --direction EGRESS --rules icmp \
--destination-ranges 10.132.0.2 --priority 500
gcloud compute firewall-rules list \
--filter="network:mynetwork AND name=mynetwork-deny-icmp"

# sort-by
gcloud compute firewall-rules list --sort-by=NETWORK
```

### 0.17.4. Network LB

```bash
gcloud compute firewall-rules create www-firewall --allow tcp:80
gcloud compute forwarding-rules create nginx-lb \
         --region us-central1 \
         --ports=80 \
         --target-pool nginx-pool
         
gcloud compute firewall-rules list --sort-by=NETWORK
```

### 0.17.5. Global LB

* https://cloud.google.com/solutions/scalable-and-resilient-apps

```bash
gcloud compute http-health-checks create http-basic-check
gcloud compute instance-groups managed \
       set-named-ports nginx-group \
       --named-ports http:80

gcloud compute backend-services create nginx-backend \
      --protocol HTTP --http-health-checks http-basic-check --global
      
gcloud compute backend-services add-backend nginx-backend \
    --instance-group nginx-group \
    --instance-group-zone us-central1-a \
    --global  

gcloud compute url-maps create web-map \
    --default-service nginx-backend

gcloud compute target-http-proxies create http-lb-proxy \
    --url-map web-map
    
gcloud compute forwarding-rules create http-content-rule \
        --global \
        --target-http-proxy http-lb-proxy \
        --ports 80
gcloud compute forwarding-rules list

```

### 0.17.6. forwarding-rules

```bash
gcloud compute forwarding-rules list --filter=$(dig +short <dns_name>)
gcloud compute forwarding-rules describe my-forwardingrule --region us-central1
gcloud compute forwarding-rules describe my-http-forwardingrule --global
```

### 0.17.7. address

```bash
# get the external IP address of the instance
gcloud compute instances describe single-node \
     --format='value(networkInterfaces.accessConfigs[0].natIP)
     
gcloud compute addresses describe https-lb --global --format json

# list all IP addresses
gcloud projects list --format='value(project_id)' | xargs -I {} gcloud compute addresses list --format='value(address)' --project {}  2>/dev/null | sort | uniq -c
```

### 0.17.8. private service access

Useful for services like Cloud SQL and Redis, peering between a custom VPC to a managed VPC by google.
```bash
gcloud services vpc-peerings list --network=my-vpc
```

### 0.17.9. shared vpc

```bash
# Enable shared-vpc in '${NETWORK_PROJECT_ID}'
gcloud services enable --project ${NETWORK_PROJECT_ID} compute.googleapis.com
gcloud compute shared-vpc enable ${NETWORK_PROJECT_ID}

# Associate a service project with '${NETWORK_PROJECT_ID}'
gcloud services enable --project ${PLATFORM_PROJECT_ID} compute.googleapis.com
gcloud compute firewall-rules delete --project ${PLATFORM_PROJECT_ID} --quiet default-allow-icmp default-allow-internal default-allow-rdp default-allow-ssh
gcloud compute networks delete --project ${PLATFORM_PROJECT_ID} --quiet default
gcloud compute shared-vpc associated-projects add ${PLATFORM_PROJECT_ID} --host-project ${NETWORK_PROJECT_ID}

## Disassociate a service project from host project.
gcloud compute shared-vpc associated-projects remove ${PLATFORM_PROJECT_ID} --host-project ${NETWORK_PROJECT_ID}
```

## 0.18. interconnect

```bash
# list Google Compute Engine interconnect locations
gcloud compute interconnects locations list
```

## 0.19. GCP managed ssl certificates

```bash
gcloud compute ssl-certificates create example-mydomain --domains example.mydomain.com
gcloud compute ssl-certificates list
gcloud compute ssl-certificates describe example-mydomain
# It takes 30mins+ to provision the TLS, one of conditions is the target-https-proxies needs to be associated with the cert.
gcloud beta compute target-https-proxies list
```


## 0.20. Cloud logging

```
gcloud logging read "timestamp >= \"2018-04-19T00:30:00Z\"  and logName=projects/${project_id}/logs/requests and resource.type=http_load_balancer" --format="csv(httpRequest.remoteIp,httpRequest.requestUrl,timestamp)" --project=${project_id}
```

## 0.21. Service

### 0.21.1. list service available

`gcloud services list --available`

### 0.21.2. Enable Service

```bash
# chain 
gcloud services enable cloudapis.googleapis.com && \
cloudresourcemanager.googleapis.com && \
compute.googleapis.com 

# or not chain
gcloud services enable container.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable storage-component.googleapis.com
gcloud services enable sourcerepo.googleapis.com
```

```bash
function enable-service() {
  SERVICE=$1
  if [[ $(gcloud services list --format="value(config.name)" \
                                --filter="config.name:$SERVICE" 2>&1) != \
                                "$SERVICE" ]]; then
    echo "Enabling $SERVICE"
    gcloud services enable $SERVICE
  else
    echo "$SERVICE is already enabled"
  fi
}

enable-service container.googleapis.com
```

## 0.22. Client libraries you can use to connect to Google APIs

* https://medium.com/google-cloud/simple-google-api-auth-samples-for-service-accounts-installed-application-and-appengine-da30ee4648


## 0.23. chaining gcloud commands

```bash
gcloud compute forwarding-rules list --format 'value(NAME)' \
| xargs -I {}  gcloud compute forwarding-rules delete {}  --region us-west1 -q

gcloud projects list --format='value(project_id)' \
| xargs -I {} gcloud compute addresses list --format='value(address)' --project {}  2>/dev/null | sort | uniq -c

gcloud compute instances list --filter=elasticsearch --format='value(NAME)' \
| xargs -I {} -p gcloud compute instances stop {}
gcloud compute instances list --filter=elasticsearch --format='value(INTERNAL_IP)' \
| xargs -I {} ssh {} "sudo chef-client"

# delete non default routes
gcloud compute routes list --filter="NOT network=default" --format='value(NAME)' \
| xargs -I {} gcloud compute routes delete -q {}
```

## 0.24. one liner to purge GCR images given a date

```bash
DATE=2018-10-01
IMAGE=<project_id>/<image_name>
gcloud container images list-tags gcr.io/$IMAGE --limit=unlimited --sort-by=TIMESTAMP   \
--filter="NOT tags:* AND timestamp.datetime < '${DATE}'" --format='get(digest)' | \
while read digest;do gcloud container images delete -q --force-delete-tags gcr.io/$IMAGE@$digest ;done
```
## 0.25. GKE

```bash
# create a private cluster
gcloud container clusters create private-cluster \
    --private-cluster \
    --master-ipv4-cidr 172.16.0.16/28 \
    --enable-ip-alias \
    --create-subnetwork ""


gcloud compute networks subnets create my-subnet \
    --network default \
    --range 10.0.4.0/22 \
    --enable-private-ip-google-access \
    --region us-central1 \
    --secondary-range my-svc-range=10.0.32.0/20,my-pod-range=10.4.0.0/14

gcloud container clusters create private-cluster2 \
    --private-cluster \
    --enable-ip-alias \
    --master-ipv4-cidr 172.16.0.32/28 \
    --subnetwork my-subnet \
    --services-secondary-range-name my-svc-range \
    --cluster-secondary-range-name my-pod-range
 
 gcloud container clusters update private-cluster2 \
    --enable-master-authorized-networks \
    --master-authorized-networks <external_ip_of_kubectl_instance>
```

```bash
# create a GKE cluster with CloudRun,Istio, HPA enabled
gcloud beta container clusters create run-gke \
  --addons HorizontalPodAutoscaling,HttpLoadBalancing,Istio,CloudRun \
  --scopes cloud-platform \
  --zone us-central1-a \
  --machine-type n1-standard-4 \
  --enable-stackdriver-kubernetes \
  --no-enable-ip-alias
```

```bash
export WORKLOAD_POOL=${PROJECT_ID}.svc.id.goog
export MESH_ID="proj-${PROJECT_NUMBER}"
gcloud bea container clusters create ${CLUSTER_NAME} \
    --machine-type=n1-standard-4 \
    --num-nodes=4 \
    --workload-pool=${WORKLOAD_POOL} \
    --enable-stackdriver-kubernetes \
    --subnetwork=default  \
    --labels mesh_id=${MESH_ID}
```


```bash
# create a VPC native cluster
gcloud container clusters create k1 \
--network custom-ip-vpc --subnetwork subnet-alias \
--enable-ip-alias --cluster-ipv4-cidr=/16   --services-ipv4-cidr=/22

gcloud container clusters describe mycluster --format='get(endpoint)'

# generate a ~/.kube/config for private cluster with private endpoint
gcloud container clusters get-credentials private-cluster --zone us-central1-a --internal-ip
```

### 0.25.1. create a GKE cluster with label and query it later

```
gcloud container clusters create example-cluster --labels env=dev
gcloud container clusters list --filter resourceLabels.env=dev 
```

## 0.26. Cloud SQL

* https://www.qwiklabs.com/focuses/1157?parent=catalog

```bash
gcloud sql instances create flights \
    --tier=db-n1-standard-1 --activation-policy=ALWAYS
gcloud sql users set-password root --host % --instance flights \
 --password Passw0rd

# authorizes the IP
export ADDRESS=$(wget -qO - http://ipecho.net/plain)/32
gcloud sql instances patch flights --authorized-networks $ADDRESS

## mysql cli to creat table
MYSQLIP=$(gcloud sql instances describe \
flights --format="value(ipAddresses.ipAddress)")
mysql --host=$MYSQLIP --user=root \
      --password --verbose < create_table.sql
## import data in csv
mysqlimport --local --host=$MYSQLIP --user=root --password \
--ignore-lines=1 --fields-terminated-by=',' bts flights.csv-*
mysql --host=$MYSQLIP --user=root  --p 
```

## 0.27. Cloud Run

```bash
# deploy a service on Cloud Run in us-central1 and allow unauthenticated user
gcloud run deploy --image gcr.io/${PROJECT-ID}/helloworld --platform managed --region us-central1 --allow-unauthenticated

# list services
gcloud run services list
# get endpoint url for a service
gcloud run services describe <service_name> --format="get(status.url)"

export SA_NAME="cloud-scheduler-runner"
export SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# create service account
gcloud iam service-accounts create $SA_NAME \
    --display-name "${SA_NAME}"

# add sa binding to cloud run app
gcloud run services add-iam-policy-binding $APP_DIR \
    --platform managed \
    --region $GCP_REGION \
    --member=serviceAccount:$SA_EMAIL \
    --role=roles/run.invoker
# fetch the service URL
export APP="helloworld"
export SVC_URL=$(gcloud run services describe $APP --platform managed --region $GCP_REGION --format="value(status.url)")

# create the job to hit URL every 1 minute
gcloud scheduler jobs create http test-job --schedule "*/1 * * * *" \
    --http-method=GET \
    --uri=$SVC_URL \
    --oidc-service-account-email=$SA_EMAIL \
    --oidc-token-audience=$SVC_URL

export GCP_REGION="us-east1" 
export SERVICE_NAME="hello-service"
# deploy app to Cloud Run
gcloud run deploy $SERVICE_NAME \
    --platform managed \
    --region $GCP_REGION \
    --allow-unauthenticated \
    --image ${GCP_REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:${TAG_NAME}

# confirm service is running
gcloud run services list \
    --platform managed \
    --region $GCP_REGION
# test URL
export SVC_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $GCP_REGION --format="value(status.url)")

curl -X GET $SVC_URL
# Hello, world!
# Version: 1.0.0
# Hostname: localhost
```

## 0.28 Artifact registry

```bash
export REPO_NAME=team1
export GCP_REGION="us-east1" 

gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$GCP_REGION \
    --description="Docker repository"

# configure auth
gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev
```


## 0.29. Machine Learning

```bash
brew install bat
gcloud ml language analyze-entities --content="Michelangelo Caravaggio, Italian painter, is known for 'The Calling of Saint Matthew'." | bat  -l json
```

<!-- cSpell:enable -->
