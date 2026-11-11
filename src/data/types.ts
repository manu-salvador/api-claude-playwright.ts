/** A data-driven negative scenario: send `value` in `field`, expect a 422 on `expectedField`. */
export interface ParametricCase<T> {
  readonly title: string;
  readonly field: keyof T & string;
  readonly value: unknown;
  /** Field reported by the API (defaults to `field`). Go Rest reports `user` for a bad `user_id`. */
  readonly expectedField?: string;
  readonly expectedMessage?: string;
}

/** A query-string scenario for list endpoints. */
export interface QueryParamCase {
  readonly title: string;
  readonly params: Record<string, string | number>;
  readonly expectedLimit: number;
  readonly expectedPage: number;
}
