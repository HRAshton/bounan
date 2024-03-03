import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
    VideoEntity,
    VideoStatus,
    VideoRepository as IVideoRepository, VideoWithRequesters,
} from './interfaces/video-repository';
import { Configuration } from '../config/configuraion';

const dynamoDBClient = new DynamoDBClient({});
const dynamoDb = DynamoDBDocumentClient.from(dynamoDBClient);

export class VideoRepository implements IVideoRepository {
    private readonly tableName = Configuration.storage.filesTableName;

    public async getVideo(signedLink: string): Promise<VideoEntity | null> {
        return this.tryGetVideo(signedLink);
    }

    public async addVideoIfNotExist(video: VideoEntity): Promise<void> {
        const params = {
            TableName: this.tableName,
            Item: video,
            ConditionExpression: 'attribute_not_exists(signedLink)',
        };

        try {
            await dynamoDb.send(new PutCommand(params));
        } catch (error: unknown) {
            if ((error as Error).name !== 'ConditionalCheckFailedException') {
                throw error;
            }
            // If the error is ConditionalCheckFailedException, the video already exists, so we do nothing.
        }
    }

    public async addRequester(signedLink: string, requesterUserId: number): Promise<void> {
        const params = {
            TableName: this.tableName,
            Key: { signedLink },
            UpdateExpression: 'ADD requesters :requester',
            ExpressionAttributeValues: {
                ':requester': new Set([requesterUserId]),
            },
        };

        await dynamoDb.send(new UpdateCommand(params));
    }

    public getVideoWithRequesters(signedLink: string): Promise<VideoWithRequesters> {
        return this.tryGetVideo(signedLink) as Promise<VideoWithRequesters>;
    }

    public async clearRequesters(signedLink: string): Promise<void> {
        const params = {
            TableName: this.tableName,
            Key: { signedLink },
            UpdateExpression: 'SET requesters = :null_value',
            ExpressionAttributeValues: {
                ':null_value': null,
            },
        };

        await dynamoDb.send(new UpdateCommand(params));
    }

    public async markAsUploaded(signedLink: string, fileId: string): Promise<void> {
        const params = {
            TableName: this.tableName,
            Key: { signedLink },
            UpdateExpression: 'SET fileId = :fileId, videoStatus = :status, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':fileId': fileId,
                ':status': VideoStatus.Uploaded,
                ':updatedAt': new Date().toISOString(),
            },
        };

        await dynamoDb.send(new UpdateCommand(params));
    }

    public async markAsFailed(signedLink: string): Promise<void> {
        const params = {
            TableName: this.tableName,
            Key: { signedLink },
            UpdateExpression: 'SET videoStatus = :status, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':status': VideoStatus.Failed,
                ':updatedAt': new Date().toISOString(),
            },
        };

        await dynamoDb.send(new UpdateCommand(params));
    }

    private async tryGetVideo(signedLink: string): Promise<VideoWithRequesters | null> {
        const params = {
            TableName: this.tableName,
            Key: { signedLink },
        };

        try {
            const result = await dynamoDb.send(new GetCommand(params));
            return result.Item as VideoWithRequesters;
        } catch (error: unknown) {
            if ((error as Error).name === 'ResourceNotFoundException') {
                return null;
            }
            throw error;
        }
    }
}
