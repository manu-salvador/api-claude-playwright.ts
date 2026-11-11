import { PostBuilder } from '../../src/builders';
import { ErrorMessages } from '../../src/constants/ErrorMessages';
import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { INVALID_PAGINATION_CASES, INVALID_PATH_IDS } from '../../src/data/common.data';
import { FOREIGN_KEY_ALIASES, POST_PARAMETRIC_CASES, POST_REQUIRED_FIELDS } from '../../src/data/resources.data';
import { expect, test } from '../../src/fixtures/api.fixture';

/** Missing/blank FKs are reported as "user must exist"; other fields as "can't be blank". */
const expectedErrorFor = (field: string) =>
  FOREIGN_KEY_ALIASES[field]
    ? { field: FOREIGN_KEY_ALIASES[field], message: ErrorMessages.MUST_EXIST }
    : { field, message: ErrorMessages.BLANK };

test.describe('Posts - Validations', { tag: Tags.NEGATIVE }, () => {
  test.describe('Empty fields', { tag: Tags.EMPTY_FIELDS }, () => {
    for (const field of POST_REQUIRED_FIELDS) {
      test(`POST with empty "${field}" returns 422`, async ({ api, shared }) => {
        const user = await shared.getUser();

        const response = await api.posts.create(PostBuilder.aPost(user.id).withEmpty(field).buildRaw());

        const expected = expectedErrorFor(field);
        expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(response).toHaveValidationError(expected.field, expected.message);
      });
    }

    for (const field of ['title', 'body'] as const) {
      test(`PATCH with empty "${field}" returns 422`, async ({ api, shared }) => {
        const post = await shared.getPost();

        const response = await api.posts.patch(post.id, { [field]: '' });

        expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(response).toHaveValidationError(field, ErrorMessages.BLANK);
      });
    }

    test('POST with all fields empty returns one error per field', async ({ api }) => {
      const response = await api.posts.create(PostBuilder.aPost(1).withEmpty(...POST_REQUIRED_FIELDS).buildRaw());

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      for (const field of POST_REQUIRED_FIELDS) {
        const expected = expectedErrorFor(field);
        expect(response).toHaveValidationError(expected.field, expected.message);
      }
    });
  });

  test.describe('Missing fields', { tag: Tags.MISSING_FIELDS }, () => {
    for (const field of POST_REQUIRED_FIELDS) {
      test(`POST without "${field}" returns 422`, async ({ api, shared }) => {
        const user = await shared.getUser();

        const response = await api.posts.create(PostBuilder.aPost(user.id).without(field).buildRaw());

        const expected = expectedErrorFor(field);
        expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(response).toHaveValidationError(expected.field, expected.message);
      });
    }

    test('POST with empty body {} returns an error for every required field', async ({ api }) => {
      const response = await api.posts.create({});

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response).toHaveValidationError('user', ErrorMessages.MUST_EXIST);
      expect(response).toHaveValidationError('title', ErrorMessages.BLANK);
      expect(response).toHaveValidationError('body', ErrorMessages.BLANK);
    });
  });

  test.describe('Parametric (wrong data types / formats)', { tag: Tags.PARAMETRIC }, () => {
    for (const c of POST_PARAMETRIC_CASES) {
      test(`POST with ${c.title} (${JSON.stringify(c.value)}) returns 422`, async ({ api, shared }) => {
        const user = await shared.getUser();

        const response = await api.posts.create(PostBuilder.aPost(user.id).withValue(c.field, c.value).buildRaw());

        expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(response).toHaveValidationError(c.expectedField ?? c.field, c.expectedMessage);
      });
    }

    test.describe('Query & path parameters', { tag: Tags.PUBLIC }, () => {
      for (const c of INVALID_PAGINATION_CASES) {
        test(`GET /posts with ${c.title} falls back to defaults`, async ({ publicApi }) => {
          const response = await publicApi.posts.list(c.params);

          expect(response).toHaveStatus(HttpStatus.OK);
          expect(response.header('x-pagination-limit')).toBe(String(c.expectedLimit));
        });
      }

      for (const c of INVALID_PATH_IDS) {
        test(`GET /posts/{id} with ${c.title} returns ${c.expectedStatus}`, async ({ publicApi }) => {
          expect(await publicApi.posts.getById(c.id)).toHaveStatus(c.expectedStatus);
        });
      }

      test('filter by user_id as string returns an empty list', async ({ publicApi }) => {
        const response = await publicApi.posts.list({ user_id: 'abc' });

        expect(response).toHaveStatus(HttpStatus.OK);
        expect(response.body).toEqual([]);
      });
    });
  });
});
