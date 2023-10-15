---
layout: memory
title: Cloud Provider Cheatsheet
---

This guide is only representative from my point of view and it may not be accurate and you should go on the official [AWS](http://aws.amazon.com/) & [GCP](https://cloud.google.com/) websites for accurate and detailed information. It's initially inspired by [AWS in simple English](http://expeditedssl.com/aws-in-plain-english) and [GCP for AWS professionals](https://cloud.google.com/docs/google-cloud-platform-for-aws-professionals). The idea is to compare both services, give simple one-line explanation and examples with other software that might have similar capabilities.


Category | Service | AWS | GCP | Description | It's like
:-- | :--: | :--: | :--: | :--: | :--:
Compute | IaaS | Amazon Elastic Compute Cloud (EC2)	 | Google Compute Engine | Type-1 virtual servers | VMware ESXi, Citrix XenServer
&nbsp; | PaaS | AWS Elastic Beanstalk	| Google App Engine | Running your app on a platform | Heroku, BlueMix, Modulus
&nbsp; | Containers | Amazon Elastic Compute Cloud Container Service | Google Container Engine | Run your app inside container instead of server | Docker
&nbsp; | Compute Service | Amazon Lambda | Google Cloud Functions | Run event-driven code
Network | Load Balancer | Elastic Load Balancer (ELB) | Google Compute Engine Load Balancer | Standard load balancing | Zen Load Balancer, HaProxy, 
&nbsp; | Peering | Direct Connect | Google Cloud Interconnect | Dedicated connection | DC++
&nbsp; | DNS | AWS Route 53 | Google Cloud DNS | Managed DNS Service | BIND
Storage | Object Storage | Amazon Simple Storage Service (S3) | Google Cloud Storage | Managed Block Storage with API access | OpenStack Block Storage, Ceph Block Storage
&nbsp; | Block Storage | Amazon Elastic Block Store (EBS) | Google Compute Engine Persistent Disks
&nbsp; | Cold Storage | Amazon Glacier | Google Cloud Storage Nearline
&nbsp; | File Storage | Amazon Elastic File System | ZFS / Avere
Database | RDBMS | Amazon Relational Database Service (RDS) | Google Cloud SQL | Relational database | MySQL, Postgres, MSSQL
&nbsp; | NoSQL: Key-value | Amazon DynamoDB | Google Cloud Bigtable | Key-value NoSQL database| Redis, CouchDB
&nbsp; | NoSQL: Indexed | Amazon SimpleDB | Google Cloud Datastore | Indexed NoSQL database | Apache Cassandra, MongoDB
Big Data & Analytics | Batch Data Processing | Amazon Elastic Map Reduce | Google Cloud Dataproc, Google Cloud Dataflow
&nbsp; | Stream Data Processing | Amazon Kinesis | Google Cloud Dataflow
&nbsp; | Stream Data Ingest | Amazon Kinesis | Google Cloud Pub/Sub
&nbsp; | Analytics | Amazon Redshift | Google BigQuery
Application Services | Messaging | Amazon Simple Notification Service | Google Cloud Pub/Sub
&nbsp; | Data Sync | Amazon Cognito | Google Firebase
&nbsp; | Mobile Backend | Amazon Cognito | Google Cloud Endpoints, Google Firebase
Management Services | Monitoring | Amazon CloudWatch | Google Cloud Monitoring
&nbsp; | Deployment | AWS CloudFormation | Google Cloud Deployment Manager
&nbsp; | Monitoring | AWS CloudFormation | Google Cloud Deployment Manager
&nbsp; | Monitoring | AWS CloudFormation | &nbsp; | 
Security | SSL | Amazon Certificate Manager (ACM) | &nbsp; | Managed SSL Certificates | Let's encrypt
