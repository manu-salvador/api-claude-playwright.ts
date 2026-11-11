import { CommentBuilder } from '../../src/builders';
import { ErrorMessages } from '../../src/constants/ErrorMessages';
import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { INVALID_PAGINATION_CASES, INVALID_PATH_IDS } from '../../src/data/common.data';
import { COMMENT_PARAMETRIC_CASES, COMMENT_REQUIRED_FIELDS, FOREIGN_KEY_ALIASES } from '../../src/data/resources.data';
import { expect, test } from '../../src/fixtures/api.fixture';

const expectedErrorFor = (field: string) =>
  FOREIGN_KEY_ALIASES[field]
    ? { field: FOREIGN_KEY_ALIASES[field], message: ErrorMessages.MUST_EXIST }
    : { field, message: ErrorMessages.BLANK };

test.describe('Comments - Validations', { tag: Tags.NEGATIVE }, () => {
  test.describe('Empty fields', { tag: Tags.EMPTY_FIELDS }, () => {
    for (const field of COMMENT_REQUIRED_FIELDS) {
      test(`POST with empty "${field}" returns 422`, async ({ api, shared }) => {
        const post = await shared.getPost();

        const response = await api.comments.create(CommentBuilder.aComment(post.id).withEmpty(field).buildRaw());

        const expected = expectedErrorFor(field);
        expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(response).toHaveValidationError(expected.field, expected.message);
      });
    }

    test('POST with all fields empty returns one error per field', async ({ api }) => {
      const response = await api.comments.create(CommentBuilder.aComment(1).withEmpty(...COMMENT_REQUIRED_FIELDS).buildRaw());

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      for (const field of COMMENT_REQUIRED_FIELDS) expect(response).toHaveValidationError(expectedErrorFor(field).field);
    });
  });

  test.describe('Missing fields', { tag: Tags.MISSING_FIELDS }, () => {
    for (const field of COMMENT_REQUIRED_FIELDS) {
      test(`POST without "${field}" returns 422`, async ({ api, shared }) => {
        const post = await shared.getPost();

        const response = await api.comments.create(CommentBuilder.aComment(post.id).without(field).buildRaw());

        const expected = expectedErrorFor(field);
        expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(response).toHaveValidationError(expected.field, expected.message);
      });
    }

    test('POST with empty body {} returns an error for every required field', async ({ api }) => {
      const response = await api.comments.create({});

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      for (const field of COMMENT_REQUIRED_FIELDS) {
        const expected = expectedErrorFor(field);
        expect(response).toHaveValidationError(expected.field, expected.message);
      }
    });
  });

  test.describe('Parametric (wrong data types / formats)', { tag: Tags.PARAMETRIC }, () => {
    for (const c of COMMENT_PARAMETRIC_CASES) {
      test(`POST with ${c.title} (${JSON.stringify(c.value)}) returns 422`, async ({ api, shared }) => {
        const post = await shared.getPost();

        const response = await api.comments.create(CommentBuilder.aComment(post.id).withValue(c.field, c.value).buildRaw());

        expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(response).toHaveValidationError(c.expectedField ?? c.field, c.expectedMessage);
      });
    }

    test.describe('Query & path parameters', { tag: Tags.PUBLIC }, () => {
      for (const c of INVALID_PAGINATION_CASES) {
        test(`GET /comments with ${c.title} falls back to defaults`, async ({ publicApi }) => {
          const response = await publicApi.comments.list(c.params);

          expect(response).toHaveStatus(HttpStatus.OK);
          expect(response.header('x-pagination-limit')).toBe(String(c.expectedLimit));
        });
      }

      for (const c of INVALID_PATH_IDS) {
        test(`GET /comments/{id} with ${c.title} returns ${c.expectedStatus}`, async ({ publicApi }) => {
          expect(await publicApi.comments.getById(c.id)).toHaveStatus(c.expectedStatus);
        });
      }
    });
  });
});
