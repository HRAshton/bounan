import { Semaphore } from 'async-mutex';
import { Api } from 'telegram';
import Message = Api.Message;
import { Logger } from 'sitka';
import { LoanApiClient } from '../apis/loan-api/interfaces/loan-api-client';
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

    public async copyVideoToTelegram(message: Message): Promise<void> {
        return await this.semaphore.runExclusive(async () => {
            await this.copyVideoToTelegramInternal(message);
        });
    }

    private async copyVideoToTelegramInternal(message: Message): Promise<void> {
        if (!this.loanApiClient.isSignedUrlValid(message.text)) {
            this.logger.error(`Invalid signed URL: '${message.text}'`);
            return;
        }

        this.logger.info(`Copying video: ${message.text}`);
        const [videoUrls, thumbnail] = await this.getVideoPartsAndThumbnailUrls(message);

        const ffmpeg = this.runFfmpeg();
        await semiConcurrentProcess(
            videoUrls,
            async (url: string) => await this.downloadVideoPart(url),
            (part: ArrayBuffer) => this.processVideoPart(part, ffmpeg.stdin),
            Configuration.downloading.maxConcurrentDownloads,
        );
        ffmpeg.stdin.end();

        this.logger.debug(`Video copied to: ${Configuration.processing.outputFilePath}`);

        const thumbnailBuffer = await this.downloadThumbnail(thumbnail);
        await this.telegramClient.sendVideo(Configuration.processing.outputFilePath, message.text, thumbnailBuffer);

        this.logger.info(`Video sent to chat: ${Configuration.telegram.botChatAlias}`);
    }

    private async downloadThumbnail(thumbnail: string) {
        const thumbnailResponse = await axios.get(thumbnail, { responseType: 'arraybuffer' });
        const thumbnailBuffer = Buffer.from(thumbnailResponse.data);
        this.logger.debug(`Thumbnail downloaded. Length: ${thumbnailBuffer.byteLength}`);

        return thumbnailBuffer;
    }

    private async getVideoPartsAndThumbnailUrls(message: Api.Message): Promise<[string[], string]> {
        const requestedSignedUrl = message.text?.trim();
        this.logger.debug(`Received message: ${requestedSignedUrl}`);

        const { playlists, thumbnail } = await this.loanApiClient.getHlsPlaylistUrls(requestedSignedUrl);
        const bestQualityPlaylist = Object.values(playlists).reverse()[0];
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
        this.logger.debug(`Downloaded video part: ${url}. Length: ${response.data.byteLength}`);
        return response.data;
    }

    private processVideoPart(part: ArrayBuffer, writable: Writable): void {
        this.logger.debug(`Processing video part of length: ${part.byteLength}`);
        writable.write(part);
    }
}
