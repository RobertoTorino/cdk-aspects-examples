import * as cdk from 'aws-cdk-lib';
import { aws_logs, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ILogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { SqsDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as path from 'path';
import { application } from '../bin/cdk-aspects-examples';

export class MyStack extends cdk.Stack {
    private readonly logGroup: ILogGroup;

    constructor (scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.logGroup = new aws_logs.LogGroup(this, `${application}-LogGroup`, {
            logGroupName: `/cdk/${application}`,
            retention: RetentionDays.FIVE_DAYS,
            removalPolicy: RemovalPolicy.DESTROY,
        });

        const queue = new Queue(this, 'MyQueue', {
            visibilityTimeout: Duration.seconds(300),
        });

        const bucket = new Bucket(this, 'MyBucket', {
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
        bucket.addEventNotification(EventType.OBJECT_CREATED, new SqsDestination(queue));

        const myLambda1 = new NodejsFunction(this, 'MyLambda1', {
            entry: path.join(__dirname, 'lambda', 'index.ts'),
            runtime: Runtime.NODEJS_16_X,
            logGroup: this.logGroup,
            // Make EnforceMinimumLambdaNodeRuntimeVersion fail:
            // runtime: Runtime.NODEJS_12_X
        });
        myLambda1.addEventSource(new SqsEventSource(queue));

        new NodejsFunction(this, 'MyLambda2', {
            entry: path.join(__dirname, 'lambda', 'index.ts'),
            runtime: Runtime.NODEJS_16_X,
            logGroup: this.logGroup,
        });
    }
}
