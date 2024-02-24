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
    status: VideoStatus;
    fileId: string;
    createdAt: Date;
    updatedAt: Date;
}

export type GetVideoWithRequestersResponse = {
    video: VideoEntity;
    requesters: number[];
};

export interface VideoRepository {
    getVideo(signedLink: string): Promise<VideoEntity | undefined>;

    addVideoIfNotExist(video: VideoEntity): Promise<void>;

    addRequester(signedLink: string, requesterUserId: number): Promise<void>;
    
    getVideoWithRequesters(signedLink: string): Promise<GetVideoWithRequestersResponse>;

    clearRequesters(signedLink: string): Promise<void>;

    markAsUploaded(signedLink: string, fileId: string): Promise<void>;

    markAsFailed(signedLink: string): Promise<void>;
}