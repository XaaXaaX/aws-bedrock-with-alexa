import { NestedStack, NestedStackProps, RemovalPolicy } from "aws-cdk-lib";
import { Bucket, IBucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

export interface PromptsBucketStackProps extends NestedStackProps {}
class PromptsBucketStack extends NestedStack {
  readonly Bucket: IBucket;
  constructor(scope: Construct, id: string, props?: PromptsBucketStackProps) {
    super(scope, id, props);

    this.Bucket = new Bucket(this, 'AssetsBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new BucketDeployment(this, 'AssetDeployment', {
      sources: [
        Source.asset('src/prompts'),
      ],
      destinationBucket: this.Bucket,
    });
  }
}

export { PromptsBucketStack };