import { queue } from 'async';

enum Status {
    Waiting = 1,
    ProcessedByFirst = 2,
    ProcessedBySecond = 3,
}

export async function semiConcurrentProcess<TListItem, TFirstCallbackResult, TSecondCallbackResult>(
    urls: TListItem[],
    concurrentCallback: (url: TListItem) => Promise<TFirstCallbackResult>,
    ordinalCallback: (path: TFirstCallbackResult) => TSecondCallbackResult,
    concurrency: number,
): Promise<void> {
    const allAreDifferent = new Set(urls).size === urls.length;
    if (!allAreDifferent) {
        throw new Error('All URLs should be different');
    }

    const statuses: Status[] = urls.map(() => Status.Waiting);
    const results: (TFirstCallbackResult | null)[] = urls.map(() => null);

    const processOrdinal = () => {
        for (let i = 0; i < statuses.length; i++) {
            if (statuses[i] === Status.Waiting) {
                return;
            }

            if (results[i] === null) {
                throw new Error('Result is not set');
            }

            if (statuses[i] === Status.ProcessedByFirst) {
                ordinalCallback(results[i] as TFirstCallbackResult);
                statuses[i] = Status.ProcessedBySecond;
            }
        }
    }

    const processingQueue = queue(
        async (item: TListItem, callback) => {
            const index = urls.indexOf(item);
            results[index] = await concurrentCallback(item);
            statuses[index] = Status.ProcessedByFirst;

            processOrdinal();

            callback();
        },
        concurrency,
    );

    urls.forEach((item: TListItem) => processingQueue.push(item));

    await processingQueue.drain();
}