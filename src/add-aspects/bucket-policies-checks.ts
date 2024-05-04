import { Annotations, IAspect } from 'aws-cdk-lib';
import { BlockPublicAccess, CfnBucket, CfnBucketPolicy } from 'aws-cdk-lib/aws-s3';
import { IConstruct } from 'constructs';


export class BucketPoliciesChecks implements IAspect {

    private static isSecureTransport(statement: any): boolean {
        if (statement.condition && Object.keys(statement.condition).length > 0 && statement.condition.BOOLEAN) {
            return 'false' === statement.condition.BOOLEAN['aws:SecureTransport'] && 'Deny' === statement.effect;
        }
        return false;
    }

    public visit(node: IConstruct): void {
        if (node instanceof CfnBucket) {
            const s3BucketId = node.logicalId;
            if (!node.bucketEncryption) {
                Annotations.of(node).addInfo(`
The (${s3BucketId}-bucket) has NO encryption enabled!
You have to enable encryption on the Bucket!
SSE-S3 protects data at rest, each object is encrypted with an
unique key, the key itself is also encrypted with a key that
rotates regularly. SSE-S3 uses one of the strongest block ciphers
available to encrypt your data, 256-bit (AES-256).
-----------------------------------------------------------------
Example:     | encryption: BucketEncryption.S3_MANAGED   |
-----------------------------------------------------------------
`);

                Annotations.of(node).addInfo(`
                     For now, we apply the S3_MANAGED/AES256 encryption to your bucket automatically.
                     `);

                node.bucketEncryption = {
                    serverSideEncryptionConfiguration: [
                        {
                            serverSideEncryptionByDefault: {
                                sseAlgorithm: 'AES256'
                            }
                        }
                    ]
                };
            }

            if (node.publicAccessBlockConfiguration !== BlockPublicAccess.BLOCK_ALL) {
                Annotations.of(node).addWarning(`
The (${s3BucketId}-bucket) is NOT secure!
You have to enable the blockPublicAccess policy on the Bucket.
Before applying these settings, verify that your applications
will work correctly without public access, for instance if you
host a static website. These four settings will be disabled:
BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy and
RestrictPublicBuckets.
-----------------------------------------------------------------
Example:     | blockPublicAccess: BlockPublicAccess.BLOCK_ALL |
-----------------------------------------------------------------
For now, we apply it to your bucket automatically.
`);

                node.publicAccessBlockConfiguration = BlockPublicAccess.BLOCK_ALL;
            }

            if (!node.cfnOptions.deletionPolicy) {
                Annotations.of(node).addWarning(`
The (${s3BucketId}-bucket) has deletion policy DISABLED!
If you want to remove the bucket and all of it's objects,
you have to set the deletion policy on the Bucket to true
and the removalPolicy to DESTROY.
-----------------------------------------------------------------
Example:     | autoDeleteObjects: true  |
             | removalPolicy: RemovalPolicy.DESTROY   |
-----------------------------------------------------------------
`);
            }

            if (!node.versioningConfiguration && node.lifecycleConfiguration) {
                Annotations.of(node).addInfo(`
The (${s3BucketId}-bucket) has NO versioning enabled.
If you use lifecycle rules with the expiration action
set, it will result in Amazon S3 permanently removing the object.
To prevent this, versioned has to be set to 'true'.
-----------------------------------------------------------------
Example:  |  versioned: true,            |
          |  lifecycleRules: [{          |
          |  enabled: true,              |
          |  id: 'BucketLifeCycleRules',                   |
          |  noncurrentVersionExpiration: Duration.days(365), |
          |  },     |
          |  {      |
          |  noncurrentVersionTransitions: [{                 |
          |  storageClass: StorageClass.INFREQUENT_ACCESS,    |
          |  transitionAfter: Duration.days(30),              |
          |  },     |
          |  {      |
          |  storageClass: StorageClass.GLACIER,              |
          |  transitionAfter: Duration.days(60),              |
          |  }      |
          |  ]      |
          |  }]     |
-----------------------------------------------------------------
                    `);
            }
        }

        if (node instanceof CfnBucketPolicy) {
            const newPolicyStatements = node.policyDocument.statements;
            let hasSecurePolicy = false;
            for (const policyStatement of newPolicyStatements) {
                if (BucketPoliciesChecks.isSecureTransport(policyStatement)) {
                    hasSecurePolicy = true;
                }
            }
            if (!hasSecurePolicy) {
                Annotations.of(node).addWarning(`
The bucket-${node.bucket}) REQUIRES encryption
during data transit. You have to enforce SSL!.
This setting will confirm that your bucket policies explicitly
deny access to HTTP requests.
-----------------------------------------------------------------
Example:     |  enforceSSL: true  |
-----------------------------------------------------------------
                    `);
            }
        }
    }
}
