import { Construct } from "constructs";
import { Duration, NestedStack, NestedStackProps } from "aws-cdk-lib";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { resolve } from "path";
import { Architecture, LoggingFormat, IFunction, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { IStateMachine } from "aws-cdk-lib/aws-stepfunctions";

interface SkillStackProps extends NestedStackProps { 
    satetmachine: IStateMachine,
}

class SkillStack extends NestedStack {
    readonly SkillFunction: IFunction;


    constructor(scope: Construct, id: string, props: SkillStackProps) {
        super(scope, id, props);

        const functionRole = new Role(this, 'skill-function-role', {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                {
                    managedPolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
                },
            ],
        });

        this.SkillFunction = new NodejsFunction(this, 'skill-function', {
            entry:  resolve(__dirname, '../../src/skill-trigger', 'index.ts'),
            handler: 'handler',
            runtime: Runtime.NODEJS_20_X,
            memorySize: 256,
            role: functionRole,
            timeout: Duration.seconds(10),
            architecture: Architecture.ARM_64,
            logRetention: 1,
            loggingFormat: LoggingFormat.JSON,            
            awsSdkConnectionReuse: false,
            bundling: {
                platform: 'node',
                format: OutputFormat.CJS,
                mainFields: ['module', 'main'],
                minify: true,
                sourceMap: true,
                sourcesContent: false,
                externalModules: [ '@aws-sdk' ],
                metafile: true 
            },
            environment: {
                SKILL_NAME: 'WANT_IT',
                STATE_MACHINE_ARN: props.satetmachine.stateMachineArn,
            },
        });

        props.satetmachine.grantStartSyncExecution(functionRole);
        this.SkillFunction.addPermission('alexa-skills-kit-trigger', {
            principal: new ServicePrincipal('alexa-appkit.amazon.com'),
            action: 'lambda:invokeFunction',
        });
    }
}

export { SkillStack };