import { Annotations, IAspect } from 'aws-cdk-lib';
import { CfnFunction, Runtime, RuntimeFamily } from 'aws-cdk-lib/aws-lambda';
import { IConstruct } from 'constructs';

export class EnforceMinimumLambdaNodeRuntimeVersion implements IAspect {
  #minimumNodeRuntimeVersion: Runtime;

  constructor(minimumNodeRuntimeVersion: Runtime) {
    if (minimumNodeRuntimeVersion.family !== RuntimeFamily.NODEJS) {
      throw new Error('Minimum NodeJS runtime version must be a NodeJS runtime');
    }
    this.#minimumNodeRuntimeVersion = minimumNodeRuntimeVersion;
  }

  visit(node: IConstruct) {
    if (node instanceof CfnFunction) {
      const functionId = node.logicalId;
      // Runtime is optional for functions not being deployed from a package
      if (!node.runtime) {
        throw new Error(`Runtime not specified for ${node.node.path}`);
      }
      Annotations.of(node).addWarning(`The ${node.node.path} has no runtime config!]`);

      // eslint-disable-next-line no-param-reassign
      node.runtime = 'nodejs20.x';
      const nodeRuntime = 'nodejs20.x';

      const actualNodeJsRuntimeVersion = this.parseNodeRuntimeVersion(node.runtime);
      // const minimumNodeJsRuntimeVersion = this.parseNodeRuntimeVersion(this.#minimumNodeRuntimeVersion.name);
      const minimumNodeJsRuntimeVersion = this.parseNodeRuntimeVersion(this.#minimumNodeRuntimeVersion.name);

      if (actualNodeJsRuntimeVersion < minimumNodeJsRuntimeVersion) {
        Annotations.of(node).addWarning(`The Node.js runtime version ${node.runtime} is less than the minimum version ${this.#minimumNodeRuntimeVersion.name}.`);
        node.addOverride('Runtime', nodeRuntime);
        node.addOverride('runtime', nodeRuntime);
      }

      Annotations.of(node).addWarning(`The ${functionId} Lambda Function runtime is updated to ${nodeRuntime}!]
===================================================================================================================
      `);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private parseNodeRuntimeVersion(runtimeName: string): number {
    const runtimeVersion = runtimeName.replace('nodejs', '').split('.')[0];
    return +runtimeVersion;
  }
}
