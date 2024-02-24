'use strict';

import { expect } from 'chai';
import { ShikimoriApiClient } from '../../../../src/apis/shikimori/shikimori-api-client';
import { AnimeInfo } from '../../../../src/apis/shikimori/interfaces/anime-info';

describe('ShikimoriApiClient', () => {
    const checkAnime = (result: AnimeInfo) => {
        expect(result.id).to.be.a('number');
        expect(result.id).to.be.greaterThan(0);

        expect(result.name).to.be.a('string');
        expect(result.name).to.not.be.empty;

        expect(result.russian).to.be.a('string');
        expect(result.russian).to.not.be.empty;

        expect(result.episodes).to.be.a('number');

        expect(result.aired_on ?? '0000-00-00').to.be.a('string');
        expect(result.aired_on ?? '0000-00-00').to.match(/^\d{4}-\d{2}-\d{2}$/);

        expect(result.image.preview).to.be.a('string');
        expect(result.image.preview).to.match(/^\/system\/animes\/preview\/\d+\.jpg\?\d+$/);

        expect(result.url).to.be.a('string');
        expect(result.url).to.match(/^\/animes\/[a-z]?\d+-[a-z0-9-]+$/);
    };

    it('should return search results', async () => {
        const service = new ShikimoriApiClient();
        const searchResults = await service.searchAnime('нар');
        console.log(searchResults);

        expect(searchResults).to.be.an('array');
        expect(searchResults).to.have.length(50);

        searchResults.forEach(checkAnime);
    });

    it('should return related items', async () => {
        const service = new ShikimoriApiClient();
        const relatedItems = await service.relatedAnime(32365);
        console.log(relatedItems);

        expect(relatedItems).to.be.an('array');
        expect(relatedItems).to.have.length(3);

        relatedItems.forEach(result => {
            expect(result.relation).to.match(/^[a-zA-Z\s]+$/);
            expect(result.relation_russian).to.match(/^[а-яА-Я\s]+$/);

            checkAnime(result.anime);
        });
    });
});
