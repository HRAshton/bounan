import { Context } from 'telegraf';

export interface BotCommandHandleService {
    handleStart(ctx: Context): Promise<void>;

    handleText(messageId: number, text: string, userId: number, ctx: Context): Promise<void>;

    handleInlineQuery(query: string, ctx: Context): Promise<void>;

    handleVideo(userId: number, text: string, fileId: string): Promise<void>;
}