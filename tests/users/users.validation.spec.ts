import { UserBuilder } from '../../src/builders';
import { ErrorMessages } from '../../src/constants/ErrorMessages';
import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { INVALID_PAGINATION_CASES, INVALID_PATH_IDS } from '../../src/data/common.data';
import { USER_BLANK_MESSAGES, USER_PARAMETRIC_CASES, USER_REQUIRED_FIELDS } from '../../src/data/resources.data';
import { expect, test } from '../../src/fixtures/api.fixture';
import { validationErrorsSchema } from '../../src/schemas';

test.describe('Users - Validations', { tag: Tags.NEGATIVE }, () => {
  test.describe('Empty fields', { tag: Tags.EMPTY_FIELDS }, () => {
    for (const field of USER_REQUIRED_FIELDS) {
      test(`POST with empty "${field}" returns 422`, async ({ api }) => {
        const response = await api.users.create(UserBuilder.aUser().withEmpty(field).buildRaw());

        expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(response).toMatchSchema(validationErrorsSchema);
        expect(response).toHaveValidationError(field, USER_BLANK_MESSAGES[field]);
      });

      test(`PATCH with empty "${field}" returns 422`, async ({ api, shared }) => {
        const user = await shared.getUser();

        const response = await api.users.patch(user.id, { [field]: '' });

        expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(response).toHaveValidationError(field, USER_BLANK_MESSAGES[field]);
      });
    }

    test('POST with whitespace-only name returns 422', async ({ api }) => {
      const response = await api.users.create(UserBuilder.aUser().with('name', '   ').build());

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response).toHaveValidationError('name', ErrorMessages.BLANK);
    });

    test('POST with all fields empty returns one error per field', async ({ api }) => {
      const response = await api.users.create(UserBuilder.aUser().withEmpty(...USER_REQUIRED_FIELDS).buildRaw());

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      for (const field of USER_REQUIRED_FIELDS) expect(response).toHaveValidationError(field);
    });
  });

  test.describe('Missing fields', { tag: Tags.MISSING_FIELDS }, () => {
    for (const field of USER_REQUIRED_FIELDS) {
      test(`POST without "${field}" returns 422`, async ({ api }) => {
        const response = await api.users.create(UserBuilder.aUser().without(field).buildRaw());

        expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(response).toHaveValidationError(field, ErrorMessages.BLANK);
        expect(response.as<unknown[]>().body).toHaveLength(1);
      });
    }

    test('POST with empty body {} returns an error for every required field', async ({ api }) => {
      const response = await api.users.create({});

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      for (const field of USER_REQUIRED_FIELDS) expect(response).toHaveValidationError(field, ErrorMessages.BLANK);
    });

    test('PATCH with empty body {} keeps the user unchanged', async ({ api, shared }) => {
      const user = await shared.getUser();

      const response = await api.users.patch(user.id, {});

      expect(response).toHaveStatus(HttpStatus.OK);
      expect(response.body.id).toBe(user.id);
    });

    test('unknown fields are ignored', async ({ api, testData }) => {
      const payload = UserBuilder.aUser().withValue('nickname', 'ignored').buildRaw();

      const response = await api.users.create(payload);
      testData.track(() => api.users.delete(response.body.id));

      expect(response).toHaveStatus(HttpStatus.CREATED);
      expect(response.body).not.toHaveProperty('nickname');
    });
  });

  test.describe('Parametric (wrong data types / formats)', { tag: Tags.PARAMETRIC }, () => {
    for (const c of USER_PARAMETRIC_CASES) {
      test(`POST with ${c.title} (${JSON.stringify(c.value)}) returns 422`, async ({ api }) => {
        const response = await api.users.create(UserBuilder.aUser().withValue(c.field, c.value).buildRaw());

        expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(response).toHaveValidationError(c.expectedField ?? c.field, c.expectedMessage);
      });
    }

    test('PATCH with invalid gender returns 422', async ({ api, shared }) => {
      const user = await shared.getUser();

      const response = await api.users.patch(user.id, { gender: 123 });

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response).toHaveValidationError('gender');
    });

    test.describe('Query & path parameters', { tag: Tags.PUBLIC }, () => {
      for (const c of INVALID_PAGINATION_CASES) {
        test(`GET /users with ${c.title} falls back to defaults`, async ({ publicApi }) => {
          const response = await publicApi.users.list(c.params);

          expect(response).toHaveStatus(HttpStatus.OK);
          expect(response.header('x-pagination-limit')).toBe(String(c.expectedLimit));
          expect(response.header('x-pagination-page')).toBe(String(c.expectedPage));
        });
      }

      for (const c of INVALID_PATH_IDS) {
        test(`GET /users/{id} with ${c.title} returns ${c.expectedStatus}`, async ({ publicApi }) => {
          expect(await publicApi.users.getById(c.id)).toHaveStatus(c.expectedStatus);
        });
      }

      test('filter by invalid gender returns an empty list', async ({ publicApi }) => {
        const response = await publicApi.users.list({ gender: 12345 });

        expect(response).toHaveStatus(HttpStatus.OK);
        expect(response.body).toEqual([]);
      });
    });
  });
});
