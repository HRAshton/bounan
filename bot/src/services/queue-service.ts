import { QueueService as IQueueService } from './interfaces/queue-service';
import { SQS } from '@aws-sdk/client-sqs';
import { Configuration } from '../config/configuraion';

export class QueueService implements IQueueService {
    constructor(private readonly sqs: SQS) {
    }

    public async requestVideo(signedLink: string): Promise<void> {
        await this.sqs.sendMessage({
            MessageBody: signedLink,
            QueueUrl: Configuration.sqs.queueUrl,
            MessageGroupId: 'main',
        });
    }
}