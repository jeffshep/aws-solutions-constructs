/**
 *  Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

// Imports
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as defaults from '@aws-solutions-constructs/core';
// Note: To ensure CDKv2 compatibility, keep the import statement for Construct separate
import { Construct } from 'constructs';
import { SqsEventSource, SqsEventSourceProps } from 'aws-cdk-lib/aws-lambda-event-sources';

/**
 * @summary The properties for the SqsToLambda class.
 */
export interface SqsToLambdaProps {
    /**
     * Existing instance of Lambda Function object, providing both this and `lambdaFunctionProps` will cause an error.
     *
     * @default - None
     */
    readonly existingLambdaObj?: lambda.Function,
    /**
     * User provided props to override the default props for the Lambda function.
     *
     * @default - Default properties are used.
     */
    readonly lambdaFunctionProps?: lambda.FunctionProps,
    /**
     * Existing instance of SQS queue object, Providing both this and queueProps will cause an error.
     *
     * @default - Default props are used
     */
    readonly existingQueueObj?: sqs.Queue,
    /**
     * Optional user provided properties
     *
     * @default - Default props are used
     */
    readonly queueProps?: sqs.QueueProps,
    /**
     * Optional user provided properties for the dead letter queue.
     *
     * @default - Default props are used
     */
    readonly deadLetterQueueProps?: sqs.QueueProps,
    /**
     * Whether to deploy a secondary queue to be used as a dead letter queue.
     *
     * @default - true.
     */
    readonly deployDeadLetterQueue?: boolean,
    /**
     * The number of times a message can be unsuccessfully dequeued before being moved to the dead-letter queue.
     *
     * @default - required field if deployDeadLetterQueue=true.
     */
    readonly maxReceiveCount?: number,
    /**
     * Optional user provided properties for the queue event source.
     *
     * @default - Default props are used
     */
    readonly sqsEventSourceProps?: SqsEventSourceProps
}

/**
 * @summary The SqsToLambda class.
 */
export class SqsToLambda extends Construct {
    public readonly sqsQueue: sqs.Queue;
    public readonly deadLetterQueue?: sqs.DeadLetterQueue;
    public readonly lambdaFunction: lambda.Function;

    /**
     * @summary Constructs a new instance of the SqsToLambda class.
     * @param {cdk.App} scope - represents the scope for all the resources.
     * @param {string} id - this is a a scope-unique id.
     * @param {CloudFrontToApiGatewayToLambdaProps} props - user provided props for the construct.
     * @since 0.8.0
     * @access public
     */
    constructor(scope: Construct, id: string, props: SqsToLambdaProps) {
      super(scope, id);
      defaults.CheckProps(props);

      // Setup the Lambda function
      this.lambdaFunction = defaults.buildLambdaFunction(this, {
        existingLambdaObj: props.existingLambdaObj,
        lambdaFunctionProps: props.lambdaFunctionProps
      });

      // Setup the dead letter queue, if applicable
      this.deadLetterQueue = defaults.buildDeadLetterQueue(this, {
        existingQueueObj: props.existingQueueObj,
        deployDeadLetterQueue: props.deployDeadLetterQueue,
        deadLetterQueueProps: props.deadLetterQueueProps,
        maxReceiveCount: props.maxReceiveCount
      });

      // Setup the queue
      [this.sqsQueue] = defaults.buildQueue(this, 'queue', {
        existingQueueObj: props.existingQueueObj,
        queueProps: props.queueProps,
        deadLetterQueue: this.deadLetterQueue
      });

      // Setup the event source mapping
      this.lambdaFunction.addEventSource(new SqsEventSource(this.sqsQueue, props.sqsEventSourceProps));
    }
}