import { LifetimeConfigurationRepository as ILifetimeConfigurationRepository } from './index';
import { ParameterStoreClient } from '../apis/parameter-store-client/interfaces/parameter-store-client';

export class LifetimeConfigurationRepository implements ILifetimeConfigurationRepository {
    private readonly PARAMETER_PREFIX = '/bounan/downloader/';

    constructor(private parameterStoreClient: ParameterStoreClient) {
    }

    public getSession(): Promise<string | null> {
        return this.parameterStoreClient.getValue(this.PARAMETER_PREFIX + 'session-token');
    }

    public setSession(value: string): Promise<void> {
        return this.parameterStoreClient.setValue(this.PARAMETER_PREFIX + 'session-token', value, 'SecureString');
    }
}
