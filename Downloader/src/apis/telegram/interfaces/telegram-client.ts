export interface TelegramClient {
    start(): Promise<void>;

    stop(): Promise<void>;

    getMessages(minId: number): Promise<any>;

    sendVideo(file: string, message: string, thumbnail: Buffer): Promise<void>;
}