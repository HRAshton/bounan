import { expect } from 'chai';
import { semiConcurrentProcess } from '../../../src/utils/semi-concurrent-processing.utils';

describe('semiConcurrentProcess', () => {
    const mockFn = () => {
        // do nothing
    };

    it('should throw an error if URLs are not unique', async () => {
        const urls = ['https://example.com', 'https://example.com'];

        try {
            await semiConcurrentProcess(urls, async () => new ArrayBuffer(0), mockFn, 1);
        } catch (error: unknown) {
            expect(error).to.be.an('error');
            expect((error as Error).message).to.equal('All URLs should be different');
        }
    });

    it('should call first callback concurrently', async () => {
        const items = [10, 50, 30, 60, 21, 11, 61, 32];

        const downloadCalls: number[] = [];
        await semiConcurrentProcess(
            items,
            async (item: number) => {
                await new Promise(resolve => setTimeout(resolve, item));
                downloadCalls.push(item);
                return item;
            },
            mockFn,
            3,
        );

        expect(downloadCalls).to.have.lengthOf(8);
        expect(downloadCalls).to.deep.equal([10, 30, 50, 21, 11, 60, 32, 61]);
    });

    it('should call second callback sequentially', async () => {
        const items = [10, 50, 30, 60, 21, 11, 61, 32];

        const processCalls: number[] = [];
        await semiConcurrentProcess(
            items,
            async (item: number) => item,
            (item: number) => {
                processCalls.push(item);
            },
            3,
        );

        expect(processCalls).to.have.lengthOf(8);
        expect(processCalls).to.deep.equal(items);
    });
});