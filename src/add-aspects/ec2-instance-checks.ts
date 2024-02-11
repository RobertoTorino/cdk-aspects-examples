import { Annotations, IAspect } from 'aws-cdk-lib';
import { Instance } from 'aws-cdk-lib/aws-ec2';
import { IConstruct } from 'constructs';


export class Ec2InstanceChecks implements IAspect {

    public visit(node: IConstruct): void {
        if (node instanceof Instance) {

            if (!node.role) {
                Annotations.of(node).addWarning(`
                     The (${node.instanceId}) has NO Role attached!
                     `);
            }

            if (!node.instance.keyName) {
                Annotations.of(node).addWarning(`
                     The (${node.instanceId}) has No keyName configured!
                     `);
            }

            if (!node.userData) {
                Annotations.of(node).addWarning(`
                The (${node.instanceId}) has No userData configured!
                `);
            }

            if (node.instanceId != 'approved-image-id') {
                Annotations.of(node).addWarning(`
                The AMI the (${node.instanceId}) instance uses is not approved!
                `);
            }
        }
    }
}
