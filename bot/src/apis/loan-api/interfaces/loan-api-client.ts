import { SearchResultItem } from './search-result-item';

export interface LoanApiClient {
    search(myAnimeListId: number): Promise<SearchResultItem[]>;
}