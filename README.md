# Test to replicate bug I've been running into

Run:  
`cdk deploy --require-approval=never`  

You may need to set profile, region and/or account, depending on your configuration.  
I use the --profile flag as I have multiple AWS account settings configured.  


My CDK Deploy fails with the following:  
```
EksTestStack | 55/62 | 10:36:17 | CREATE_IN_PROGRESS   | Custom::AWSCDK-EKS-HelmChart                | CDK_TEST-EKS-Cluster-Test/chart-argo-cd-helm-chart-Test/Resource/Default (CDKTESTEKSClusterTestchartargocdhelmchartTestFBC822FD)
EksTestStack | 55/62 | 10:36:17 | CREATE_IN_PROGRESS   | Custom::AWSCDK-EKS-HelmChart                | CDK_TEST-EKS-Cluster-Test/chart-istio-base-helm-chart-Test/Resource/Default (CDKTESTEKSClusterTestchartistiobasehelmchartTest595C9706)
EksTestStack | 55/62 | 10:36:17 | CREATE_IN_PROGRESS   | Custom::AWSCDK-EKS-KubernetesResource       | CDK_TEST-EKS-Cluster-Test/manifest-default-namespace/Resource/Default (CDKTESTEKSClusterTestmanifestdefaultnamespaceFC04B4F9)
EksTestStack | 55/62 | 10:36:17 | CREATE_IN_PROGRESS   | Custom::AWSCDK-EKS-HelmChart                | CDK_TEST-EKS-Cluster-Test/chart-istio-discovery-helm-chart-Test/Resource/Default (CDKTESTEKSClusterTestchartistiodiscoveryhelmchartTestE6D506ED)
EksTestStack | 55/62 | 10:36:17 | CREATE_IN_PROGRESS   | Custom::AWSCDK-EKS-HelmChart                | CDK_TEST-EKS-Cluster-Test/chart-istio-gateway-helm-chart-Test/Resource/Default (CDKTESTEKSClusterTestchartistiogatewayhelmchartTest4A114B06)
EksTestStack | 55/62 | 10:36:17 | CREATE_IN_PROGRESS   | Custom::AWSCDK-EKS-KubernetesResource       | CDK_TEST-EKS-Cluster-Test/AwsAuth/manifest/Resource/Default (CDKTESTEKSClusterTestAwsAuthmanifest30F0E99E)
EksTestStack | 55/62 | 10:36:24 | CREATE_IN_PROGRESS   | Custom::AWSCDK-EKS-KubernetesResource       | CDK_TEST-EKS-Cluster-Test/AwsAuth/manifest/Resource/Default (CDKTESTEKSClusterTestAwsAuthmanifest30F0E99E) Resource creation Initiated
EksTestStack | 56/62 | 10:36:25 | CREATE_COMPLETE      | Custom::AWSCDK-EKS-KubernetesResource       | CDK_TEST-EKS-Cluster-Test/AwsAuth/manifest/Resource/Default (CDKTESTEKSClusterTestAwsAuthmanifest30F0E99E)
EksTestStack | 56/62 | 10:36:25 | CREATE_IN_PROGRESS   | Custom::AWSCDK-EKS-KubernetesResource       | CDK_TEST-EKS-Cluster-Test/manifest-default-namespace/Resource/Default (CDKTESTEKSClusterTestmanifestdefaultnamespaceFC04B4F9) Resource creation Initiated
EksTestStack | 57/62 | 10:36:25 | CREATE_COMPLETE      | Custom::AWSCDK-EKS-KubernetesResource       | CDK_TEST-EKS-Cluster-Test/manifest-default-namespace/Resource/Default (CDKTESTEKSClusterTestmanifestdefaultnamespaceFC04B4F9)
EksTestStack | 57/62 | 10:36:25 | CREATE_IN_PROGRESS   | Custom::AWSCDK-EKS-HelmChart                | CDK_TEST-EKS-Cluster-Test/chart-istio-gateway-helm-chart-Test/Resource/Default (CDKTESTEKSClusterTestchartistiogatewayhelmchartTest4A114B06) Resource creation Initiated
EksTestStack | 58/62 | 10:36:26 | CREATE_COMPLETE      | Custom::AWSCDK-EKS-HelmChart                | CDK_TEST-EKS-Cluster-Test/chart-istio-gateway-helm-chart-Test/Resource/Default (CDKTESTEKSClusterTestchartistiogatewayhelmchartTest4A114B06)
EksTestStack | 58/62 | 10:36:26 | CREATE_IN_PROGRESS   | Custom::AWSCDK-EKS-HelmChart                | CDK_TEST-EKS-Cluster-Test/chart-istio-discovery-helm-chart-Test/Resource/Default (CDKTESTEKSClusterTestchartistiodiscoveryhelmchartTestE6D506ED) Resource creation Initiated
EksTestStack | 58/62 | 10:36:27 | CREATE_FAILED        | Custom::AWSCDK-EKS-HelmChart                | CDK_TEST-EKS-Cluster-Test/chart-istio-discovery-helm-chart-Test/Resource/Default (CDKTESTEKSClusterTestchartistiodiscoveryhelmchartTestE6D506ED) Received response status [FAILED] from custom resource. Message returned: Error: b'Release "istio-discovery" does not exist. Installing it now.\nError: unable to build kubernetes objects from release manifest: unable to recognize "": no matches for kind "EnvoyFilter" in version "networking.istio.io/v1alpha3"\n'

Logs: /aws/lambda/EksTestStack-awscdkawseksKubectlPr-Handler886CB40B-hc6DuSxwWqIc

    at invokeUserFunction (/var/task/framework.js:2:6)
    at processTicksAndRejections (internal/process/task_queues.js:95:5)
    at async onEvent (/var/task/framework.js:1:365)
    at async Runtime.handler (/var/task/cfn-response.js:1:1543) (RequestId: 6358513b-919b-4244-abc7-5260610e38e6)
EksTestStack | 58/62 | 10:36:27 | CREATE_FAILED        | Custom::AWSCDK-EKS-HelmChart                | CDK_TEST-EKS-Cluster-Test/chart-argo-cd-helm-chart-Test/Resource/Default (CDKTESTEKSClusterTestchartargocdhelmchartTestFBC822FD) Resource creation cancelled
EksTestStack | 58/62 | 10:36:27 | CREATE_FAILED        | Custom::AWSCDK-EKS-HelmChart                | CDK_TEST-EKS-Cluster-Test/chart-istio-base-helm-chart-Test/Resource/Default (CDKTESTEKSClusterTestchartistiobasehelmchartTest595C9706) Resource creation cancelled
EksTestStack | 58/62 | 10:36:28 | ROLLBACK_IN_PROGRESS | AWS::CloudFormation::Stack                  | EksTestStack The following resource(s) failed to create: [CDKTESTEKSClusterTestchartistiobasehelmchartTest595C9706, CDKTESTEKSClusterTestchartargocdhelmchartTestFBC822FD, CDKTESTEKSClusterTestchartistiodiscoveryhelmchartTestE6D506ED]. Rollback requested by user.
EksTestStack | 58/62 | 10:36:37 | DELETE_IN_PROGRESS   | AWS::ECR::Repository                        | eks-test-test-service-5 (ekstesttestservice51A30C5DA)
EksTestStack | 58/62 | 10:36:37 | DELETE_IN_PROGRESS   | Custom::AWSCDK-EKS-KubernetesResource       | CDK_TEST-EKS-Cluster-Test/AwsAuth/manifest/Resource/Default (CDKTESTEKSClusterTestAwsAuthmanifest30F0E99E)
EksTestStack | 58/62 | 10:36:37 | DELETE_IN_PROGRESS   | AWS::CDK::Metadata                          | @aws-cdk--aws-eks.ClusterResourceProvider/CDKMetadata/Default (CDKMetadata)
EksTestStack | 58/62 | 10:36:37 | DELETE_IN_PROGRESS   | AWS::ECR::Repository                        | eks-test-test-service-3 (ekstesttestservice370F4A703)
EksTestStack | 58/62 | 10:36:37 | DELETE_IN_PROGRESS   | AWS::ECR::Repository                        | eks-test-test-service-2 (ekstesttestservice25DB36C2F)
```
