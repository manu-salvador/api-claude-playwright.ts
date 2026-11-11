import { expect as baseExpect } from '@playwright/test';
import { ApiResponse } from '../core/http/ApiResponse';
import { ValidationError } from '../models';
import { SchemaValidator } from './SchemaValidator';

const describe = (response: ApiResponse<unknown>): string =>
  `${response.method} ${response.url}\nStatus: ${response.status}\nBody: ${response.rawBody.slice(0, 1500) || '<empty>'}`;

/** Domain-specific matchers so specs read as business assertions. */
export const expect = baseExpect.extend({
  toHaveStatus(response: ApiResponse<unknown>, expected: number) {
    const pass = response.status === expected;
    return {
      pass,
      name: 'toHaveStatus',
      expected,
      actual: response.status,
      message: () =>
        `Expected status ${this.isNot ? 'not ' : ''}${expected} but received ${response.status}\n${describe(response)}`,
    };
  },

  toMatchSchema(received: ApiResponse<unknown> | unknown, schema: object) {
    const data = received instanceof ApiResponse ? received.body : received;
    const { valid, errors } = SchemaValidator.validate(schema, data);
    const schemaId = (schema as { $id?: string }).$id ?? 'schema';
    return {
      pass: valid,
      name: 'toMatchSchema',
      message: () =>
        valid
          ? `Expected body not to match schema "${schemaId}"`
          : `Body does not match schema "${schemaId}":\n  - ${errors.join('\n  - ')}\nBody: ${JSON.stringify(data).slice(0, 1500)}`,
    };
  },

  toHaveValidationError(response: ApiResponse<unknown>, field: string, messageContains?: string) {
    const errors = Array.isArray(response.body) ? (response.body as ValidationError[]) : [];
    const match = errors.find(
      (e) => e.field === field && (messageContains === undefined || e.message.includes(messageContains)),
    );
    const expectation = messageContains ? `field "${field}" with message containing "${messageContains}"` : `field "${field}"`;
    return {
      pass: Boolean(match),
      name: 'toHaveValidationError',
      message: () =>
        `Expected validation errors ${this.isNot ? 'not ' : ''}to include ${expectation}.\nReceived: ${JSON.stringify(errors)}\n${describe(response)}`,
    };
  },

  toHaveErrorMessage(response: ApiResponse<unknown>, expected: string) {
    const actual = (response.body as { message?: string } | undefined)?.message;
    return {
      pass: actual === expected,
      name: 'toHaveErrorMessage',
      expected,
      actual,
      message: () => `Expected error message "${expected}" but received "${actual}"\n${describe(response)}`,
    };
  },
});
