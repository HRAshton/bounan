import { StringSession } from 'telegram/sessions';
import { Api, TelegramClient as GramjsClient } from 'telegram';
import { Configuration } from '../../config/configuration';
import { Logger } from 'sitka';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { LifetimeConfiguration } from '../../config';
import { TelegramClient as ITelegramClient } from './interfaces/telegram-client';
import Message = Api.Message;
import { SmsCodeProvider } from '../sms-code-api/interfaces/sms-code-provider';
import { CustomFile } from 'telegram/client/uploads';
import * as fs from 'fs';

export class TelegramClient implements ITelegramClient {
    private onMessageCallback: ((event: Message) => void) | undefined;

    private client: GramjsClient;
    private logger: Logger;

    constructor(
        private lifetimeConfiguration: LifetimeConfiguration,
        private smsCodeProvider: SmsCodeProvider,
    ) {
        const { apiId, apiHash } = Configuration.telegram;

        this.logger = Logger.getLogger({ name: this.constructor.name });
        this.client = new GramjsClient(new StringSession(lifetimeConfiguration.session), apiId, apiHash, {});
    }

    public onMessage(callback: (event: Message) => void): void {
        if (this.onMessageCallback) {
            throw new Error('onMessage callback is already set!');
        }

        this.onMessageCallback = callback;
    }

    public async start(): Promise<void> {
        this.logger.info('Starting Telegram client...');

        if (!this.onMessageCallback) {
            throw new Error('onMessage callback is not set!');
        }
        const onMessageCallback: (event: Message) => void = this.onMessageCallback;

        await this.client.start({
            phoneNumber: Configuration.telegram.phone,
            phoneCode: async () => await this.smsCodeProvider.waitForSmsCodeOrThrow(),
            onError: (err) => this.logger.error('Error: ', err),
        });

        this.client.addEventHandler(
            (event: NewMessageEvent) => onMessageCallback(event.message),
            new NewMessage({
                incoming: true,
                outgoing: false,
                fromUsers: [Configuration.telegram.botChatAlias],
            }),
        );

        this.logger.info('Telegram client started!');

        this.lifetimeConfiguration.session = this.client.session.save() as unknown as string;
    }

    public stop(): Promise<void> {
        this.logger.info('Stopping Telegram client...');
        return this.client.disconnect();
    }

    public async getMessages(minId: number): Promise<Message[]> {
        this.logger.debug(`Getting messages from chat ${Configuration.telegram.botChatAlias}`);
        const unprocessedList = await this.client.getMessages(Configuration.telegram.botChatAlias, { minId });
        const incomingMessages = unprocessedList.filter((message: Message) => message.out === false);
        this.logger.debug(`Messages from chat ${Configuration.telegram.botChatAlias}: ${incomingMessages.length}`);

        return incomingMessages;
    }

    public async sendVideo(file: string, message: string, thumbnail: Buffer): Promise<void> {
        this.logger.info(`Uploading video to chat ${Configuration.telegram.botChatAlias}`);

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
