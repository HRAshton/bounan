import { StringSession } from 'telegram/sessions';
import { TelegramClient as GramjsClient } from 'telegram';
import { Configuration } from '../../config/configuration';
import { Logger } from 'sitka';
import { LifetimeConfigurationRepository } from '../../config';
import { TelegramClient as ITelegramClient } from './interfaces/telegram-client';
import { SmsCodeProvider } from '../sms-code-api/interfaces/sms-code-provider';
import { CustomFile } from 'telegram/client/uploads';
import * as fs from 'fs';

export class TelegramClient implements ITelegramClient {
    private client: GramjsClient | undefined;
    private logger: Logger;

    constructor(
        private lifetimeConfiguration: LifetimeConfigurationRepository,
        private smsCodeProvider: SmsCodeProvider,
    ) {
        this.logger = Logger.getLogger({ name: this.constructor.name });
    }

    public async start(): Promise<void> {
        this.logger.info('Starting Telegram client...');

        const { apiId, apiHash } = Configuration.telegram;
        const session = await this.lifetimeConfiguration.getSession() ?? '';

        this.client = new GramjsClient(new StringSession(session), apiId, apiHash, {});

        await this.client.start({
            phoneNumber: Configuration.telegram.phone,
            phoneCode: async () => await this.smsCodeProvider.waitForSmsCodeOrThrow(),
            onError: (err) => this.logger.error('Error: ', err),
        });

        this.logger.info('Telegram client started!');

        await this.lifetimeConfiguration.setSession(this.client.session.save() as unknown as string);
    }

    public stop(): Promise<void> {
        this.logger.info('Stopping Telegram client...');
        return this.client?.disconnect() ?? Promise.resolve();
    }

    public async sendVideo(file: string, message: string, thumbnail: Buffer): Promise<void> {
        this.logger.info(`Uploading video to chat ${Configuration.telegram.botChatAlias}`);

        if (this.client?.connected !== true) {
            throw new Error('Telegram client is not connected');
        }

        const toUpload = new CustomFile(file, fs.statSync(file).size, file);
        const fileResult = await this.client.uploadFile({
            file: toUpload,
            workers: Configuration.telegram.uploadWorkers,
        });

        await this.client.sendFile(
            Configuration.telegram.botChatAlias,
            {
                caption: message,
                file: fileResult,
                thumb: thumbnail,
            },
        );

        this.logger.debug(`Video uploaded to chat ${Configuration.telegram.botChatAlias}`);
    }
} 
