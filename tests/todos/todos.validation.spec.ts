import { TodoBuilder } from '../../src/builders';
import { ErrorMessages } from '../../src/constants/ErrorMessages';
import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { INVALID_PAGINATION_CASES, INVALID_PATH_IDS } from '../../src/data/common.data';
import { FOREIGN_KEY_ALIASES, TODO_PARAMETRIC_CASES, TODO_REQUIRED_FIELDS } from '../../src/data/resources.data';
import { expect, test } from '../../src/fixtures/api.fixture';

const expectedErrorFor = (field: string) =>
  FOREIGN_KEY_ALIASES[field]
    ? { field: FOREIGN_KEY_ALIASES[field], message: ErrorMessages.MUST_EXIST }
    : { field, message: ErrorMessages.BLANK };

test.describe('Todos - Validations', { tag: Tags.NEGATIVE }, () => {
  test.describe('Empty fields', { tag: Tags.EMPTY_FIELDS }, () => {
    for (const field of TODO_REQUIRED_FIELDS) {
      test(`POST with empty "${field}" returns 422`, async ({ api, shared }) => {
        const user = await shared.getUser();

        const response = await api.todos.create(TodoBuilder.aTodo(user.id).withEmpty(field).buildRaw());

        const expected = expectedErrorFor(field);
        expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(response).toHaveValidationError(expected.field, expected.message);
      });
    }

    test('POST with empty due_on is accepted (optional field)', async ({ api, shared, testData }) => {
      const user = await shared.getUser();

      const response = await api.todos.create(TodoBuilder.aTodo(user.id).withEmpty('due_on').buildRaw());
      testData.track(() => api.todos.delete(response.body.id));

      expect(response).toHaveStatus(HttpStatus.CREATED);
      expect(response.body.due_on).toBeNull();
    });

    test('PATCH with empty status returns 422', async ({ api, testData }) => {
      const todo = await testData.createTodo();

      const response = await api.todos.patch(todo.id, { status: '' });

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response).toHaveValidationError('status', ErrorMessages.BLANK);
    });
  });

  test.describe('Missing fields', { tag: Tags.MISSING_FIELDS }, () => {
    for (const field of TODO_REQUIRED_FIELDS) {
      test(`POST without "${field}" returns 422`, async ({ api, shared }) => {
        const user = await shared.getUser();

        const response = await api.todos.create(TodoBuilder.aTodo(user.id).without(field).buildRaw());

        const expected = expectedErrorFor(field);
        expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(response).toHaveValidationError(expected.field, expected.message);
      });
    }

    test('POST with empty body {} returns an error for every required field', async ({ api }) => {
      const response = await api.todos.create({});

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      for (const field of TODO_REQUIRED_FIELDS) {
        const expected = expectedErrorFor(field);
        expect(response).toHaveValidationError(expected.field, expected.message);
      }
    });
  });

  test.describe('Parametric (wrong data types / formats)', { tag: Tags.PARAMETRIC }, () => {
    for (const c of TODO_PARAMETRIC_CASES) {
      test(`POST with ${c.title} (${JSON.stringify(c.value)}) returns 422`, async ({ api, shared }) => {
        const user = await shared.getUser();

        const response = await api.todos.create(TodoBuilder.aTodo(user.id).withValue(c.field, c.value).buildRaw());

        expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(response).toHaveValidationError(c.expectedField ?? c.field, c.expectedMessage);
      });
    }

    test('POST with an invalid due_on is not persisted as a date', async ({ api, shared, testData }) => {
      const user = await shared.getUser();

      const response = await api.todos.create(TodoBuilder.aTodo(user.id).withValue('due_on', 'not-a-date').buildRaw());
      if (response.status === HttpStatus.CREATED) testData.track(() => api.todos.delete(response.body.id));

      // Go Rest either rejects it (422) or ignores the unparsable value (stored as null).
      if (response.status === HttpStatus.CREATED) expect(response.body.due_on).toBeNull();
      else expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    test.describe('Query & path parameters', { tag: Tags.PUBLIC }, () => {
      for (const c of INVALID_PAGINATION_CASES) {
        test(`GET /todos with ${c.title} falls back to defaults`, async ({ publicApi }) => {
          const response = await publicApi.todos.list(c.params);

          expect(response).toHaveStatus(HttpStatus.OK);
          expect(response.header('x-pagination-limit')).toBe(String(c.expectedLimit));
        });
      }

      for (const c of INVALID_PATH_IDS) {
        test(`GET /todos/{id} with ${c.title} returns ${c.expectedStatus}`, async ({ publicApi }) => {
          expect(await publicApi.todos.getById(c.id)).toHaveStatus(c.expectedStatus);
        });
      }

      test('filter by invalid status returns an empty list', async ({ publicApi }) => {
        const response = await publicApi.todos.list({ status: 'xyz' });

        expect(response).toHaveStatus(HttpStatus.OK);
        expect(response.body).toEqual([]);
      });
    });
  });
});
