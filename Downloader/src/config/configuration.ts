import { Configuration as IConfiguration } from './index';

export const Configuration: IConfiguration = {
    downloading: {
        maxConcurrentDownloads: 30,
    },
    processing: {
        outputFilePath: '/tmp/output.mp4',
    },
    telegram: {
        apiId: 0,
        apiHash: '0',
        phone: '+0',
        botChatAlias: '@0',

        smsCodePooling: {
            endpoint: 'https://0',
            pollingInterval: 5_000,
            poolingTimeout: 60_000,
        },
    },
}