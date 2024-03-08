import { expect } from 'chai';
import { pause, retryWithTimeout } from '../../src/utils/promise.utils';
import { sleep } from 'telegram/Helpers';

describe('promise.utils', () => {
    describe('pause', () => {
        it('should be a promise', () => {
            expect(pause).to.be.a('promise');
        });
    });

    describe('sleep', () => {
        it('should resolve after specified time', async () => {
            const startTime = Date.now();
            await sleep(1000);
            const endTime = Date.now();

            expect(endTime - startTime).to.be.closeTo(1000, 50);
        });
    });

    describe('retryWithTimeout', () => {
        it('should eventually return a valid result', async () => {
            let attempt = 0;
            const fn = () => new Promise((resolve, reject) => {
                attempt++;
                if (attempt > 2) {
                    resolve('valid result');
                } else {
                    reject('invalid result');
                }
            });

            const result = await retryWithTimeout(fn, 500, 5000, result => result === 'valid result');

            expect(result).to.equal('valid result');
        });

        it('should throw an error if timeout is reached', async () => {
            const fn = () => new Promise((resolve, reject) => {
                reject('invalid result');
            });

            try {
                await retryWithTimeout(fn, 500, 1000, result => result === 'valid result');
            } catch (error: unknown) {
                expect(error).to.be.an('error');
                expect((error as Error).message).to.equal('Timeout while waiting for operation to succeed');
            }
        });
    });
});