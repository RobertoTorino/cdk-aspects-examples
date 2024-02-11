import { Aspects, Stack } from 'aws-cdk-lib';
import { BucketPoliciesChecks } from './bucket-policies-checks';
import { CloudwatchLogChecks } from './cloudwatch-log-checks';
import { EbsPropertyChecks } from './ebs-property-checks';
import { Ec2InstanceChecks } from './ec2-instance-checks';


export function addAspects(stack: Stack) {
    Aspects.of(stack).add(new CloudwatchLogChecks());
    Aspects.of(stack).add(new BucketPoliciesChecks());
    Aspects.of(stack).add(new EbsPropertyChecks());
    Aspects.of(stack).add(new Ec2InstanceChecks());
}


// In your stack use this: addAspects(yourStackYouWantToCheck);
//
// Example use:
//
//     const testAspectsStack = new TestAspectsStack(app, 'TestAspectsStack', {
//         terminationProtection: false,
//         analyticsReporting: true,
//         description: 'TestAspectsStack',
//         env
//     });
// addAspects(testAspectsStack);
