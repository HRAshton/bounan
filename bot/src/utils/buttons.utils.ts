import { Configuration } from '../config/configuraion';
import { InlineKeyboardButton } from 'telegraf/src/core/types/typegram';
import { Markup } from 'telegraf';
import { AllCommands } from '../services/handlers';

const buildCommandMessage = (command: AllCommands, ...args: (string | number | null)[]): string => {
    return `${command} ${args.join(' ')}`;
};

const getEpisodesButtons = (allEpisodes: number[], malId: number, dubKey: string, episode: number) => {
    const { columns, rows } = Configuration.telegram.buttonsPagination;

    const buttons: InlineKeyboardButton[] = allEpisodes.map((ep) =>
        ep === episode
            ? Markup.button.url(`[${ep}]`, 'tg://example') // empty url to make button unclickable
            : Markup.button.callback(ep.toString(), buildCommandMessage('.см', malId, dubKey, ep)));

    const pages = buttons.groupBy((_, i) => Math.floor(i / (columns * rows - 2)));
    const currentPage = Math.floor(allEpisodes.indexOf(episode) / (columns * rows - 2));
    const buttonsToDisplay = pages[currentPage];

    if (currentPage !== 0) {
        const lastEpOnPrevPage = allEpisodes[(currentPage - 1) * (columns * rows - 2) + (columns * rows - 3)];
        buttonsToDisplay.unshift(
            Markup.button.callback('<<', buildCommandMessage('.см', malId, dubKey, lastEpOnPrevPage)),
        );
    }

    if (currentPage !== pages.length - 1) {
        const firstEpOnNextPage = allEpisodes[(currentPage + 1) * (columns * rows - 2)];
        buttonsToDisplay.push(
            Markup.button.callback('>>', buildCommandMessage('.см', malId, dubKey, firstEpOnNextPage)),
        );
    }

    return buttonsToDisplay.groupBy((_, i) => Math.floor(i / columns));
};

export const getButtonsBlocks = (
    malId: number,
    dubKey: string,
    currentEpisode: number,
    allEpisodes: number[],
): InlineKeyboardButton[][] => {
    const sortedEpisodes = allEpisodes
        .distinctBy((item) => item)
        .sortBy((a) => a);

    const rows = sortedEpisodes.length > 1
        ? getEpisodesButtons(sortedEpisodes, malId, dubKey, currentEpisode)
        : [];

    rows.push([Markup.button.callback('🔍 О релизе', buildCommandMessage('.инфо', malId))]);
    return rows;
};
