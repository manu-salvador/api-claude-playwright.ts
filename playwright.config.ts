import { defineConfig } from '@playwright/test';
import os from 'node:os';
import { ConfigLoader } from './src/config/ConfigLoader';

const config = ConfigLoader.load();
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // Go Rest is rate limited: keep concurrency low to avoid 429s.
  workers: isCI ? 2 : 3,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: false,
        suiteTitle: true,
        environmentInfo: {
          Environment: config.name.toUpperCase(),
          BaseURL: config.baseUrl,
          Node: process.version,
          OS: `${os.platform()} ${os.release()}`,
        },
        categories: [
          { name: 'Contract / schema mismatches', messageRegex: '.*schema.*' },
          { name: 'Unexpected status code', messageRegex: '.*Expected status.*' },
          { name: 'Rate limited (429)', messageRegex: '.*429.*' },
        ],
      },
    ],
  ],
  use: {
    extraHTTPHeaders: { Accept: 'application/json' },
  },
  metadata: { environment: config.name, baseUrl: config.baseUrl },
});
