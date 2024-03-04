import { Logger } from 'sitka';
import { SQS } from '@aws-sdk/client-sqs';
import { Configuration } from '../config/configuration';

type IQueueHandler = (message: string) => Promise<void>;

export class QueueService {
    private handler: IQueueHandler | null = null;
    private processing = false;

    private readonly logger = Logger.getLogger({ name: this.constructor.name });
    private readonly sqs: SQS;
    private readonly queueConfig;

    constructor() {
        this.sqs = new SQS({ apiVersion: '2012-11-05' });
        this.queueConfig = {
            QueueUrl: Configuration.sqs.queueUrl,
            WaitTimeSeconds: Configuration.sqs.waitTimeSeconds,
            MaxNumberOfMessages: 1,
        };
    }

    public registerHandler(handler: IQueueHandler): void {
        if (this.handler) {
            throw new Error('Handler already registered');
        }

        this.handler = handler;
    }

    public async start(): Promise<void> {
        if (!this.handler) {
            throw new Error('Handler not registered');
        }

        this.logger.info('Starting queue service');
        this.processing = true;
        while (this.processing) {
            const msg = await this.sqs.receiveMessage(this.queueConfig);
            if (!msg.Messages) {
                continue;
            }

            const message = msg.Messages[0];
            this.logger.info('Received message: ', msg.Messages[0]);

            if (!message.Body) {
                this.logger.error('Empty message');
                continue;
            }

            try {
                await this.handler(message.Body);
                await this.sqs.deleteMessage({
                    QueueUrl: this.queueConfig.QueueUrl,
                    ReceiptHandle: message.ReceiptHandle,
                });

                this.logger.info('Message processed');
            } catch (error) {
                this.logger.error('Error processing message', error);
            }
        }
    }

    public stop(): void {
        this.logger.info('Stopping queue service');
        this.processing = false;
    }
}