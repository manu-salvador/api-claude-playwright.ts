import { EnvironmentName, EnvironmentSettings } from './environment.types';

/**
 * Non-secret settings per environment.
 * Go Rest exposes a single public instance, so both environments point to it by default.
 * Override `BASE_URL` in `.env.<env>` (or CI variables) to target a different deployment.
 */
export const ENVIRONMENTS: Readonly<Record<EnvironmentName, EnvironmentSettings>> = {
  int: {
    name: 'int',
    baseUrl: 'https://gorest.co.in/public/v2',
    requestTimeout: 15_000,
  },
  uat: {
    name: 'uat',
    baseUrl: 'https://gorest.co.in/public/v2',
    requestTimeout: 20_000,
  },
};
