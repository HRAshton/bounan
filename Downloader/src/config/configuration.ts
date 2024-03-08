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
        maxConcurrentDownloads: parseInt(getEnv('DOWNLOADING__MAX_CONCURRENT_DOWNLOADS', '5')),
    },
    processing: {
        outputFilePath: getEnv('PROCESSING__OUTPUT_FILE_PATH', '/tmp/output.mp4'),
    },
    telegram: {
        apiId: parseInt(getEnv('TELEGRAM__API_ID')),
        apiHash: getEnv('TELEGRAM__API_HASH'),
        phone: getEnv('TELEGRAM__PHONE'),
        botChatAlias: getEnv('TELEGRAM__BOT_CHAT_ALIAS'),

        uploadWorkers: parseInt(getEnv('TELEGRAM__UPLOAD_WORKERS', '10')),

        smsCodePooling: {
            endpoint: getEnv('TELEGRAM__SMS_CODE_POOLING__ENDPOINT'),
            pollingInterval: parseInt(getEnv('TELEGRAM__SMS_CODE_POLLING__INTERVAL', '5000')),
            poolingTimeout: parseInt(getEnv('TELEGRAM__SMS_CODE_POOLING__TIMEOUT', '60000')),
        },
    },
    axios: {
        retries: parseInt(getEnv('AXIOS__RETRIES', '3')),
    },
    sqs: {
        queueUrl: getEnv('SQS__QUEUE_URL'),
        waitTimeSeconds: parseInt(getEnv('SQS__WAIT_TIME_SECONDS', '20')),
    },
}