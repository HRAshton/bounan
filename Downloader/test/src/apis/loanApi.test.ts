'use strict';

import { expect } from 'chai';
import { LoanApiClient, TestSignedUrl } from '../../../src/apis/loan-api/loan-api-client';

describe('LoanApiClient', () => {
    it('should return true for valid signed URL', () => {
        const service = new LoanApiClient();
        const isValid = service.isSignedUrlValid(TestSignedUrl);

        expect(isValid).to.equal(true);
    });

    it('should return false for invalid signed URL', () => {
        const service = new LoanApiClient();
        const isValid = service.isSignedUrlValid('https://www.google.com');

        expect(isValid).to.equal(false);
    });

    it('should return playlists', async () => {
        const service = new LoanApiClient();
        const { playlists, thumbnail } = await service.getHlsPlaylistUrls(TestSignedUrl);

        expect(playlists).to.be.an('object');
        expect(playlists).to.have.property('360');
        expect(playlists).to.have.property('480');
        expect(playlists).to.have.property('720');

        Object.keys(playlists).forEach(key => expect(parseInt(key)).to.be.a('number'));
        Object.values(playlists).forEach(value => expect(value).to.be.a('string'));

        Object.values(playlists).forEach(value => expect(value.startsWith('https')).to.equal(true));
        Object.values(playlists).forEach(value => expect(value.endsWith('manifest.m3u8')).to.equal(true));

        expect(thumbnail).to.be.a('string');
        expect(thumbnail.startsWith('https')).to.equal(true);
        expect(thumbnail.endsWith('jpg')).to.equal(true);

        console.log(playlists, thumbnail);
    });
});
