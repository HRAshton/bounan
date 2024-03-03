import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { config } from '../config';

export class BounanCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const filesTable = new dynamodb.Table(this, 'bounan-videos-table', {
            partitionKey: { name: 'signedLink', type: dynamodb.AttributeType.STRING },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
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
            },
        });

        filesTable.grantReadWriteData(botFunction);

        new apiGateway.LambdaRestApi(this, 'bounan-bot-api', {
            handler: botFunction,
        });
    }
}
