import {
    GetVideoWithRequestersResponse,
    VideoEntity,
    VideoRepository as IVideoRepository, VideoStatus
} from './interfaces/video-repository';
import { firestore } from './contexts/firestore-context';
import { Semaphore } from 'async-mutex';

export class VideoRepository implements IVideoRepository {
    private static readonly semaphore = new Semaphore(1);

    public async getVideo(signedLink: string): Promise<VideoEntity | undefined> {
        return VideoRepository.semaphore.runExclusive(async () => {
            const key = VideoRepository.toKey(signedLink);

            const doc = await firestore
                .collection('videos')
                .doc(key)
                .get();

            return doc.data() as VideoEntity;
        });
    }

    public async addVideoIfNotExist(video: VideoEntity): Promise<void> {
        return VideoRepository.semaphore.runExclusive(async () => {
            const key = VideoRepository.toKey(video.signedLink);
            const videoDocument = firestore.collection('videos').doc(key);
            if ((await videoDocument.get()).exists) {
                return;
            }

            await videoDocument.create(video);
        });
    }

    public async addRequester(signedLink: string, requesterUserId: number): Promise<void> {
        return VideoRepository.semaphore.runExclusive(async () => {
            const key = VideoRepository.toKey(signedLink);
            const videoDocument = firestore.collection('videos').doc(key);
            const requesterDocument = videoDocument
                .collection('requesters')
                .doc(requesterUserId.toString());

            await requesterDocument.set({ userId: requesterUserId });
        });
    }

    public async getVideoWithRequesters(signedLink: string): Promise<GetVideoWithRequestersResponse> {
        return VideoRepository.semaphore.runExclusive(async () => {
            const key = VideoRepository.toKey(signedLink);
            const videoDocument = firestore.collection('videos').doc(key);
            const [videoSnapshot, requestersSnapshot] = await Promise.all([
                videoDocument.get(),
                videoDocument.collection('requesters').get(),
            ]);

            const video = videoSnapshot.data() as VideoEntity;
            const requesters = requestersSnapshot.docs.map((doc) => doc.data().userId);

            return { video, requesters };
        });
    }

    public async clearRequesters(signedLink: string): Promise<void> {
        return VideoRepository.semaphore.runExclusive(async () => {
            const key = VideoRepository.toKey(signedLink);
            const videoDocument = firestore.collection('videos').doc(key);
            const requestersSnapshot = await videoDocument.collection('requesters').get();

            await firestore.runTransaction(async (transaction) => {
                requestersSnapshot.docs.forEach((doc) => transaction.delete(doc.ref));
            });
        });
    }

    public async markAsUploaded(signedLink: string, fileId: string): Promise<void> {
        return VideoRepository.semaphore.runExclusive(async () => {
            const key = VideoRepository.toKey(signedLink);

            await firestore
                .collection('videos')
                .doc(key)
                .update({
                    fileId,
                    status: VideoStatus.Uploaded,
                    updatedAt: new Date(),
                });
        });
    }

    public async markAsFailed(signedLink: string): Promise<void> {
        return VideoRepository.semaphore.runExclusive(async () => {
            const key = VideoRepository.toKey(signedLink);

            await firestore
                .collection('videos')
                .doc(key)
                .update({
                    status: VideoStatus.Failed,
                    updatedAt: new Date(),
                });
        });
    }

    private static toKey(signedLink: string): string {
        return signedLink.replaceAll('/', '|');
    }
}