export enum VideoStatus {
    Pending = 'pending',
    Uploaded = 'uploaded',
    Failed = 'failed',
}

export interface VideoEntity {
    signedLink: string;
    myAnimeListId: number;
    dub: string;
    episode: number;
    videoStatus: VideoStatus;
    fileId: string;
    createdAt: string;
    updatedAt: string;
}

export type VideoWithRequesters = VideoEntity & { requesters: Set<number> };

export interface VideoRepository {
    getVideo(signedLink: string): Promise<VideoEntity | null>;

    addVideoIfNotExist(video: VideoEntity): Promise<void>;

    addRequester(signedLink: string, requesterUserId: number): Promise<void>;

    getVideoWithRequesters(signedLink: string): Promise<VideoWithRequesters>;

    clearRequesters(signedLink: string): Promise<void>;

    markAsUploaded(signedLink: string, fileId: string): Promise<void>;

    markAsFailed(signedLink: string): Promise<void>;
}