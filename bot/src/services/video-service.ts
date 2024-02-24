import { TryGetFileIdParams, VideoService as IVideoService } from './interfaces/video-service';
import { VideoRepository, VideoStatus } from '../repositories/interfaces/video-repository';
import { Logger } from 'sitka';
import { Markup, Telegram } from 'telegraf';
import { Configuration } from '../config/configuraion';
import { ShikimoriApiClient } from '../apis/shikimori/interfaces/shikimori-api-client';
import { HtmlParser } from '../apis/loan-api';
import axios from 'axios';
import { getButtonsBlocks } from '../utils/buttons.utils';
import { dubToKey } from '../utils/anime.utils';
import { BotLoanApiClient as LoanApiClient } from '../apis/loan-api';


export class VideoService implements IVideoService {
    private logger: Logger;

    constructor(
        private readonly shikimoriClient: ShikimoriApiClient,
        private readonly loanClient: LoanApiClient,
        private readonly telegramClient: Telegram,
        private readonly videoRepository: VideoRepository,
    ) {
        this.logger = Logger.getLogger({ name: this.constructor.name });
    }

    public async tryGetFileId(params: TryGetFileIdParams): Promise<{ status: VideoStatus, fileId?: string }> {
        const { signedLink, userId, malId, episode } = params;
        this.logger.debug(`tryGetVideoFileId: ${signedLink}`);
        const video = await this.videoRepository.getVideo(signedLink);

        switch (video?.status) {
        case undefined:
            this.logger.debug(`tryGetVideoFileId: ${signedLink} - not found`);
            await this.registerVideo(signedLink, malId, episode);
            await this.videoRepository.addRequester(signedLink, userId);
            await this.requestVideo(signedLink);
            return { status: VideoStatus.Pending };
        case VideoStatus.Pending:
            this.logger.debug(`tryGetVideoFileId: ${signedLink} - no fileId`);
            await this.videoRepository.addRequester(signedLink, userId);
            return { status: VideoStatus.Pending };
        case VideoStatus.Failed:
            this.logger.debug(`tryGetVideoFileId: ${signedLink} - failed`);
            return { status: VideoStatus.Failed };
        case VideoStatus.Uploaded:
            this.logger.debug(`tryGetVideoFileId: ${signedLink} - found`);
            return { status: VideoStatus.Uploaded, fileId: video.fileId };
        default:
            throw new Error('Unexpected video status');
        }
    }

    public async registerFile(signedLink: string, fileId: string): Promise<void> {
        this.logger.debug(`registerFile: ${signedLink}, ${fileId}`);

        if (!signedLink) {
            this.logger.error(`registerFile: ${signedLink}, ${fileId} - invalid input`);
            return;
        }

        if (fileId) {
            await this.videoRepository.markAsUploaded(signedLink, fileId);
            await this.notifyRequestersSuccess(signedLink, fileId);
            await this.requestNextEpisode(signedLink);
            this.logger.debug(`registerFile: ${signedLink}, ${fileId} - done`);
        } else {
            await this.videoRepository.markAsFailed(signedLink);
            await this.notifyRequestersFailure(signedLink);
            this.logger.debug(`registerFile: ${signedLink}, ${fileId} - failed`);
            return;
        }
    }

    private async registerVideo(signedLink: string, malId: number, episode: number): Promise<void> {
        this.logger.debug(`registerVideo: ${signedLink}`);
        const response = await axios.get(signedLink);
        const html = response.data;
        const videoInfo = HtmlParser.parseHtml(html);

        this.logger.debug(`registerVideo: ${signedLink} - animeInfo: ${JSON.stringify(videoInfo)}`);
        const video = {
            signedLink,
            myAnimeListId: malId,
            dub: videoInfo.dub,
            episode,
            status: VideoStatus.Pending,
            fileId: '',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await this.videoRepository.addVideoIfNotExist(video);
    }

    private async requestNextEpisode(signedLink: string): Promise<void> {
        const video = await this.videoRepository.getVideo(signedLink);
        if (video?.status !== VideoStatus.Uploaded) {
            throw new Error('Video is not uploaded. Why is it requested?');
        }

        const nextEpisode = video.episode + 1;
        const loanInfo = await this.loanClient.search(video.myAnimeListId);
        const nextEpisodeInfo = loanInfo.find(x => x.episode === nextEpisode && x.dub === video.dub);
        if (!nextEpisodeInfo) {
            return;
        }

        const alreadyRequested = await this.videoRepository.getVideo(nextEpisodeInfo.signedLink);
        if (alreadyRequested) {
            return;
        }

        await this.registerVideo(nextEpisodeInfo.signedLink, video.myAnimeListId, nextEpisode);
        await this.requestVideo(nextEpisodeInfo.signedLink);
    }

    private async requestVideo(signedLink: string): Promise<void> {
        await this.telegramClient.sendMessage(Configuration.telegram.videoProviderUserId, signedLink);
        this.logger.debug(`requestVideo: ${signedLink}`);
    }

    private async notifyRequestersSuccess(signedLink: string, fileId: string): Promise<void> {
        const { video, requesters } = await this.videoRepository.getVideoWithRequesters(signedLink);
        const [animeInfo, loanInfo] = await Promise.all([
            this.shikimoriClient.animeInfo(video.myAnimeListId),
            this.loanClient.search(video.myAnimeListId),
        ]);

        const allEpisodes = loanInfo.map(x => x.episode);
        const extra = {
            caption: `Серия ${video.episode} аниме ${animeInfo.russian} готова`,
            ...Markup.inlineKeyboard(
                getButtonsBlocks(video.myAnimeListId, dubToKey(video.dub), video.episode, allEpisodes)),
        };

        for (const requester of requesters) {

            await this.telegramClient.sendVideo(requester, fileId, extra);
        }

        await this.videoRepository.clearRequesters(signedLink);
    }

    private async notifyRequestersFailure(signedLink: string): Promise<void> {
        const { video, requesters } = await this.videoRepository.getVideoWithRequesters(signedLink);
        const animeInfo = await this.shikimoriClient.animeInfo(video.myAnimeListId);

        for (const requester of requesters) {
            await this.telegramClient.sendMessage(
                requester,
                `Я не смог найти ${video.episode} серию аниме ${animeInfo.russian}.`
                + ' Какая-то ошибка, разработчик уже уведомлен',
            );
        }

        await this.videoRepository.clearRequesters(signedLink);
    }
}