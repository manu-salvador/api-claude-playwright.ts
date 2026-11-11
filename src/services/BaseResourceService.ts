import { ApiResponse } from '../core/http/ApiResponse';
import { QueryParams } from '../core/http/HttpTypes';
import { IHttpClient } from '../core/http/IHttpClient';
import { ResourceEndpoint } from '../constants/Endpoints';
import { LoosePayload } from '../models';

export type ResourceId = number | string;

/**
 * Generic CRUD for a Go Rest resource.
 * Open/Closed: new resources extend this class instead of modifying it.
 * Dependency Inversion: depends on IHttpClient, not on Playwright.
 */
export abstract class BaseResourceService<TModel, TPayload extends object> {
  protected abstract readonly endpoint: ResourceEndpoint;

  constructor(protected readonly http: IHttpClient) {}

  list(params?: QueryParams): Promise<ApiResponse<TModel[]>> {
    return this.http.request<TModel[]>('GET', this.endpoint, { params });
  }

  getById(id: ResourceId, headers?: Record<string, string>): Promise<ApiResponse<TModel>> {
    return this.http.request<TModel>('GET', this.path(id), { headers });
  }

  create(payload: TPayload | LoosePayload): Promise<ApiResponse<TModel>> {
    return this.http.request<TModel>('POST', this.endpoint, { data: payload });
  }

  /** Sends a raw (possibly malformed) body. */
  createRaw(rawBody: string, headers?: Record<string, string>): Promise<ApiResponse<TModel>> {
    return this.http.request<TModel>('POST', this.endpoint, { rawBody, headers });
  }

  update(id: ResourceId, payload: TPayload | LoosePayload): Promise<ApiResponse<TModel>> {
    return this.http.request<TModel>('PUT', this.path(id), { data: payload });
  }

  patch(id: ResourceId, payload: Partial<TPayload> | LoosePayload): Promise<ApiResponse<TModel>> {
    return this.http.request<TModel>('PATCH', this.path(id), { data: payload });
  }

  delete(id: ResourceId): Promise<ApiResponse<void>> {
    return this.http.request<void>('DELETE', this.path(id));
  }

  /**
   * Id of any existing resource. Go Rest resolves the resource before checking auth,
   * so 401 scenarios on PUT/PATCH/DELETE need a real id (a missing one returns 404).
   */
  async anyExistingId(): Promise<number> {
    const [first] = (await this.list({ per_page: 1 })).body as Array<{ id: number }>;
    if (!first) throw new Error(`No existing ${this.endpoint} found`);
    return first.id;
  }

  protected path(id: ResourceId, ...segments: string[]): string {
    return [this.endpoint, String(id), ...segments].join('/');
  }
}
