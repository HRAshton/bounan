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

        smsCodePooling: {
            endpoint: string;
            pollingInterval: number;
            poolingTimeout: number;
        };
    };
}

export interface LifetimeConfiguration {
    session: string;
    lastMessageId: number;
}