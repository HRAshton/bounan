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
    loanApi: {
        token: getEnv('LOAN_API_TOKEN'),
    },
    telegram: {
        botToken: getEnv('TELEGRAM_BOT_TOKEN'),
        videoProviderUserId: parseInt(getEnv('VIDEO_PROVIDER_USER_ID')),
        buttonsPagination: {
            columns: parseInt(getEnv('TELEGRAM_BUTTONS_COLUMNS', '7')),
            rows: parseInt(getEnv('TELEGRAM_BUTTONS_ROWS', '3')),
        },
    },
    shikimori: {
        baseDomain: getEnv('SHIKIMORI_BASE_DOMAIN', 'https://shikimori.one'),
    },
    axios: {
        retries: parseInt(getEnv('AXIOS_RETRIES', '3')),
    },
    storage: {
        filesTableName: getEnv('FILES_TABLE_NAME'),
    },
}