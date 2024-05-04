import { Annotations, IAspect, Stack, Tokenization, } from 'aws-cdk-lib';
import { CfnSecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { IConstruct } from 'constructs';
import IngressProperty = CfnSecurityGroup.IngressProperty;

export class Securitygroups implements IAspect {
    public visit (node: IConstruct) {
        if (node instanceof CfnSecurityGroup) {
            checkRules(Stack.of(node).resolve(node.securityGroupIngress));
        }

        // The IPv4 address range, in CIDR format.
        function checkRules (rules: Array<IngressProperty>) {
            if (rules) {
                for (const rule of rules.values()) {
                    // function to manipulate tokens
                    if (!Tokenization.isResolvable(rule) && ( rule.cidrIp === '0.0.0.0/0' || rule.cidrIp === '::/0' )) {
                        Annotations.of(node).addWarning(`
'The Security Group ingress rule'
'allows unrestricted ingress (inbound traffic) from the public internet!'
'change this if the resource has a public ip address!
                              `);
                    }
                }
            }
        }
    }
}
