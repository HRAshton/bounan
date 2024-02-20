import { Configuration } from '../../config/configuration';
import { SmsCodeProvider as ISmsCodeProvider } from './interfaces/sms-code-provider';
import { retryWithTimeout } from '../../utils/promise.utils';
import axios from 'axios';
import { Logger } from 'sitka';

export class SmsCodeProvider implements ISmsCodeProvider {
    private readonly logger: Logger;

    constructor() {
        this.logger = Logger.getLogger({ name: this.constructor.name });
    }

    public async waitForSmsCodeOrThrow(): Promise<string> {
        const { pollingInterval, poolingTimeout } = Configuration.telegram.smsCodePooling;
        this.logger.info('Waiting for SMS code...');

        const code = await retryWithTimeout(
            this.tryGetCode.bind(this),
            pollingInterval,
            poolingTimeout,
            this.isCode.bind(this),
        );

        this.logger.info(`SMS code received: ${code}`);

        return code;
    }

    private async tryGetCode(): Promise<string> {
        const response = await axios.get(Configuration.telegram.smsCodePooling.endpoint);
        this.logger.debug(`Received SMS code: ${response.data}`);
        return `${response.data}`;
    }

    private isCode(result: string): boolean {
        const code = !!result && result.length === 5 && !isNaN(parseInt(result));
        this.logger.debug(`Received code is ${code ? 'valid' : 'invalid'}`);
        return code;
    }
}