import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';
import { config } from '../config';

export class BounanCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const filesTable = new dynamodb.Table(this, 'bounan-videos-table', {
            partitionKey: { name: 'signedLink', type: dynamodb.AttributeType.STRING },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });

        const failedSqsQueue = new sqs.Queue(this, 'bounan-dwn-dlq', { fifo: true });

        const toDownloadSqsQueue = new sqs.Queue(this, 'bounan-to-download', {
            fifo: true,
            visibilityTimeout: cdk.Duration.seconds(300),
            deadLetterQueue: {
                queue: failedSqsQueue,
                maxReceiveCount: 3,
            },
            contentBasedDeduplication: true,
        });

        const botFunction = new lambda.Function(this, 'bounan-bot-lambda', {
            runtime: lambda.Runtime.NODEJS_LATEST,
            handler: 'bot.handler',
            code: lambda.Code.fromAsset('../bot/dist'),
            environment: {
                FILES_TABLE_NAME: filesTable.tableName,
                LOAN_API_TOKEN: config.loanApiToken,
                TELEGRAM_BOT_TOKEN: config.telegramBotToken,
                VIDEO_PROVIDER_USER_ID: config.videoProviderUserId,
                TO_DOWNLOAD_SQS_URL: toDownloadSqsQueue.queueUrl,
            },
            timeout: cdk.Duration.seconds(10),
            logRetention: logs.RetentionDays.ONE_WEEK,
        });

        this.setupErrorAlarm(botFunction);
        filesTable.grantReadWriteData(botFunction);
        toDownloadSqsQueue.grantSendMessages(botFunction);

        new apiGateway.LambdaRestApi(this, 'bounan-bot-api', {
            handler: botFunction,
        });
    }

    private setupErrorAlarm(botFunction: lambda.Function) {
        const topic = new sns.Topic(this, 'LambdaErrorTopic');

        topic.addSubscription(new subscriptions.EmailSubscription(config.errorAlarmEmail));

        const errorFilter = new logs.MetricFilter(this, 'ErrorFilter', {
            logGroup: botFunction.logGroup,
            metricNamespace: 'BounanBot',
            metricName: 'ErrorCount',
            filterPattern: logs.FilterPattern.anyTerm('error', 'exception', 'warn'),
            metricValue: '1',
        });

        const alarm = new cloudwatch.Alarm(this, 'Alarm', {
            metric: errorFilter.metric(),
            threshold: 1,
            evaluationPeriods: 1,
            alarmDescription: 'Alarm when the Lambda function logs errors.',
        });

        alarm.addAlarmAction(new cloudwatchActions.SnsAction(topic));
    }
}
