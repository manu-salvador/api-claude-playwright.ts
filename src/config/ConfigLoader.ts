import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { ENVIRONMENTS } from './environments';
import { EnvironmentConfig, EnvironmentName, SUPPORTED_ENVIRONMENTS } from './environment.types';

/**
 * Single responsibility: resolve the configuration for the selected environment.
 *
 * Precedence (highest first):
 *   1. process.env (CI secrets / shell variables)
 *   2. .env.<TEST_ENV>  (e.g. .env.int, .env.uat)
 *   3. .env
 *   4. defaults from src/config/environments.ts
 */
export class ConfigLoader {
  private static cached?: EnvironmentConfig;

  static load(rootDir: string = process.cwd()): EnvironmentConfig {
    if (this.cached) return this.cached;

    const envName = this.resolveEnvironmentName(process.env.TEST_ENV);
    this.loadDotEnvFiles(rootDir, envName);

    const settings = ENVIRONMENTS[envName];
    const token = process.env.GOREST_TOKEN?.trim() || undefined;

    this.cached = Object.freeze({
      ...settings,
      baseUrl: (process.env.BASE_URL?.trim() || settings.baseUrl).replace(/\/+$/, ''),
      requestTimeout: Number(process.env.REQUEST_TIMEOUT) || settings.requestTimeout,
      token,
      hasToken: Boolean(token),
    });
    return this.cached;
  }

  private static resolveEnvironmentName(raw: string | undefined): EnvironmentName {
    const value = (raw ?? 'int').trim().toLowerCase();
    if (!(SUPPORTED_ENVIRONMENTS as readonly string[]).includes(value)) {
      throw new Error(
        `Unsupported TEST_ENV "${raw}". Supported values: ${SUPPORTED_ENVIRONMENTS.join(', ')}`,
      );
    }
    return value as EnvironmentName;
  }

  private static loadDotEnvFiles(rootDir: string, envName: EnvironmentName): void {
    // dotenv never overrides already-defined variables, so load the most specific file first.
    for (const file of [`.env.${envName}`, '.env']) {
      const fullPath = path.join(rootDir, file);
      if (fs.existsSync(fullPath)) dotenv.config({ path: fullPath, quiet: true });
    }
  }
}
