import { Construct } from 'constructs';
import { CustomState, DefinitionBody, StateMachine, JsonPath, IStateMachine, Pass, TaskInput, Map, StateMachineType, LogLevel } from 'aws-cdk-lib/aws-stepfunctions';
import { BedrockInvokeModel } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NestedStack, NestedStackProps, RemovalPolicy } from "aws-cdk-lib";
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { BedrockModelRequestHelper, PromptHelper } from './bedrock/models-request-helper';
import { LogGroup } from 'aws-cdk-lib/aws-logs';

export interface StateMachineStackProps extends NestedStackProps {
  Bucket: IBucket;
  modelArn: string;
}

class StateMachineStack extends NestedStack {
  readonly stateMachine: IStateMachine;
  constructor(scope: Construct, id: string, props: StateMachineStackProps) {
    super(scope, id, props);

    const defintion = new CustomState(this, 'Prompt Preparation', {
      stateJson: {
        Type: 'Task',
        Resource: "arn:aws:states:::aws-sdk:s3:getObject",
        Parameters: {
          Bucket: props.Bucket.bucketName,
          Key: PromptHelper.PromptForModel(props.modelArn)
        },
        ResultSelector: {
          'body.$': '$.Body'
        },
        ResultPath: '$.prompt'
      }
    }).next(new Pass(this, 'Format Prompt', {
      parameters: {
        "output.$": "States.Format($.prompt.body, $.message)"
      }
    })).next(new BedrockInvokeModel(this, 'Invoke Model With Prompt', {
      contentType: "application/json",
      model: {
        modelArn: props.modelArn,
      },
      body: TaskInput.fromObject(
        BedrockModelRequestHelper.RequestForModel(
          props.modelArn,
          JsonPath.stringAt('$.output'),
      ))
    }));

    const stateMachine = new StateMachine(this, 'ConversationStateMachine', {
      definitionBody: DefinitionBody.fromChainable(defintion),
      stateMachineType: StateMachineType.EXPRESS,
      logs: {
        level: LogLevel.ALL,
        includeExecutionData: true,
        destination: new LogGroup(this, 'LogGroup', {
          logGroupName: `/aws/vendedlogs/${this.stackName}`,
          removalPolicy: RemovalPolicy.DESTROY,
          retention: 1
        })
      },
    });

    stateMachine.addToRolePolicy(
      new PolicyStatement({
        actions: ["s3:getObject"],
        resources: [`${props.Bucket.bucketArn}/*`],
      })
    );

    stateMachine.addToRolePolicy(
      new PolicyStatement({
        actions: ["bedrock:invokeModel"],
        resources: [  props.modelArn ],
      })
    );

    this.stateMachine = stateMachine;
  }
}

export { StateMachineStack };
