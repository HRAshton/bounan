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
        phone: '0',
        botChatAlias: '@0',
    },
}