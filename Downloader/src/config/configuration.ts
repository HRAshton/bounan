import { Configuration as IConfiguration } from './index';

const getEnv = (name: string, defaultValue?: string): string => {
    const value = process.env[name];
    if (value !== undefined) {
        return value;
    }

    if (defaultValue !== undefined) {
        return defaultValue;
    }

    throw new Error(`Environment variable ${name} is not defined`);
}

export const Configuration: IConfiguration = {
    downloading: {
        maxConcurrentDownloads: parseInt(getEnv('MAX_CONCURRENT_DOWNLOADS', '5')),
    },
    processing: {
        outputFilePath: getEnv('OUTPUT_FILE_PATH', '/tmp/output.mp4'),
    },
    telegram: {
        apiId: parseInt(getEnv('TELEGRAM_API_ID')),
        apiHash: getEnv('TELEGRAM_API_HASH'),
        phone: getEnv('TELEGRAM_PHONE_NUMBER'),
        botChatAlias: getEnv('TELEGRAM_BOT_CHAT_ALIAS'),

        uploadWorkers: parseInt(getEnv('TELEGRAM_UPLOAD_WORKERS', '10')),

        smsCodePooling: {
            endpoint: getEnv('TELEGRAM_SMS_CODE_POOLING_ENDPOINT'),
            pollingInterval: parseInt(getEnv('TELEGRAM_SMS_CODE_POLLING_INTERVAL', '5000')),
            poolingTimeout: parseInt(getEnv('TELEGRAM_SMS_CODE_POOLING_TIMEOUT', '60000')),
        },
    },
    axios: {
        retries: parseInt(getEnv('AXIOS_RETRIES', '3')),
    },
}