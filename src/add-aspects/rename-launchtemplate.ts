import { Annotations, IAspect, } from 'aws-cdk-lib';
import { CfnInstance, CfnLaunchTemplate } from 'aws-cdk-lib/aws-ec2';
import { IConstruct } from 'constructs';


export class LaunchTemplateRename implements IAspect {
    public visit (node: IConstruct): void {
        if (node instanceof CfnLaunchTemplate) {
            const resourceType = node.cfnResourceType;
            const resourceName = node.launchTemplateName;
            if (node.launchTemplateName?.includes('LaunchTemplateNameIncorrect')) {
                Annotations.of(node).addWarning(`
[Incorrect launch template name on resource-type ${resourceType} with resource-name ${resourceName} will be corrected.]                                                                 
                     `);
                node.addPropertyOverride('LaunchTemplateName', 'LaunchTemplateNameCorrect');
            }
        }

        if (node instanceof CfnInstance) {
            const resourceType = node.cfnResourceType;
            const imageId = node.imageId;
            if (node.imageId?.match('ami-00000000000000000')) {
                Annotations.of(node).addWarning(`
[Incorrect launch template name on resource-type ${resourceType} with image-id ${imageId}  will be corrected.]
                     `);
                node.addPropertyOverride('LaunchTemplate.LaunchTemplateName', 'LaunchTemplateNameCorrect');
            }
        }
    }
}

// In your stack where you want to correct this use this:
// Aspects.of(yourStackWithTheLaunchTemplate).add(new LaunchTemplateRename());
