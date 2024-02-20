export type LoanApiConfig = Record<string, string>;
export type QualityPlaylistPairs = Record<string, string>;

export type QualityPlaylistPairsWithThumbnail = {
    playlists: QualityPlaylistPairs;
    thumbnail: string;
};

export interface LoanApiClient {
    isSignedUrlValid(signedUrl: any): boolean;

    getHlsPlaylistUrls(signedUrl: string): Promise<QualityPlaylistPairsWithThumbnail>;
}