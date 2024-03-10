import { Context, SQSHandler, SQSRecord } from 'aws-lambda';
import { processVideo } from './index';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { TEST_LONG_SERIES_URL } from '../../loan-api/src/bot-loan-api-client';

export const handler: SQSHandler = async (event) => {
    console.log('Hello, world!');

    if (event.Records.length !== 1) {
        throw new Error('Only one record is supported');
    }

    const signedLink = event.Records[0].body;
    console.log(signedLink);

    await processVideo(signedLink);
    console.log('Goodbye, world!');
}

// For debugging purposes
handler(
    { Records: [{ body: TEST_LONG_SERIES_URL } as unknown as SQSRecord] },
    null as unknown as Context,
    () => console.log('Callback called')
);
