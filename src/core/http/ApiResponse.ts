/** Immutable, transport-agnostic view of an HTTP response. */
export class ApiResponse<T = unknown> {
  constructor(
    readonly method: string,
    readonly url: string,
    readonly status: number,
    readonly headers: Readonly<Record<string, string>>,
    readonly body: T,
    readonly rawBody: string,
    readonly durationMs: number,
  ) {}

  header(name: string): string | undefined {
    return this.headers[name.toLowerCase()];
  }

  /** Re-types the body, e.g. `response.as<ValidationError[]>()` on a 422. */
  as<U>(): ApiResponse<U> {
    return this as unknown as ApiResponse<U>;
  }
}
