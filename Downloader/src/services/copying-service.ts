import { Semaphore } from 'async-mutex';
import { Logger } from 'sitka';
import { DwnLoanApiClient as LoanApiClient } from '../apis/loan-api';
import axios from 'axios';
import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { Configuration } from '../config/configuration';
import { Writable } from 'node:stream';
import { semiConcurrentProcess } from '../utils/semi-concurrent-processing.utils';
import { TelegramClient } from '../apis/telegram/interfaces/telegram-client';

export class CopyingService {
    private readonly logger = Logger.getLogger({ name: this.constructor.name });
    private readonly semaphore: Semaphore = new Semaphore(1);

    constructor(
        private loanApiClient: LoanApiClient,
        private telegramClient: TelegramClient,
    ) {
        this.copyVideoToTelegram = this.copyVideoToTelegram.bind(this);
    }

    public async copyVideoToTelegram(signedLink: string): Promise<void> {
        return await this.semaphore.runExclusive(async () => {
            await this.copyVideoToTelegramInternal(signedLink);
        });
    }

    private async copyVideoToTelegramInternal(signedLink: string): Promise<void> {
        if (!this.loanApiClient.isSignedLinkValid(signedLink)) {
            this.logger.error(`Invalid signed URL: '${signedLink}'`);
            return;
        }

        this.logger.info(`Copying video: ${signedLink}`);
        const [videoUrls, thumbnail] = await this.getVideoPartsAndThumbnailUrls(signedLink);

        const ffmpeg = this.runFfmpeg();
        await semiConcurrentProcess(
            videoUrls,
            async (url: string) => await this.downloadVideoPart(url),
            (part: ArrayBuffer, i: number, total: number) => this.processVideoPart(part, ffmpeg.stdin, i, total),
            Configuration.downloading.maxConcurrentDownloads,
        );
        ffmpeg.stdin.end();

        this.logger.debug(`Video copied to: ${Configuration.processing.outputFilePath}`);

        const thumbnailBuffer = await this.downloadThumbnail(thumbnail);
        await this.telegramClient.sendVideo(Configuration.processing.outputFilePath, signedLink, thumbnailBuffer);

        this.logger.info(`Video sent to chat: ${Configuration.telegram.botChatAlias}`);
    }

    private async downloadThumbnail(thumbnail: string) {
        const thumbnailResponse = await axios.get(thumbnail, { responseType: 'arraybuffer' });
        const thumbnailBuffer = Buffer.from(thumbnailResponse.data);
        this.logger.debug(`Thumbnail downloaded. Length: ${thumbnailBuffer.byteLength}`);

        return thumbnailBuffer;
    }

    private async getVideoPartsAndThumbnailUrls(signedLink: string): Promise<[string[], string]> {
        this.logger.debug(`Received message: ${signedLink}`);

        const { playlists, thumbnail } = await this.loanApiClient.getHlsPlaylistUrls(signedLink);
        const bestQualityPlaylist = Object.values(playlists).reverse()[0] as string;
        this.logger.debug(`Best quality playlist: ${bestQualityPlaylist}. Thumbnail: ${thumbnail}`);

        const playlistResponse = await axios.get(bestQualityPlaylist);
        const filenames = playlistResponse.data.split('\n').filter((line: string) => line.startsWith('./'));
        const basePlaylistUrl = bestQualityPlaylist.split('/').slice(0, -1).join('/');
        const videoUrls: string[] = filenames.map((filename: string) => `${basePlaylistUrl}/${filename}`);
        this.logger.debug(`Video URLs: ${videoUrls}`);

        return [videoUrls, thumbnail];
    }

    private runFfmpeg(): ChildProcessWithoutNullStreams {
        return spawn('ffmpeg', [
            '-i', 'pipe:0',
            '-c', 'copy',
            '-f', 'mp4',
            '-y',
            Configuration.processing.outputFilePath,
        ]);
    }

    private async downloadVideoPart(url: string): Promise<ArrayBuffer> {
        this.logger.debug(`Downloading video part: ${url}`);
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        this.logger.debug(`Downloaded video part: ...${url.slice(-35)}. Length: ${response.data.byteLength}`);
        return response.data;
    }

    private processVideoPart(part: ArrayBuffer, writable: Writable, index: number, total: number): void {
        this.logger.debug(`Processing video part #${index + 1}/${total} (${part.byteLength} bytes)`);
        writable.write(part);
    }
}
