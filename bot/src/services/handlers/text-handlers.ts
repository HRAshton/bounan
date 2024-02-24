import { Context, Markup } from 'telegraf';
import { Configuration } from '../../config/configuraion';
import { ShikimoriApiClient } from '../../apis/shikimori/interfaces/shikimori-api-client';
import { BotLoanApiClient as LoanApiClient } from '../../apis/loan-api';
import { AllCommands } from './index';
import { dubToKey } from '../../utils/anime.utils';
import { SearchResultItem } from '../../apis/loan-api';
import { VideoService } from '../interfaces/video-service';
import { VideoStatus } from '../../repositories/interfaces/video-repository';
import { getButtonsBlocks } from '../../utils/buttons.utils';

export type TextHandlerParams = {
    args: (string | null)[];
    shikimoriClient: ShikimoriApiClient;
    loanClient: LoanApiClient;
    videoService: VideoService;
    ctx: Context;
};

export type TextHandler = (params: TextHandlerParams) => Promise<void>;

const buildCommandMessage = (command: AllCommands, ...args: (string | number | null)[]): string => {
    return `${command} ${args.join(' ')}`;
};

const sendSwitchDubMessage = async (
    searchResults: SearchResultItem[],
    malId: number,
    episode: number,
    ctx: Context,
) => {
    const inOtherDubs = searchResults
        .filter((item) => item.episode === episode)
        .sortBy((item) => item.dub);

    await ctx.reply('Серии нет в этом переводе. Попробуйте другой', {
        reply_markup: {
            inline_keyboard: [
                inOtherDubs.map((ep) => Markup.button.callback(
                    ep.dub,
                    buildCommandMessage('.см', malId, dubToKey(ep.dub), ep.episode)))
            ]
        },
    });
};

const sendAnilibriaMessage = async (ctx: Context) => {
    await ctx.reply('У нас нет релизов Анилибрии, но у них есть отличный бот. Попробуйте там:',
        Markup.inlineKeyboard([
            Markup.button.url('AnilibriaBot', 'https://t.me/anilibria_bot'),
        ]),
    );

}

export const processTextSearchCommand = async ({ args, shikimoriClient, ctx }: TextHandlerParams): Promise<void> => {
    const query = args.join(' ');
    const searchResults = await shikimoriClient.searchAnime(query);

    if (searchResults.length === 0) {
        await ctx.reply('Ничего не найдено');
        return;
    }

    const buttons = searchResults
        .slice(0, 10)
        .map((anime) => [{
            text: anime.russian || anime.name,
            switch_inline_query_current_chat: buildCommandMessage('.см', anime.id),
        }]);

    await ctx.reply('Наиболее подходящие результаты:', {
        reply_markup: {
            inline_keyboard: buttons,
        },
    });
};

export const processInfoCommand = async ({ args, shikimoriClient, ctx }: TextHandlerParams): Promise<void> => {
    const malId = parseInt(args[0] || '');
    if (!Number.isSafeInteger(malId)) {
        return;
    }

    const anime = await shikimoriClient.animeInfo(malId);
    if (!anime) {
        await ctx.reply('Аниме не найдено');
        return;
    }

    await ctx.replyWithPhoto(Configuration.shikimori.baseDomain + anime.image?.preview, {
        caption: `${anime.russian || anime.name} (${anime.aired_on?.substring(0, 4)})`,
        reply_markup: {
            inline_keyboard: [[{
                text: 'Смотреть',
                switch_inline_query_current_chat: buildCommandMessage('.см', anime.id),
            }, {
                text: 'Франшиза',
                switch_inline_query_current_chat: buildCommandMessage('.св', anime.id),
            }]],
        },
    });
};

export const processTextWatchCommand = async (
    { args, loanClient, videoService, ctx }: TextHandlerParams,
): Promise<void> => {
    const [malIdStr, dubKey, episodeStr] = args;

    const malId = parseInt(malIdStr || '');
    const episode = parseInt(episodeStr || '');
    if (!Number.isSafeInteger(malId) || !Number.isSafeInteger(episode) || !dubKey) {
        return;
    }

    if (dubKey.includes('anilibria')) {
        await sendAnilibriaMessage(ctx);
        return;
    }

    const searchResults = await loanClient.search(malId);
    if (searchResults.length === 0) {
        await ctx.reply('Этого аниме (пока?) нет в базе');
        return;
    }

    const selectedVideo = searchResults.find((item) => item.episode === episode && dubToKey(item.dub) === dubKey);
    const rows = getButtonsBlocks(malId, dubKey, episode, searchResults.map(x => x.episode));

    if (!selectedVideo) {
        await sendSwitchDubMessage(searchResults, malId, episode, ctx);
        return;
    }

    if (!ctx.from?.id) {
        throw new Error('User id is not found');
    }
    const { status, fileId } = await videoService.tryGetFileId({
        signedLink: selectedVideo.signedLink,
        userId: ctx.from.id,
        malId,
        episode,
    });
    if (status === VideoStatus.Pending) {
        await ctx.reply('Видео готовится. Я пришлю его, как только будет готово');
        return;
    }

    if (status === VideoStatus.Failed) {
        await ctx.reply('Я не смог найти эту серию. Какая-то ошибка, разработчик уже уведомлен');
        return;
    }

    if (!fileId) {
        throw new Error('File id is not found');
    }

    await ctx.replyWithVideo(fileId, {
        caption: `Серия ${selectedVideo.episode} в переводе ${selectedVideo.dub}`,
        ...Markup.inlineKeyboard(rows),
    })
};
