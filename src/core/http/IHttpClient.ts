import { ApiResponse } from './ApiResponse';
import { HttpMethod, RequestOptions } from './HttpTypes';

/**
 * Abstraction every service depends on (Dependency Inversion).
 * Kept intentionally small (Interface Segregation): one generic method.
 */
export interface IHttpClient {
  request<T = unknown>(method: HttpMethod, path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
}
