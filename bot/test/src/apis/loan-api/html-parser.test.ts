'use strict';

import { expect } from 'chai';
import {
    TEST_NO_DUBS_URL, TEST_SHORT_SERIES_URL, TEST_LONG_SERIES_URL,
    TEST_MOVIE_ANUDUB_URL, TEST_MOVIE_SHIZA_URL, TEST_MOVIE_URL,
} from '../../../../src/apis/loan-api/loan-api-client';
import { HtmlParser } from '../../../../src/apis/loan-api/html-parser';
import axios from 'axios';

describe('HtmlParser', () => {
    it('should return parsing result for a video episodes and dubs', async () => {
        const response = await axios.get(TEST_NO_DUBS_URL);
        const html = response.data;

        const result = HtmlParser.parseHtml(html);
        console.log(result);

        expect(result.title).to.be.a('string');
        expect(result.title).to.not.be.empty;

        expect(result.dub).to.be.a('string');
        expect(result.dub).to.be.equal('AniDUB');

        expect(result.dubs).to.be.an('array');
        expect(result.dubs).to.be.empty;

        expect(result.episodes).to.be.an('array');
        expect(result.episodes).to.be.empty;
    });

    it('should return parsing result for movie', async () => {
        const response = await axios.get(TEST_MOVIE_URL);
        const html = response.data;

        const result = HtmlParser.parseHtml(html);
        console.log(result);

        expect(result.title).to.be.a('string');
        expect(result.title).to.not.be.empty;

        expect(result.dub).to.be.a('string');
        expect(result.dub).to.be.equal('AniDUB');

        expect(result.dubs).to.be.an('array');
        expect(result.dubs).to.eql([{
            name: 'AniDUB',
            signedLink: TEST_MOVIE_ANUDUB_URL,
        }, {
            name: 'SHIZA Project',
            signedLink: TEST_MOVIE_SHIZA_URL,
        }]);

        expect(result.episodes).to.be.an('array');
        expect(result.episodes).to.have.length(0);
    });

    it('should return parsing result for short series', async () => {
        const response = await axios.get(TEST_SHORT_SERIES_URL);
        const html = response.data;

        const result = HtmlParser.parseHtml(html);
        console.log(result);

        expect(result.title).to.be.a('string');
        expect(result.title).to.be.equal('Магическая революция');

        expect(result.dub).to.be.a('string');
        expect(result.dub).to.be.equal('AniDUB');

        expect(result.dubs).to.be.an('array');
        expect(result.dubs).to.have.length(6);
        expect(result.dubs.map(dub => dub.name)).to.eql([
            'AniDUB',
            'AniDorFilm & AniDub Online',
            'AniStar Многоголосый',
            'AnimeVost',
            'Crunchyroll.Subtitles',
            'Brees Club',
        ]);
        result.dubs.forEach(dub => {
            expect(dub.signedLink).to.be.a('string');
            expect(dub.signedLink).to.not.be.empty;
            expect(dub.signedLink).to.match(/^https:\/\//);
        });

        expect(result.episodes).to.be.an('array');
        expect(result.episodes).to.have.length(12);
        result.episodes.forEach((episode, index) => {
            expect(episode.number).to.be.a('number');
            expect(episode.number).to.be.equal(index + 1);

            expect(episode.signedLink).to.be.a('string');
            expect(episode.signedLink).to.match(/^https:\/\//);
            expect(episode.signedLink).to.contain('/seria/');
        });
    });

    it('should return parsing result for long series', async () => {
        const response = await axios.get(TEST_LONG_SERIES_URL);
        const html = response.data;

        const result = HtmlParser.parseHtml(html);
        console.log(result);

        expect(result.title).to.be.a('string');
        expect(result.title).to.be.equal('Наруто [ТВ-2]');

        expect(result.dub).to.be.a('string');
        expect(result.dub).to.be.equal('2x2 New');

        expect(result.dubs).to.be.an('array');
        expect(result.dubs).to.have.length(7);
        expect(result.dubs.map(dub => dub.name)).to.eql([
            '2x2 New',
            'SHIZA Project',
            'Субтитры',
            'AniDUB',
            'AniLibria.TV',
            '2x2',
            'ANI.OMNIA',
        ]);
        result.dubs.forEach(dub => {
            expect(dub.signedLink).to.be.a('string');
            expect(dub.signedLink).to.not.be.empty;
            expect(dub.signedLink).to.match(/^https:\/\//);
        });

        expect(result.episodes).to.be.an('array');
        expect(result.episodes).to.have.length(500);
        result.episodes.forEach((episode, index) => {
            expect(episode.number).to.be.a('number');
            expect(episode.number).to.be.equal(index + 1);

            expect(episode.signedLink).to.be.a('string');
            expect(episode.signedLink).to.match(/^https:\/\//);
            expect(episode.signedLink).to.contain('/seria/');
        });
    });
});
