export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export type QueryParams = Record<string, string | number | boolean>;

export interface RequestOptions {
  /** Query string parameters. */
  readonly params?: QueryParams;
  /** Extra headers merged over auth + defaults. */
  readonly headers?: Record<string, string>;
  /** JSON-serializable body (serialized with JSON.stringify). */
  readonly data?: unknown;
  /** Raw body sent as-is (e.g. malformed JSON). Takes precedence over `data`. */
  readonly rawBody?: string;
}
