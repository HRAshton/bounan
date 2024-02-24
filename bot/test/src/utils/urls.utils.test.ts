'use strict';

import { expect } from 'chai';
import { addProtocol } from '../../../src/utils/urls.utils';

describe('UrlUtilsTests', () => {
    it('should add protocol to the link if it is missing', () => {
        const link = '//url.com';
        const result = addProtocol(link);
        expect(result).to.be.equal(`https:${link}`);
    });

    it('should not add protocol to the link if it is not missing', () => {
        const link = 'https://url.com';
        const result = addProtocol(link);
        expect(result).to.be.equal(link);
    });

    it('should throw an error if the link not starts with // or https://', () => {
        // noinspection HttpUrlsUsage
        const link = 'http://url.com';
        expect(() => addProtocol(link)).to.throw('Link should start with // or https://');
    });
});
