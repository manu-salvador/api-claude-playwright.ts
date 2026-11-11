import { request as playwrightRequest, test as base } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { expect } from '../assertions/apiMatchers';
import { ConfigLoader } from '../config/ConfigLoader';
import { EnvironmentConfig } from '../config/environment.types';
import { NullRequestReporter } from '../core/reporting/NullRequestReporter';
import { GoRestApi } from '../services/GoRestApi';
import { ApiClientFactory } from './ApiClientFactory';
import { SharedDataProvider } from './SharedDataProvider';
import { TestDataManager } from './TestDataManager';

export interface ApiFixtures {
  /** Factory to build clients with any auth strategy. */
  apiFactory: ApiClientFactory;
  /** Authenticated client (Bearer token). Tests using it are skipped if no token is configured. */
  api: GoRestApi;
  /** Client without Authorization header. */
  publicApi: GoRestApi;
  /** Client with an invalid Bearer token. */
  invalidTokenApi: GoRestApi;
  /** Creates prerequisite data and deletes it after each test. */
  testData: TestDataManager;
}

export interface WorkerFixtures {
  /** Resolved environment configuration (int / uat). */
  config: EnvironmentConfig;
  /** Parent resources shared by every test of the worker (lazy). */
  shared: SharedDataProvider;
}

export const test = base.extend<ApiFixtures, WorkerFixtures>({
  config: [
    async ({}, use) => {
      await use(ConfigLoader.load());
    },
    { scope: 'worker' },
  ],

  shared: [
    async ({ config }, use) => {
      const context = await playwrightRequest.newContext();
      const factory = new ApiClientFactory(context, config, new NullRequestReporter());
      const provider = new SharedDataProvider(() => factory.authenticated());
      await use(provider);
      await provider.dispose();
      await context.dispose();
    },
    { scope: 'worker' },
  ],

  apiFactory: async ({ request, config }, use) => {
    await allure.parameter('environment', config.name);
    await use(new ApiClientFactory(request, config));
  },

  api: async ({ apiFactory, config }, use, testInfo) => {
    testInfo.skip(!config.hasToken, 'GOREST_TOKEN is not configured for this environment');
    await use(apiFactory.authenticated());
  },

  publicApi: async ({ apiFactory }, use) => {
    await use(apiFactory.anonymous());
  },

  invalidTokenApi: async ({ apiFactory }, use) => {
    await use(apiFactory.withToken('invalid-token-0000000000000000000000000000000000000000'));
  },

  testData: async ({ api }, use) => {
    const manager = new TestDataManager(api);
    await use(manager);
    await manager.cleanup();
  },
});

export { expect };
