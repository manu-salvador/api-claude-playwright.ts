import { LoosePayload } from '../models';

/**
 * Fluent builder for request payloads.
 * Supports valid data (`with`), blank values (`withEmpty`), omitted fields (`without`)
 * and wrong types (`withValue`) so every negative scenario is expressed the same way.
 */
export abstract class BaseBuilder<T extends object> {
  private data: LoosePayload;

  protected constructor(defaults: T) {
    this.data = { ...defaults } as LoosePayload;
  }

  /** Sets a field with a correctly typed value. */
  with<K extends keyof T>(key: K, value: T[K]): this {
    this.data[key as string] = value;
    return this;
  }

  /** Sets a field with ANY value, e.g. a string where an integer is expected. */
  withValue(key: keyof T | string, value: unknown): this {
    this.data[key as string] = value;
    return this;
  }

  /** Sets the given fields to an empty string. */
  withEmpty(...keys: Array<keyof T>): this {
    keys.forEach((key) => (this.data[key as string] = ''));
    return this;
  }

  /** Removes the given fields from the payload (field not sent). */
  without(...keys: Array<keyof T>): this {
    keys.forEach((key) => delete this.data[key as string]);
    return this;
  }

  build(): T {
    return { ...this.data } as T;
  }

  /** Same as build(), typed as a loose payload for negative scenarios. */
  buildRaw(): LoosePayload {
    return { ...this.data };
  }
}
