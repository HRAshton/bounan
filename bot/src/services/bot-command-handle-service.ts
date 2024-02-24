import { ShikimoriApiClient } from '../apis/shikimori/interfaces/shikimori-api-client';
import { LoanApiClient } from '../apis/loan-api/interfaces/loan-api-client';
import { Logger } from 'sitka';
import { Context } from 'telegraf';
import * as InlineQueryHandlers from './handlers/inline-query-handlers';
import * as TextHandlers from './handlers/text-handlers';
import { BotCommandHandleService as IBotCommandHandleService } from './interfaces/bot-command-handle-service';
import { Configuration } from '../config/configuraion';
import { VideoService } from './interfaces/video-service';
import { InlineCommands, TextCommands } from './handlers';

export class BotCommandHandleService implements IBotCommandHandleService {
    private logger: Logger;

    constructor(
        private readonly shikimoriClient: ShikimoriApiClient,
        private readonly loanClient: LoanApiClient,
        private readonly videoService: VideoService,
    ) {
        this.logger = Logger.getLogger({ name: this.constructor.name });

        this.handleStart = this.handleStart.bind(this);
        this.handleText = this.handleText.bind(this);
        this.handleInlineQuery = this.handleInlineQuery.bind(this);
    }

    public async handleStart(ctx: Context): Promise<void> {
        try {
            this.logger.debug('handleStart');

            await ctx.reply('Напиши название аниме или нажми на кнопку "Искать", и я найду его для тебя', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Искать', switch_inline_query_current_chat: '' }],
                    ],
                },
            });
        } catch (error) {
            this.logger.error('Fatal error', error);
        }
    }

    public async handleText(messageId: number, text: string, userId: number, ctx: Context): Promise<void> {
        try {
            this.logger.debug(`handleText: ${text}`);

            const isKnownAnswer = Object.keys(InlineQueryHandlers.KnownInlineAnswers).includes(text);
            if (isKnownAnswer) {
                await ctx.deleteMessage(messageId);
                return;
            }

            if (userId === Configuration.telegram.videoProviderUserId) {
                this.logger.warn(`Text from video provider: ${text}`);
                const isUrl = text.startsWith('http');
                if (isUrl) {
                    await this.videoService.registerFile(text, '');
                }
                return;
            }

            const [command, ...args] = text.startsWith('.')
                ? text.split(' ')
                : [null, text];

            const handlers: Record<TextCommands, TextHandlers.TextHandler> = {
                '.инфо': TextHandlers.processInfoCommand,
                '.см': TextHandlers.processTextWatchCommand,
            };

            const handler = handlers[command as TextCommands] || TextHandlers.processTextSearchCommand;

            await handler({
                args,
                shikimoriClient: this.shikimoriClient,
                loanClient: this.loanClient,
                videoService: this.videoService,
                ctx,
            });
        } catch (error) {
            this.logger.error('Fatal error', error);
        }
    }

    public async handleInlineQuery(query: string, ctx: Context): Promise<void> {
        try {
            this.logger.debug(`handleInlineQuery: ${query}`);

            const [command, ...args] = query.startsWith('.')
                ? query.split(' ')
                : [null, query];

            const handlers: Record<InlineCommands, InlineQueryHandlers.InlineHandler> = {
                '.см': InlineQueryHandlers.processInlineWatchCommand,
                '.св': InlineQueryHandlers.processInlineRelatedCommand,
            };

            const handler = handlers[command as InlineCommands] || InlineQueryHandlers.processInlineSearchCommand;

            const inlineResult = await handler({
                args,
                shikimoriClient: this.shikimoriClient,
                loanClient: this.loanClient,
            });
            if (!inlineResult) {
                return;
            }

            const firstResults = inlineResult.slice(0, 50);

            await ctx.answerInlineQuery(firstResults);
        } catch (error) {
            this.logger.error('Fatal error', error);
        }
    }

    public async handleVideo(userId: number, text: string, fileId: string): Promise<void> {
        try {
            this.logger.debug(`handleVideo: ${userId} ${fileId}`);

            if (userId !== Configuration.telegram.videoProviderUserId) {
                this.logger.warn(`handleVideo: unknown user: ${userId}`);
                return;
            }

            this.logger.debug(`handleVideo: known user: ${userId}`);
            this.videoService.registerFile(text, fileId);
        } catch (error) {
            this.logger.error('Fatal error', error);
        }
    }
}