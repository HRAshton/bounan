import { Logger } from 'sitka';
import { TelegramClient } from "./apis/telegram/telegram-client";
import { lifetimeConfiguration } from "./config/lifetime-configuration";
import { CopyingService } from "./services/copying-service";
import { LoanApiClient } from "./apis/loan-api/loan-api-client";
import axiosRetry from "axios-retry";
import axios from "axios";
import { Api } from "telegram";
import Message = Api.Message;

axiosRetry(axios, { retries: 3 });

class Main {
    private _logger: Logger;

    constructor() {
        this._logger = Logger.getLogger({ name: this.constructor.name });
    }

    public async main(): Promise<void> {
        this._logger.info('Starting application...');

        const loanApiClient = new LoanApiClient();
        const telegramClient = new TelegramClient(lifetimeConfiguration);
        const copyingService = new CopyingService(loanApiClient, telegramClient);

        telegramClient.onMessage(async (message: Message) =>
            await this.processMessage(message, copyingService));

        process.on('SIGINT', () => this.onStop(telegramClient));

        await telegramClient.start();

        await this.run(telegramClient, copyingService);

        await new Promise(() => {
        });
    }

    private async onStop(telegramClient: TelegramClient): Promise<void> {
        this._logger.info('SIGINT signal received. Stopping application...');
        await telegramClient.stop();
        process.exit(0);
    }

    private async run(telegramClient: TelegramClient, copyingService: CopyingService): Promise<void> {
        const messages = await telegramClient.getMessages(lifetimeConfiguration.lastMessageId);

        for (const message of messages) {
            await this.processMessage(message, copyingService);
        }
    }

    private async processMessage(message: Message, copyingService: CopyingService): Promise<void> {
        await copyingService.copyVideoToTelegram(message);

        if (message.id > lifetimeConfiguration.lastMessageId) {
            lifetimeConfiguration.lastMessageId = message.id;
        }
    }
}

new Main().main()
    .then(() => {
        console.log('Application finished!');
    })
    .catch(e => {
        console.error('Application failed to start: ', e);
    });
