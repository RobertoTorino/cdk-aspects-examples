import {
  Annotations,
  IAspect,
  RemovalPolicy,
} from 'aws-cdk-lib';
import {
  BlockPublicAccess,
  CfnBucket,
} from 'aws-cdk-lib/aws-s3';
import { IConstruct } from 'constructs';
import chalk from 'chalk';
import {application, myStack} from "../../bin/cdk-aspects-examples";

const notificationMarkup = require('../../version-checks/markup');

export class Buckets implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof CfnBucket) {
      const s3BucketId = node.logicalId;
      if (!node.bucketEncryption) {
        notificationMarkup.notifyMarkup([
          chalk.red(`The ${s3BucketId}-bucket has NO encryption enabled!`),
          chalk.red(`We will apply SSE AES256 to your ${s3BucketId}-bucket automatic.`)]);
        node.bucketEncryption = {
          serverSideEncryptionConfiguration: [
            {
              serverSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
            },
          ],
        };
      }

      if (node.publicAccessBlockConfiguration !== BlockPublicAccess.BLOCK_ALL) {
        Annotations.of(node).addWarning(`
[The ${s3BucketId}-bucket is NOT secure!]
[For now, we apply BlockPublicAccess.BLOCK_ALL to your (${s3BucketId}-bucket) automatic.]
==============================================================================================
`);

        // eslint-disable-next-line no-param-reassign
        node.publicAccessBlockConfiguration = BlockPublicAccess.BLOCK_ALL;
      }

      if (!node.tags?.hasTags()) {
        Annotations.of(node).addWarning(`
[The ${s3BucketId}-bucket has no tagging!]
[For now, we apply tagging to your (${s3BucketId}-bucket) automatic.]
====================================================================================
                     `);
        if ([
          myStack.stackName.match,
          'DEV',
          'A-Z',
          'a-z',
        ]) {
          node.tags.setTag('stage', 'dev', 100, true);
          node.tags.setTag('Application', application, 100, true);
        }
        // eslint-disable-next-line no-sequences
        return node.tags.setTag('stage', 'dev'),
            node.tags.setTag('Application', application);
      }

      if (!node.cfnOptions.deletionPolicy) {
        Annotations.of(node).addWarning(`
[The ${s3BucketId}-bucket has deletion policy DISABLED!]
[For now we apply RemovalPolicy.DESTROY to your (${s3BucketId}-bucket) automatic.]
====================================================================================
                     `);
        node.applyRemovalPolicy(RemovalPolicy.DESTROY);
      }

      if (node.cfnOptions.deletionPolicy?.match('Retain')) {
        Annotations.of(node).addWarning(`
[The ${s3BucketId}-bucket has deletion policy RETAIN!]
[For now we apply deletionPolicy [DELETE] and ]
[UpdateReplacePolicy policy [DELETE] to your (${s3BucketId}-bucket) automatic.]
====================================================================================
                     `);
        node.addOverride('DeletionPolicy', 'Delete');
        node.addOverride('UpdateReplacePolicy', 'Delete');
      }

      if (!node.versioningConfiguration && !node.lifecycleConfiguration) {
        Annotations.of(node).addWarning(`
[The ${s3BucketId}-bucket has NO versioning or lifecycle config!]
[We will apply following config to your (${s3BucketId}-bucket) automatic.]
[versioningConfiguration: status: enabled]
[lifecycleConfiguration:rules:enabled, expiration in days: 1]
====================================================================================`);

        node.versioningConfiguration = {
          status: 'enabled',
        };

        node.lifecycleConfiguration = {
          rules: [
            {
              status: 'enabled',
              expirationInDays: 1,
            },
          ],
        };

        if (!node.logicalId.includes('PipelineArtifactsBucket') && (!node.cfnResourceType.includes('AWS::S3::Bucket'))) {
          Annotations.of(node).addInfo(`
[${s3BucketId}-bucket is not an artifacts-bucket!]
[But has NO versioning or lifecycle config.]
[You have to configure the lifecycle policies manual.]
====================================================================================
                `);
        }
      }
    }
  }
}
