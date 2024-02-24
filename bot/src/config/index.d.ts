export interface Configuration {
    firebaseConfigJson: string;
    loanApi: {
        token: string;
    };
    telegram: {
        botToken: string;
        videoProviderUserId: number;
        buttonsPagination: {
            columns: number;
            rows: number;
        }
    };
    shikimori: {
        baseDomain: string;
    };
    axios: {
        retries: number;
    };
}
