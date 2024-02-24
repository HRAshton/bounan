import './extensions/list.extensions';
import { Telegraf } from 'telegraf';
import { callbackQuery, message } from 'telegraf/filters';
import { Configuration } from './config/configuraion';
import { ShikimoriApiClient } from './apis/shikimori/shikimori-api-client';
import { LoanApiClient } from './apis/loan-api/loan-api-client';
import { BotCommandHandleService } from './services/bot-command-handle-service';
import { Message } from 'telegraf/typings/core/types/typegram';
import { VideoService } from './services/video-service';
import { VideoRepository } from './repositories/video-repository';

const bot = new Telegraf(Configuration.telegram.botToken);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

const shikimoriClient = new ShikimoriApiClient();
const loanApiClient = new LoanApiClient();
const videoRepository = new VideoRepository();
const videoService = new VideoService(shikimoriClient, loanApiClient, bot.telegram, videoRepository);
const botCommandHandleService = new BotCommandHandleService(shikimoriClient, loanApiClient, videoService);

bot.command('start', botCommandHandleService.handleStart);

bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query;
    await botCommandHandleService.handleInlineQuery(query, ctx);
});

bot.on(message('text'), async (ctx) => {
    const { messageId, text } = ctx.message as Message.TextMessage;
    const userId = ctx.message.from?.id || 0;
    await botCommandHandleService.handleText(messageId, text, userId, ctx);
});

bot.on(callbackQuery('data'), async (ctx) => {
    const { data } = ctx.callbackQuery;
    const userId = ctx.callbackQuery.from?.id;
    await botCommandHandleService.handleText(0, data, userId, ctx);
    await ctx.answerCbQuery();
});

bot.on([message('video'), message('document')], async (ctx) => {
    const msg = ctx.message as Message.VideoMessage | Message.DocumentMessage;
    const userId = msg.from?.id || 0;
    const signedLink = msg.caption || '';
    const fileId = (msg as Message.VideoMessage).video?.file_id
        || (msg as Message.DocumentMessage).document?.file_id;

    await botCommandHandleService.handleVideo(userId, signedLink, fileId);
});

bot.launch()
