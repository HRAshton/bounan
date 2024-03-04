export interface TelegramClient {
    start(): Promise<void>;

    stop(): Promise<void>;

    sendVideo(file: string, message: string, thumbnail: Buffer): Promise<void>;
}