import { ParameterType } from '@aws-sdk/client-ssm';

export interface ParameterStoreClient {
    getValue(key: string): Promise<string | null>;

    setValue(key: string, value: string, type: ParameterType): Promise<void>;
}