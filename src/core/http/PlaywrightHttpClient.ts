import { APIRequestContext } from '@playwright/test';
import { IAuthProvider } from '../auth/IAuthProvider';
import { IRequestReporter } from '../reporting/IRequestReporter';
import { ApiResponse } from './ApiResponse';
import { HttpMethod, RequestOptions } from './HttpTypes';
import { IHttpClient } from './IHttpClient';

export interface PlaywrightHttpClientDeps {
  readonly context: APIRequestContext;
  readonly baseUrl: string;
  readonly timeout: number;
  readonly authProvider: IAuthProvider;
  readonly reporter: IRequestReporter;
}

/** IHttpClient implementation backed by Playwright's APIRequestContext. */
export class PlaywrightHttpClient implements IHttpClient {
  constructor(private readonly deps: PlaywrightHttpClientDeps) {}

  async request<T = unknown>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    const body = options.rawBody ?? (options.data !== undefined ? JSON.stringify(options.data) : undefined);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...this.deps.authProvider.getHeaders(),
      ...options.headers,
    };

    const startedAt = Date.now();
    const response = await this.deps.context.fetch(url, {
      method,
      headers,
      params: options.params,
      data: body,
      timeout: this.deps.timeout,
      failOnStatusCode: false,
      maxRedirects: 0,
    });
    const durationMs = Date.now() - startedAt;

    const rawBody = await response.text();
    const apiResponse = new ApiResponse<T>(
      method,
      response.url(),
      response.status(),
      response.headers(),
      this.parseBody(rawBody) as T,
      rawBody,
      durationMs,
    );

    await this.deps.reporter.report({
      request: { method, url: response.url(), headers, body },
      response: apiResponse,
    });

    return apiResponse;
  }

  private buildUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    return `${this.deps.baseUrl}/${path.replace(/^\/+/, '')}`;
  }

  private parseBody(raw: string): unknown {
    if (!raw) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
}
