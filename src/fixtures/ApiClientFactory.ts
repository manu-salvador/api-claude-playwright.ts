import { APIRequestContext } from '@playwright/test';
import { EnvironmentConfig } from '../config/environment.types';
import { BearerTokenAuthProvider } from '../core/auth/BearerTokenAuthProvider';
import { IAuthProvider } from '../core/auth/IAuthProvider';
import { NoAuthProvider } from '../core/auth/NoAuthProvider';
import { PlaywrightHttpClient } from '../core/http/PlaywrightHttpClient';
import { AllureRequestReporter } from '../core/reporting/AllureRequestReporter';
import { IRequestReporter } from '../core/reporting/IRequestReporter';
import { GoRestApi } from '../services/GoRestApi';

/** Composition root: the only place where concrete implementations are wired together. */
export class ApiClientFactory {
  constructor(
    private readonly context: APIRequestContext,
    private readonly config: EnvironmentConfig,
    private readonly reporter: IRequestReporter = new AllureRequestReporter(),
  ) {}

  authenticated(): GoRestApi {
    if (!this.config.token) throw new Error('GOREST_TOKEN is not configured');
    return this.build(new BearerTokenAuthProvider(this.config.token));
  }

  anonymous(): GoRestApi {
    return this.build(new NoAuthProvider());
  }

  withToken(token: string): GoRestApi {
    return this.build(new BearerTokenAuthProvider(token));
  }

  private build(authProvider: IAuthProvider): GoRestApi {
    return new GoRestApi(
      new PlaywrightHttpClient({
        context: this.context,
        baseUrl: this.config.baseUrl,
        timeout: this.config.requestTimeout,
        authProvider,
        reporter: this.reporter,
      }),
    );
  }
}
