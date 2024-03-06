export interface Configuration {
    downloading: {
        maxConcurrentDownloads: number;
    };
    processing: {
        outputFilePath: string;
    };
    telegram: {
        apiId: number;
        apiHash: string;
        phone: string;
        botChatAlias: string;

        uploadWorkers: number;

        smsCodePooling: {
            endpoint: string;
            pollingInterval: number;
            poolingTimeout: number;
        };
    };
    axios: {
        retries: number;
    };
    sqs: {
        queueUrl: string;
        waitTimeSeconds: number;
    };
}

export interface LifetimeConfigurationRepository {
    getSession(): Promise<string | null>;
    setSession(value: string): Promise<void>;
}