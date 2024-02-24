import { InlineQueryResult } from 'telegraf/typings/core/types/typegram';
import { InlineQueryResultArticle } from '@telegraf/types/inline';
import { AnimeInfo } from '../../apis/shikimori/interfaces/anime-info';
import { Configuration } from '../../config/configuraion';
import { ShikimoriApiClient } from '../../apis/shikimori/interfaces/shikimori-api-client';
import { LoanApiClient } from '../../apis/loan-api/interfaces/loan-api-client';
import { AllCommands } from './index';
import { dubToKey } from '../../utils/anime.utils';

export enum KnownInlineAnswers {
    'Ничего не найдено',
    'Нет связанных аниме',
    'Это аниме недоступно',
}

export type InlineHandlerParams = {
    args: (string | null)[];
    shikimoriClient: ShikimoriApiClient;
    loanClient: LoanApiClient;
};

export type InlineHandler = (params: InlineHandlerParams) => Promise<InlineQueryResult[] | null>;

const buildCommandMessage = (command: AllCommands, ...args: (string | number | null)[]): string => {
    return `${command} ${args.join(' ')}`;
};

const getKnownInlineAnswer = (text: keyof typeof KnownInlineAnswers): InlineQueryResultArticle => ({
    type: 'article',
    id: '1',
    title: text,
    input_message_content: {
        message_text: text,
    },
});

const getAnimeInlineItem = (anime: AnimeInfo): InlineQueryResultArticle => ({
    type: 'article',
    id: anime.id.toString(),
    title: anime.russian || anime.name,
    description: anime.aired_on?.substring(0, 4),
    thumbnail_url: Configuration.shikimori.baseDomain + anime.image?.preview,
    input_message_content: {
        message_text: buildCommandMessage('.инфо', anime.id),
    },
});

export const processInlineSearchCommand = async (
    { args, shikimoriClient }: InlineHandlerParams
): Promise<InlineQueryResult[] | null> => {
    const query = args.join(' ');
    if (query.trim() === '') {
        return null;
    }

    const searchResults = await shikimoriClient.searchAnime(query);

    return searchResults.length === 0
        ? [getKnownInlineAnswer('Ничего не найдено')]
        : searchResults.map(getAnimeInlineItem);
};

export const processInlineRelatedCommand = async (
    { args, shikimoriClient }: InlineHandlerParams
): Promise<InlineQueryResult[] | null> => {
    const malId = parseInt(args[0] || '');
    if (!Number.isSafeInteger(malId)) {
        return null;
    }

    const relatedAnimes = await shikimoriClient.relatedAnime(malId);
    const sorted = relatedAnimes.sortBy((a) => -a.anime.id);

    return sorted.length === 0
        ? [getKnownInlineAnswer('Нет связанных аниме')]
        : sorted.map((relatedAnime) => getAnimeInlineItem(relatedAnime.anime));
};

export const processInlineWatchCommand = async (
    { args, loanClient }: InlineHandlerParams
): Promise<InlineQueryResult[] | null> => {
    const malId = parseInt(args[0] || '');
    if (!Number.isSafeInteger(malId)) {
        return null;
    }

    const searchResults = await loanClient.search(malId);

    if (searchResults.length === 0) {
        return [getKnownInlineAnswer('Это аниме недоступно')];
    }

    const uniqueDubs = searchResults.distinctBy((item) => item.dub);
    const sorted = uniqueDubs.sortBy((a) => a.dub);

    return sorted.map((item) => {
        return {
            type: 'article',
            id: item.dub,
            title: item.dub,
            description: item.quality,
            input_message_content: {
                message_text: buildCommandMessage('.см', malId, dubToKey(item.dub), item.episode),
            },
        }
    });
};
