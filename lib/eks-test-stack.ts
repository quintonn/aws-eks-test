import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_ec2 as ec2,
  aws_eks as eks,
  aws_rds as rds,
  aws_ecr as ecr,
  RemovalPolicy,
  lambda_layer_kubectl as kubectl,
} from 'aws-cdk-lib';

import * as bcrypt from "bcrypt";

const DB_PORT_NUMBER: number = 5432;
const APP_PREFIX = "CDK_TEST";
const ENVIRONMENT_NAME = "Test";

export class CreateAwsResourcesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // Create stack

    // Create a new VPC for our cluster
    const vpc = new ec2.Vpc(this, `${APP_PREFIX}-Vpc-${ENVIRONMENT_NAME}`, {
      enableDnsSupport: true,
      enableDnsHostnames: true,
    });

    // Create the security group
    const securityGroup = new ec2.SecurityGroup(this, `${APP_PREFIX}-SecurityGroup-${ENVIRONMENT_NAME}`, {
      securityGroupName: `${APP_PREFIX}-SecurityGroup-${ENVIRONMENT_NAME}`,
      vpc,
      description: 'Allow connections in',
      allowAllOutbound: true,
    });

    // Open the Postgres port to allow testing/debugging

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(DB_PORT_NUMBER), 'Allow Incoming Access for Postgres');


    securityGroup.node.addDependency(vpc);

    // EKS cluster
    const eksCluster = new eks.Cluster(this, `${APP_PREFIX}-EKS-Cluster-${ENVIRONMENT_NAME}`, {
      clusterName: `${APP_PREFIX}-EKS-Cluster-${ENVIRONMENT_NAME}`,
      vpc: vpc,
      defaultCapacity: 0,  // we want to manage capacity our selves
      version: eks.KubernetesVersion.of('1.26'),
      kubectlLayer: new kubectl.KubectlLayer(this, `${APP_PREFIX}-EKS-KubeCtlLayer`),
      securityGroup: securityGroup,
    });

    eksCluster.node.addDependency(vpc, securityGroup);

    // EKS nodegroup
    const nodeGroup = new eks.Nodegroup(this, `eks-default-node-group-${ENVIRONMENT_NAME}`, {
      nodegroupName: `eks-default-node-group-${ENVIRONMENT_NAME}`,
      cluster: eksCluster,
      amiType: eks.NodegroupAmiType.AL2_X86_64,
      instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM)],
      diskSize: 20,
      desiredSize: 2,
      minSize: 2,
      maxSize: 5
    });

    // Setup Argo CD
    // set admin password
    const temp_password = bcrypt.hashSync("password", 10);

    // Add ArgoCD Helm Chart
    const ecrUrl = `${this.account}.dkr.ecr.${this.region}.amazonaws.com`;

    eksCluster.addHelmChart(`argo-cd-helm-chart-${ENVIRONMENT_NAME}`, {
      repository: "https://argoproj.github.io/argo-helm",
      chart: "argo-cd",
      release: "argo-cd",
      values: {
        global: {
          logging: {
            format: "json",
            level: "info"
          },
          additionalLabels: {
            "tags.datadoghq.com/env": ENVIRONMENT_NAME,
            "tags.datadoghq.com/service": "eks-test",
            "tags.datadoghq.com/version": "5.23.2",
          }
        },
        configs: {
          secret: {
            argocdServerAdminPassword: temp_password,
            argocdServerAdminPasswordMtime: "2020-01-01T10:01:10Z", // must be set to some time in the past
            extra: {
              "accounts.deployment-service.password": temp_password,
              "accounts.grant-service.password": temp_password,
              "accounts.tenant-service.password": temp_password
            }
          },
          cm: {
            "accounts.deployment-service": "apiKey, login",
            "accounts.grant-service": "apiKey, login",
            "accounts.tenant-service": "apiKey, login",
          },
          rbac: {
            "policy.csv": "p, role:app-creator, clusters, get, *, allow\np, role:app-creator, projects, get, */*, allow\np, role:app-creator, repositories, get, *, allow\np, role:app-creator, applications, *, */*, allow\ng, deployment-service, role:app-creator\ng, grant-service, role:app-creator\ng, tenant-service, role:app-creator"
          },
          params: {
            "server.insecure": "true"
          },
          repositories: {
            "eks-test-ecr": {
              "url": ecrUrl,
              "name": "eks-test-ecr",
              "type": "helm",
              "enableOCI": "true",
              "plaintext": "true",
              "username": "AWS"
            }
          }
        }
      },
      namespace: "argocd",
      version: '5.23.2',
    });

    // Add Istio
    eksCluster.addHelmChart(`istio-base-helm-chart-${ENVIRONMENT_NAME}`, {
      repository: "https://istio-release.storage.googleapis.com/charts",
      chart: "base",
      release: "istio-base",
      namespace: "istio-system",
      version: '1.17.1',
    });
    eksCluster.addHelmChart(`istio-discovery-helm-chart-${ENVIRONMENT_NAME}`, {
      repository: "https://istio-release.storage.googleapis.com/charts",
      chart: "istiod",
      release: "istio-discovery",
      namespace: "istio-system",
      version: '1.17.1',
    });
    eksCluster.addHelmChart(`istio-gateway-helm-chart-${ENVIRONMENT_NAME}`, {
      repository: "https://istio-release.storage.googleapis.com/charts",
      chart: "gateway",
      release: "istio-ingressgateway",
      namespace: "istio-system",
      version: '1.17.1',
    });



    // add istio namespace label to 'argocd' namespace:
    // i.e. kubectl label namespace argocd istio-injection=enabled
    eksCluster.addManifest('default-namespace', {
      "apiVersion": "v1",
      "kind": "Namespace",
      "metadata": {
        "name": "argocd",
        "labels": {
          "istio-injection": "enabled"
        }
      }
    });

    // Create DB admin secret
    const dbAdminCredential = rds.Credentials.fromGeneratedSecret('postgres', { secretName: `${APP_PREFIX}-EKS-admin-db-password-${ENVIRONMENT_NAME}` });

    // RDK Postgress instance
    const db = new rds.DatabaseInstance(this, `EKS-DB-TEST`, {
      instanceIdentifier: `EKS-DB-TEST`,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      },
      securityGroups: [securityGroup],
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_14_5 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      storageType: rds.StorageType.GP2,
      autoMinorVersionUpgrade: false, // maybe enable for prod?
      backupRetention: cdk.Duration.days(0), // 0 disables it
      maxAllocatedStorage: 200,
      publiclyAccessible: true,
      credentials: dbAdminCredential
    });

    db.node.addDependency(vpc, securityGroup);
    if (dbAdminCredential.secret) {
      db.node.addDependency(dbAdminCredential.secret);
    }


    allowBitBucketIpInbound(this, securityGroup, props);


    // createCustomResourceForDbSetup(this, vpc, db, securityGroup, props); // create postgres DB

    // create ECR instances
    new ecr.Repository(this, 'eks-test-test-service-1', {
      removalPolicy: RemovalPolicy.DESTROY,
      repositoryName: 'eks-test/test-service-1'
    });
    new ecr.Repository(this, 'eks-test-test-service-2', {
      removalPolicy: RemovalPolicy.DESTROY,
      repositoryName: 'eks-test/test-service-2'
    });
    new ecr.Repository(this, 'eks-test-test-service-3', {
      removalPolicy: RemovalPolicy.DESTROY,
      repositoryName: 'eks-test/test-service-3'
    });
    new ecr.Repository(this, 'eks-test-test-service-4', {
      removalPolicy: RemovalPolicy.DESTROY,
      repositoryName: 'eks-test/test-service-4'
    });
    new ecr.Repository(this, 'eks-test-test-service-5', {
      removalPolicy: RemovalPolicy.DESTROY,
      repositoryName: 'eks-test/test-service-5'
    });

    // output DB endpoint
    new cdk.CfnOutput(this, 'DB Endpoint', { value: db.dbInstanceEndpointAddress });
  }
}

function allowBitBucketIpInbound(stack: CreateAwsResourcesStack, securityGroup: ec2.SecurityGroup, props: cdk.StackProps) {
  // from here: https://support.atlassian.com/bitbucket-cloud/docs/what-are-the-bitbucket-cloud-ip-addresses-i-should-use-to-configure-my-corporate-firewall/
  const allowedIps = ['104.192.136.0/21', '185.166.140.0/22', '18.205.93.0/25', '18.234.32.128/25', '13.52.5.0/25'];

  allowedIps.forEach(a => {
    securityGroup.addIngressRule(ec2.Peer.ipv4(a), ec2.Port.tcp(DB_PORT_NUMBER), `Allow BitBucket Cloud IP Address: ${a}`);
  });
}
