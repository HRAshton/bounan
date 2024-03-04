import 'dotenv/config';
import { Logger } from 'sitka';
import { TelegramClient } from './apis/telegram/telegram-client';
import { lifetimeConfiguration } from './config/lifetime-configuration';
import { CopyingService } from './services/copying-service';
import axiosRetry from 'axios-retry';
import axios from 'axios';
import { SmsCodeProvider } from './apis/sms-code-api/sms-code-provider';
import { pause } from './utils/promise.utils';
import { DwnLoanApiClientImpl } from './apis/loan-api';
import { Configuration } from './config/configuration';
import { QueueService } from './services/queue-service';

axiosRetry(axios, { retries: Configuration.axios.retries });

class Main {
    private _logger: Logger;

    constructor() {
        this._logger = Logger.getLogger({ name: this.constructor.name });
    }

    public async main(): Promise<void> {
        this._logger.info('Starting application...');

        const smsCodeProvider = new SmsCodeProvider();
        const telegramClient = new TelegramClient(lifetimeConfiguration, smsCodeProvider);
        const loanApiClient = new DwnLoanApiClientImpl();
        const copyingService = new CopyingService(loanApiClient, telegramClient);

        const queueService = new QueueService();
        queueService.registerHandler(async (message: string) =>
            await this.processMessage(message, copyingService));

        process.on('SIGINT', () => this.onStop(telegramClient, queueService));

        await telegramClient.start();
        await queueService.start();

        await pause;
    }

    private async onStop(telegramClient: TelegramClient, queueService: QueueService): Promise<void> {
        this._logger.info('SIGINT signal received. Stopping application...');
        await telegramClient.stop();
        queueService.stop();
        process.exit(0);
    }

    private async processMessage(message: string, copyingService: CopyingService): Promise<void> {
        await copyingService.copyVideoToTelegram(message);
    }
}

new Main().main()
    .then(() => {
        console.log('Application finished!');
    })
    .catch(e => {
        console.error('Application failed to start: ', e);
    });
