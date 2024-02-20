import { StringSession } from "telegram/sessions";
import { Api, TelegramClient as NativeClient } from "telegram";
import { Configuration } from "../../config/configuraion";
// @ts-ignore
import input from "input";
import { Logger } from "sitka";
import { NewMessage, NewMessageEvent } from "telegram/events";
import { LifetimeConfiguration } from "../../config";
import { TelegramClient as ITelegramClient } from "./interfaces/telegram-client";
import Message = Api.Message;

export class TelegramClient implements ITelegramClient {
    private onMessageCallback: ((event: Message) => void) | undefined;

    private client: NativeClient;
    private logger: Logger;

    constructor(
        private lifetimeConfiguration: LifetimeConfiguration,
    ) {
        const { apiId, apiHash, botChatAlias } = Configuration.telegram;

        this.logger = Logger.getLogger({ name: this.constructor.name });
        this.client = new NativeClient(new StringSession(lifetimeConfiguration.session), apiId, apiHash, {});

        this.client.addEventHandler(
            (event: NewMessageEvent) => {
                if (!this.onMessageCallback) {
                    throw new Error("onMessage callback is not set!");
                }

                this.onMessageCallback(event.message);
            },
            new NewMessage(
                {
                    incoming: true,
                    outgoing: false,
                    fromUsers: [botChatAlias, '@HRAshton'],
                },
            ),
        );
    }

    public onMessage(callback: (event: Message) => void): void {
        if (!!this.onMessageCallback) {
            throw new Error("onMessage callback is already set!");
        }

        this.onMessageCallback = callback;
    }

    public async start(): Promise<void> {
        this.logger.info("Starting Telegram client...");

        await this.client.start({
            phoneNumber: Configuration.telegram.phone,
            phoneCode: async () => await input.text("Please enter the code you received: "),
            onError: (err) => this.logger.error("Error: ", err),
        });

        this.logger.info("Telegram client started!");

        this.lifetimeConfiguration.session = this.client.session.save() as unknown as string;
    }

    public stop(): Promise<void> {
        this.logger.info("Stopping Telegram client...");
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

        await this.client.sendMessage(
            Configuration.telegram.botChatAlias,
            {
                message,
                file,
                thumb: thumbnail,
            },
        );

        this.logger.debug(`Video uploaded to chat ${Configuration.telegram.botChatAlias}`);
    }
} 
