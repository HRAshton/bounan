'use strict';

import { expect } from 'chai';
import { dubToKey } from '../../../src/utils/anime.utils';

describe('AnimeUtilsTests', () => {
    it('should convert uppercase letters to lowercase', () => {
        const dub = 'DUB';
        const result = dubToKey(dub);
        expect(result).to.be.equal('dub');
    });

    it('should replace spaces with underscores', () => {
        const dub = 'dub dub';
        const result = dubToKey(dub);
        expect(result).to.be.equal('dub_dub');
    });

    it('should return the same string if it is already in lowercase and does not contain spaces', () => {
        const dub = 'dub';
        const result = dubToKey(dub);
        expect(result).to.be.equal('dub');
    });
});