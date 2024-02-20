export interface SmsCodeProvider {
    waitForSmsCodeOrThrow(): Promise<string>;
}