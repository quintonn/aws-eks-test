#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CreateAwsResourcesStack } from '../lib/eks-test-stack';

const app = new cdk.App();
new CreateAwsResourcesStack(app, 'EksTestStack', {
  stackName: "EksTestStack",
  description: "Stack to test a bug I keep encountering",
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

app.synth();
