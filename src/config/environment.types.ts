export const SUPPORTED_ENVIRONMENTS = ['int', 'uat'] as const;

export type EnvironmentName = (typeof SUPPORTED_ENVIRONMENTS)[number];

/** Non-secret settings that can live in source control. */
export interface EnvironmentSettings {
  readonly name: EnvironmentName;
  readonly baseUrl: string;
  readonly requestTimeout: number;
}

/** Fully resolved configuration (settings + secrets coming from .env / CI). */
export interface EnvironmentConfig extends EnvironmentSettings {
  readonly token?: string;
  readonly hasToken: boolean;
}
