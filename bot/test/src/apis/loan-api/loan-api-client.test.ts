'use strict';

import { expect } from 'chai';
import { LoanApiClient } from '../../../../src/apis/loan-api/loan-api-client';

import { SearchResultItem } from '../../../../src/apis/loan-api/interfaces/search-result-item';

describe('LoanApiClient', () => {
    const checkKeys = (searchResults: SearchResultItem[]) => {
        // primary key: signedLink
        const signedLinks = searchResults.map(result => result.signedLink);
        const uniqueSignedLinks = new Set(signedLinks);
        expect(uniqueSignedLinks.size).to.equal(signedLinks.length);

        // secondary key: malId, episode, dub, quality
        const secondaryKeys = searchResults.map(result =>
            `${result.myAnimeListId}-${result.episode}-${result.dub}-${result.quality}`);
        const uniqueSecondaryKeys = new Set(secondaryKeys);
        expect(uniqueSecondaryKeys.size).to.equal(secondaryKeys.length);
    };

    const checkEpisodes = (searchResults: SearchResultItem[], malId: number) => {
        searchResults.forEach(result => {
            expect(result.signedLink).to.be.a('string');
            expect(result.signedLink.startsWith('https')).to.equal(true);

            expect(result.myAnimeListId).to.be.a('number');
            expect(result.myAnimeListId).to.equal(malId);

            expect(result.dub).to.be.a('string');
            expect(result.dub).to.not.be.empty;

            expect(result.episode).to.be.a('number');

            expect(result.quality).to.be.a('string');
            expect(result.quality).to.not.be.empty;
        });
    }

    it('should return search results for movie with no dubs and episodes', async () => {
        const service = new LoanApiClient();
        const searchResults = await service.search(10686);

        expect(searchResults).to.be.an('array');
        expect(searchResults).to.have.length(1);

        expect(searchResults.every(result => result.episode === 0)).to.equal(true);

        checkEpisodes(searchResults, 10686);
        checkKeys(searchResults);
    });

    it('should return search results for movie', async () => {
        const service = new LoanApiClient();
        const searchResults = await service.search(199);

        expect(searchResults).to.be.an('array');
        expect(searchResults).to.have.length(8);

        expect(searchResults.every(result => result.episode === 0)).to.equal(true);

        checkEpisodes(searchResults, 199);
        checkKeys(searchResults);
    });

    it('should return search results for short series', async () => {
        const service = new LoanApiClient();
        const searchResults = await service.search(52736);

        expect(searchResults).to.be.an('array');
        expect(searchResults).to.have.length(70);

        expect(searchResults.every(result => result.episode > 0)).to.equal(true);

        checkEpisodes(searchResults, 52736);
        checkKeys(searchResults);
    });

    it('should return search result for long series', async () => {
        const service = new LoanApiClient();
        const searchResults = await service.search(20);

        expect(searchResults).to.be.an('array');
        expect(searchResults).to.have.length(803);

        expect(searchResults.every(result => result.episode > 0)).to.equal(true);

        checkEpisodes(searchResults, 20);
        checkKeys(searchResults);
    });
});
