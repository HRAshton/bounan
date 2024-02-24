import { Configuration as IConfiguration } from './index';

export const Configuration: IConfiguration = {
    loanApi: {
        token: '',
    },
    telegram: {
        botToken: '',
        videoProviderUserId: 0,
        buttonsPagination: {
            columns: 7,
            rows: 3,
        },
    },
    shikimori: {
        baseDomain: 'https://shikimori.one',
    },
}