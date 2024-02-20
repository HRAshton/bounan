import * as fs from 'fs';

import { LifetimeConfiguration as ILifetimeConfiguration } from './index';

class LifetimeConfiguration implements ILifetimeConfiguration {
    private SESSION_FILE = 'session.txt';
    private LAST_MESSAGE_ID_FILE = 'last-message-id.txt';

    public get session(): string {
        return this.readFromFile(this.SESSION_FILE) || '';
    }

    public set session(value: string) {
        this.writeToFile(this.SESSION_FILE, value);
    }

    public get lastMessageId(): number {
        const lastMessageId = this.readFromFile(this.LAST_MESSAGE_ID_FILE);
        return lastMessageId ? parseInt(lastMessageId) : 0;
    }

    public set lastMessageId(value: number) {
        this.writeToFile(this.LAST_MESSAGE_ID_FILE, value?.toString() || '');
    }

    private readFromFile(filename: string): string | undefined {
        if (!fs.existsSync(filename)) {
            return undefined;
        }

        return fs.readFileSync(filename, 'utf8');
    }

    private writeToFile(filename: string, data: string | undefined): void {
        const actualValue = this.readFromFile(filename);
        if (actualValue === data) {
            return;
        }

        fs.writeFileSync(filename, data || '', 'utf8');
    }
}

export const lifetimeConfiguration = new LifetimeConfiguration();