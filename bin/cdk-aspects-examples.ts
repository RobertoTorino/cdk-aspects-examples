#!/usr/bin/env node
import {
    App,
    Aspects,
    DefaultStackSynthesizer,
} from 'aws-cdk-lib';
import {Runtime} from 'aws-cdk-lib/aws-lambda';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import 'source-map-support/register';
import {MyStack} from '../lib/my-stack';
import { addAspects } from '../src/add-aspects/add-aspects';
import {ApplyTags} from '../src/aspects/apply-tags';
import {Buckets} from '../src/aspects/enable-bucket-versioning';
import {EnforceMinimumLambdaNodeRuntimeVersion} from '../src/aspects/enforce-minimum-lambda-node-runtime-version';
import {LambdaLogGroupConfig} from '../src/aspects/lambda-log-group-config';
import {AuCoreCdkVersionCheckStack} from "../version-checks/cdk-check";
import {AuCoreCdkLibVersionCheckStack} from "../version-checks/lib-check";
import {Securitygroups} from "../src/aspects/securitygroups";

const app = new App();

export function makeUnique() {
    let text = '';
    const rangeChoice = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 5; i++) text += rangeChoice.charAt(Math.floor(Math.random() * rangeChoice.length));
    return text;
}

export const application = 'cdk-aspects-examples';

export const env = {
    account: process.env.CDK_SYNTH_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_SYNTH_REGION || process.env.CDK_DEFAULT_REGION,
};

export const myStack = new MyStack(app, 'MyStack', {
    terminationProtection: false,
    analyticsReporting: true,
    synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false,
        // Name of the S3 bucket for file assets
        bucketPrefix: makeUnique(),
    }),
    stackName: 'CdkAspectsExampleStack',
    description: 'CDK aspects example stack',
    env,
});
Aspects.of(myStack).add(new Securitygroups());
addAspects(myStack);

const appAspects = Aspects.of(app);

const cdkVersionCheck = new AuCoreCdkVersionCheckStack(
    app,
    'CdkVersionCheckStack',
    {
        synthesizer: new DefaultStackSynthesizer({
            generateBootstrapVersionRule: false,
            // Name of the S3 bucket for file assets
            bucketPrefix: makeUnique(),
        }),
        stackName: 'CdkVersionCheckStack',
        description: 'Stack for cdk version check',
        env,
    },
);
Aspects.of(cdkVersionCheck).add(new Buckets());

const cdkLibVersionCheck = new AuCoreCdkLibVersionCheckStack(
    app,
    'CdkLibVersionCheckStack',
    {
        synthesizer: new DefaultStackSynthesizer({
            generateBootstrapVersionRule: false,
            // Name of the S3 bucket for file assets
            bucketPrefix: makeUnique(),
        }),
        stackName: 'CdkLibVersionCheckStack',
        description: 'Stack for aws-cdk-lib version check',
        env,
    },
);
Aspects.of(cdkLibVersionCheck).add(new Buckets());

// 1) Apply changes
appAspects.add(new ApplyTags({
    stage: 'dev',
    project: 'CDK-Aspects',
    owner: 'Dev-Team'
}));

appAspects.add(new Buckets());
// https://github.com/aws/aws-cdk/blob/f834a4537643b32131076111be0693c6f8f96b24/packages/@aws-cdk/aws-redshift/test/integ.cluster-elasticip.ts#L10-L16

// 2) Throw errors
appAspects.add(new EnforceMinimumLambdaNodeRuntimeVersion(Runtime.NODEJS_18_X));

// cdk-nag un-comment for checks
// appAspects.add(new AwsSolutionsChecks());

// 4) Add resources
appAspects.add(new LambdaLogGroupConfig({
    retention: RetentionDays.ONE_DAY
}));

console.log(`\x1B[1;34mAWS REGION: ${env.region}`);
console.log(`\x1B[1;34mAWS ACCOUNT-ID: ${env.account}`);
console.log(`\x1B[1;34mCDK Aspects Example Stack: ${myStack.stackName}`);
