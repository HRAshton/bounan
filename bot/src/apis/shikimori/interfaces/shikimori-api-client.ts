import { AnimeInfo } from './anime-info';
import { RelatedItem } from './related-item';

export interface ShikimoriApiClient {
    searchAnime(query: string): Promise<AnimeInfo[]>;

    animeInfo(id: number): Promise<AnimeInfo>;

    relatedAnime(id: number): Promise<RelatedItem[]>;
}