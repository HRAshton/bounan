import 'dotenv/config';
import { TelegramClient } from './apis/telegram/telegram-client';
import { CopyingService } from './services/copying-service';
import axiosRetry from 'axios-retry';
import axios from 'axios';
import { SmsCodeProvider } from './apis/sms-code-api/sms-code-provider';
import { DwnLoanApiClientImpl } from './apis/loan-api';
import { Configuration } from './config/configuration';
import { LifetimeConfigurationRepository } from './config/lifetime-configuration';
import { ParameterStoreClient } from './apis/parameter-store-client/parameter-store-client';
import { SSMClient } from '@aws-sdk/client-ssm';

axiosRetry(axios, { retries: Configuration.axios.retries });

const ssmClient = new SSMClient();
const parameterStoreClient = new ParameterStoreClient(ssmClient);
const lifetimeConfiguration = new LifetimeConfigurationRepository(parameterStoreClient);
const smsCodeProvider = new SmsCodeProvider();
const telegramClient = new TelegramClient(lifetimeConfiguration, smsCodeProvider);
const loanApiClient = new DwnLoanApiClientImpl();
const copyingService = new CopyingService(loanApiClient, telegramClient);

process.on('SIGINT', async () => {
    console.log('SIGINT signal received. Stopping application...');
    await telegramClient.stop();
    process.exit(0);
});

export const processVideo = copyingService.copyVideoToTelegram;
