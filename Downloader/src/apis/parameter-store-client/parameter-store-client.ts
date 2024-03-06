import { ParameterStoreClient as IParameterStoreClient } from './interfaces/parameter-store-client';

import { SSMClient, GetParameterCommand, PutParameterCommand, ParameterType } from '@aws-sdk/client-ssm';

export class ParameterStoreClient implements IParameterStoreClient {
    constructor(private readonly ssmClient: SSMClient) {
    }

    public async getValue(key: string): Promise<string | null> {
        const command = new GetParameterCommand({
            Name: key,
            WithDecryption: true,
        });

        try {
            const response = await this.ssmClient.send(command);
            return response.Parameter?.Value ?? null;
        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'ParameterNotFound') {
                return null;
            }

            console.error(`Error getting parameter ${key}:`, error);
            throw error;
        }
    }

    public async setValue(key: string, value: string, type: ParameterType): Promise<void> {
        const command = new PutParameterCommand({
            Name: key,
            Value: value,
            Type: type,
            Overwrite: true,
        });

        try {
            await this.ssmClient.send(command);
        } catch (error) {
            console.error(`Error setting parameter ${key}:`, error);
            throw error;
        }
    }
}
