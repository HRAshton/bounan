export interface AnimeInfo {
    id: number;
    name: string;
    russian: string;
    episodes: number;
    aired_on: string;
    url: string;
    image: {
        preview: string;
    };
}