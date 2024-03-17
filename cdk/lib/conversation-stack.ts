import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StateMachineStack } from './state-machine-stack';
import { PromptsBucketStack } from './prompts-bucket-stack';
import { SkillStack } from './skill-stack';

class ConversationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    const { region: REGION } = Stack.of(this);
    const modelArn = Stack.of(this).formatArn({
      service: 'bedrock',
      resource: 'foundation-model',
      resourceName: 'mistral.mistral-7b-instruct-v0:2',
      region: REGION,
      account: '',
    });

    const assets = new PromptsBucketStack(this, 'AssetsBucketStack', {});
    
    const stateMachineStack = new StateMachineStack(this, 'ConversationStateMachineStack', {
      Bucket: assets.Bucket,
      modelArn: modelArn,
    });

    new SkillStack(this, 'SkillFunction', {
      satetmachine: stateMachineStack.stateMachine,
    });
  }
  
}

export { ConversationStack };