---
layout: memory
title: KinD (Kubernetes in Docker) CheatSheet 
---

<img height="140" align="left" src="/images/kind-logo.png" > 
`kind` is a tool for running local Kubernetes clusters using Docker container “nodes”.
kind was primarily designed for testing Kubernetes itself, but may be used for local development or CI.

Source: [https://kind.sigs.k8s.io/](https://kind.sigs.k8s.io/)

- [Autocompletion](#autocompletion)
  - [Bash](#bash)
  - [ZSH](#zsh)
- [Basic](#basic)
- [Advanced Configuration](#advanced-configuration)
  - [Ports](#ports)
  - [Add Local Registry](#add-local-registry)
      - [Step 1: Create local registry](#step-1-create-local-registry)
    - [Step 2: Create cluster](#step-2-create-cluster)
      - [Step 3: Connect registry with created network](#step-3-connect-registry-with-created-network)
  - [Multiple Workers](#multiple-workers)


## Autocompletion

### Bash
```bash
source <(kind completion bash)
########
## OR ##
########
# Update permanently
echo “source <(kind completion bash) >> ~/.bashrc”
```

### ZSH
```bash
source <(kind completion zsh)
```

## Basic
Create kind cluster named cncf-cheat-sheet
```bash
kind create cluster — name cncf-cheat-sheet
```

Create cluster and wait for all the components to be ready

```bash
kind create cluster — wait 2m
```

Get running clusters

```bash
kind get clusters
```

Delete kind cluster named cncf-cheat-sheet

```bash
kind delete cluster — name cncf-cheat-sheet
```


## Advanced Configuration
Use kind.yaml config file for more advanced use cases

### Ports

Map port 80 from the cluster control plane to the host.

```bash
cat <<EOF | kind create cluster — name cncf-cheat-sheet — config -
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
 extraPortMappings:
 — containerPort: 80
 hostPort: 80
 protocol: TCP
EOF
```

###cMount Directories

Mount current directory into clusters control plane located at `/app`

NOTE: MacOS users: make sure to share resources in docker-for-mac preferences

```bash
cat <<EOF | kind create cluster — name cncf-cheat-sheet — config -
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
 extraMounts:
 — hostPath: .
 containerPath: /app
EOF
```

### Load a Docker Image from Local Registry into KinD Cluster

##### Step 1: Make sure to pull image local registry
Verify with `docker images`if your image is present otherwise pull it with `docker pull <imagename>`

##### Step 2: Load local Image into KinD registry

```bash
kind load docker-image <image_name> --name <name_of_the_kind_cluster>
```

### Add Local Registry

##### Step 1: Create local registry

```bash
docker run -d — restart=always -p 127.0.0.1:5000:5000 — name cncf-cheat-sheet-registry registry:2
```
#### Step 2: Create cluster

```bash
cat <<EOF | kind create cluster — name cncf-cheat-sheet — config -
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
containerdConfigPatches:
- |-
 [plugins.”io.containerd.grpc.v1.cri”.registry.mirrors.”localhost:5000"]
 endpoint = [“http://cncf-cheat-sheet-registry:5000"]
nodes:
- role: control-plane
EOF
```

##### Step 3: Connect registry with created network

```bash
docker network connect kind cncf-cheat-sheet-registry
```
Step 4: Update cluster about new registry

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
 name: local-registry-hosting
 namespace: kube-public
data:
 localRegistryHosting.v1: |
 host: “localhost:5000”
EOF
```

### Multiple Workers

The default configuration will create cluster with one node (control-plane).

```bash
cat <<EOF | kind create cluster — name cncf-cheat-sheet — config -
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
- role: worker
EOF
```

