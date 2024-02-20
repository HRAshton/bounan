import { Api } from 'telegram';
import Message = Api.Message;

export interface TelegramClient {
    start(): Promise<void>;

    stop(): Promise<void>;

    getMessages(minId: number): Promise<Message[]>;

    sendVideo(file: string, message: string, thumbnail: Buffer): Promise<void>;
}