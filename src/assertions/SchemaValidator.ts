import Ajv, { ValidateFunction } from 'ajv';

export interface SchemaValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
}

/** Single responsibility: validate data against JSON schemas (compiled schemas are cached). */
export class SchemaValidator {
  private static readonly ajv = new Ajv({ allErrors: true, strict: false });
  private static readonly cache = new WeakMap<object, ValidateFunction>();

  static validate(schema: object, data: unknown): SchemaValidationResult {
    let validateFn = this.cache.get(schema);
    if (!validateFn) {
      const { $id: _ignored, ...withoutId } = schema as Record<string, unknown>;
      validateFn = this.ajv.compile(withoutId);
      this.cache.set(schema, validateFn);
    }
    const valid = validateFn(data) as boolean;
    const errors = (validateFn.errors ?? []).map((e) => `${e.instancePath || '(root)'} ${e.message}`);
    return { valid, errors };
  }
}
