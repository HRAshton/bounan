#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BounanCdkStack } from '../lib/bounan-cdk-stack';

const app = new cdk.App();
new BounanCdkStack(app, 'bounan-stack');