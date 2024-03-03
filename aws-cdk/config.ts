interface Config {
    // Both.
    loanApiToken: string;
    videoProviderUserId: string;

    // Bot.
    telegramBotToken: string;
    errorAlarmEmail: string;

    // Dwn.
    telegramApiId: string;
    telegramApiHash: string;
    telegramPhoneNumber: string;
    telegramBotChatAlias: string;
    telegramSmsCodePoolingEndpoint: string;
}

export const config: Config = {
    // Loan API token. Used in Dwn&Bot.
    loanApiToken: '',

    // Telegram user id of Downloader bot (which is actually user). Used in Dwn&Bot.
    videoProviderUserId: '',
    
    // Email for error alarm. Used in Bot.
    errorAlarmEmail: '',

    // Telegram bot token. Used in Bot.
    telegramBotToken: '',

    // Telegram API id. Used in Dwn.
    telegramApiId: '',

    // Telegram API hash. Used in Dwn.
    telegramApiHash: '',

    // Telegram phone number. Used in Dwn.
    telegramPhoneNumber: '',

    // Telegram bot chat alias. Used in Dwn.
    telegramBotChatAlias: '',

    // Telegram SMS code pooling endpoint. Used in Dwn.
    telegramSmsCodePoolingEndpoint: '',
};

if (!/^[a-f0-9]{32}$/.test(config.loanApiToken)) {
    throw new Error('Invalid loanApiToken');
}

if (!/^\d{10,}$/.test(config.videoProviderUserId)) {
    throw new Error('Invalid videoProviderUserId');
}

if (!/^\d+:[a-zA-Z0-9_-]{35}$/.test(config.telegramBotToken)) {
    throw new Error('Invalid telegramBotToken');
}

if (!/^\d{5,}$/.test(config.telegramApiId)) {
    throw new Error('Invalid telegramApiId');
}

if (!/^[a-f0-9]{32}$/.test(config.telegramApiHash)) {
    throw new Error('Invalid telegramApiHash');
}

if (!/^\+\d{11,}$/.test(config.telegramPhoneNumber)) {
    throw new Error('Invalid telegramPhoneNumber');
}

if (!/^@[a-zA-Z0-9_]+$/.test(config.telegramBotChatAlias)) {
    throw new Error('Invalid telegramBotChatAlias');
}

if (!/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec\?secretKey=[a-f0-9-]+$/.test(config.telegramSmsCodePoolingEndpoint)) {
    throw new Error('Invalid telegramSmsCodePoolingEndpoint');
}
