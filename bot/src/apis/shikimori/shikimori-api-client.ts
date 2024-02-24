import {
    ShikimoriApiClient as IShikimoriApiClient
} from './interfaces/shikimori-api-client';
import axios from 'axios';
import { AnimeInfo } from './interfaces/anime-info';
import { RelatedItem } from './interfaces/related-item';
import { Configuration } from '../../config/configuraion';

export class ShikimoriApiClient implements IShikimoriApiClient {
    private baseDomain: string = Configuration.shikimori.baseDomain;
    
    public async searchAnime(query: string): Promise<AnimeInfo[]> {
        const response = await axios.get(`${this.baseDomain}/api/animes?limit=50&censored=false&search=${query}`);
        return response.data;
    }

    public async animeInfo(id: number): Promise<AnimeInfo> {
        const response = await axios.get<AnimeInfo>(`${this.baseDomain}/api/animes/${id}`);
        return response.data;
    }

    public async relatedAnime(id: number): Promise<RelatedItem[]> {
        const response = await axios.get<RelatedItem[]>(`${this.baseDomain}/api/animes/${id}/related`);
        return response.data.filter(item => item.anime !== null);
    }
}