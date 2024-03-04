export interface QueueService {
    requestVideo(signedLink: string): Promise<void>;
}