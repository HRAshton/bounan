import { VideoStatus } from '../../repositories/interfaces/video-repository';

export type TryGetFileIdParams = {
    signedLink: string;
    userId: number;
    malId: number;
    episode: number;
};

export interface VideoService {
    tryGetFileId(params: TryGetFileIdParams): Promise<{ status: VideoStatus, fileId?: string }>;

    registerFile(signedLink: string, fileId: string): Promise<void>;
}