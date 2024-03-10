import { Logger } from 'sitka';
import { QueueService } from './services/queue-service';
import { processVideo } from './index';
import { pause } from './utils/promise.utils';

class Main {
    private _logger: Logger;

    constructor() {
        this._logger = Logger.getLogger({ name: this.constructor.name });
    }

    public async main(): Promise<void> {
        this._logger.info('Starting application...');

        const queueService = new QueueService();
        queueService.registerHandler(processVideo);

        process.on('SIGINT', () => this.onStop(queueService));

        await queueService.start();

        await pause;
    }

    private async onStop(queueService: QueueService): Promise<void> {
        this._logger.info('SIGINT signal received. Stopping application...');
        queueService.stop();
        process.exit(0);
    }
}

new Main().main()
    .then(() => {
        console.log('Application finished!');
    })
    .catch(e => {
        console.error('Application failed to start: ', e);
    });
