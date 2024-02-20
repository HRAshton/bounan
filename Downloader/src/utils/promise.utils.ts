export const pause = new Promise(() => {
    // This promise never resolves
});

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const retryWithTimeout = async <T>(
    fn: () => Promise<T>,
    intervalMs: number,
    timeoutMs: number,
    resultValidator: (result: T) => boolean,
): Promise<T> => {
    const startTime = Date.now();

    while (Date.now() - startTime <= timeoutMs) {
        try {
            const result = await fn();

            if (resultValidator(result)) {
                return result;
            }

            await sleep(intervalMs);
        } catch (e) {
            await sleep(intervalMs);
        }
    }

    throw new Error('Timeout while waiting for operation to succeed');
}