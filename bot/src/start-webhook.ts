import { bot } from './setup-bot';
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!event.body) {
        return { statusCode: 400, body: 'Bad Request' };
    }

    const body = JSON.parse(event.body);
    await bot.handleUpdate(body);
    return { statusCode: 200, body: '' };
};
