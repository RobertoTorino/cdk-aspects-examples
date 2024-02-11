import { Annotations, CfnDeletionPolicy, IAspect, RemovalPolicy } from 'aws-cdk-lib';
import { CfnProject } from 'aws-cdk-lib/aws-codebuild';
import { CfnLogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { CloudWatchLogGroupRetentionPeriod } from 'cdk-nag/lib/rules/cloudwatch';
import { IConstruct } from 'constructs';


export class CloudwatchLogChecks implements IAspect {

    public visit (node: IConstruct): void {
        if (node instanceof CfnProject) {
            if (!node.logsConfig) {
                Annotations.of(node).addWarning(`
                    No Logging configuration specified.
                    We expect a logging configuration with a CloudWatch LogGroup containing
                    a removalPolicy: RemovalPolicy.DESTROY and a Retention < 731 days/2years.
                    -----------------------------------------------------------------
                     Example: | logging: {
                                    cloudWatch: {
                                        logGroup: logGroup, // Containing the logging policies
                                        enabled: true
                                    }
                    -----------------------------------------------------------------
                    `);
            }
        }
        if (node instanceof CfnLogGroup) {
            if (node.cfnOptions.deletionPolicy != CfnDeletionPolicy.DELETE) {
                Annotations.of(node).addWarning(`
                    Unexpected deletion policy set.
                    We expect that deletion/removal policy to be set to RemovalPolicy.DESTROY
                    -----------------------------------------------------------------
                     Example: |  removalPolicy: RemovalPolicy.DESTROY |
                    -----------------------------------------------------------------
                    We're adding it automatically now to your log group.
                    `);

                node.applyRemovalPolicy(RemovalPolicy.DESTROY);
            }
            if (!node.retentionInDays || 731 <= node.retentionInDays) {
                Annotations.of(node).addWarning(`
                    No retention period has been set or has been configured out of acceptable boundaries.
                    We expect some form of retention which is not "Never" or less than 2 years.
                    -----------------------------------------------------------------
                     Example: |  retention: RetentionDays.TWO_WEEKS,  |
                    -----------------------------------------------------------------
                    We're applying a retention period of TWO WEEKS automatically now for your log group.
                    `);
                node.retentionInDays = RetentionDays.TWO_WEEKS;
            }
            if (!node.retentionInDays) {
                Annotations.of(node).addWarning(`
                applying retention period to loggroups without retention period!
                `)
                node.retentionInDays = CloudWatchLogGroupRetentionPeriod(RetentionDays.TWO_WEEKS);
            }
        }
    }
}
