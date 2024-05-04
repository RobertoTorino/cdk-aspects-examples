import { Annotations, IAspect } from 'aws-cdk-lib';
import { CfnInstance, CfnLaunchTemplate, Instance } from 'aws-cdk-lib/aws-ec2';
import { IConstruct } from 'constructs';
import EbsProperty = CfnLaunchTemplate.EbsProperty;


export class EbsPropertyChecks implements IAspect {

    public visit (node: IConstruct): void {

        if (node instanceof Instance) {
            if (node.instance.blockDeviceMappings instanceof Array) {
                node.instance.blockDeviceMappings?.find(blockDeviceMapping => {
                    const ebs = ( blockDeviceMapping as CfnInstance.BlockDeviceMappingProperty ).ebs as EbsProperty;
                    if (!ebs.encrypted) {
                        Annotations.of(node).addWarning(`
The (${node.instance.logicalId}-Volume) has NO encryption enabled!
You have to enable encryption on the Volume!
-----------------------------------------------------------------
Example:     | encryption: true   |
-----------------------------------------------------------------
`);
                    }
                });
            }
        }
    }
}
