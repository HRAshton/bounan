import { AnimeInfo } from './anime-info';

export interface RelatedItem {
    relation: string;
    relation_russian: string;
    anime: AnimeInfo;
}