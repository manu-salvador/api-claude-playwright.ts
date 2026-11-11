import { CommentBuilder } from '../../src/builders';
import { ErrorMessages } from '../../src/constants/ErrorMessages';
import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { expect, test } from '../../src/fixtures/api.fixture';
import { validationErrorsSchema } from '../../src/schemas';

test.describe('Comments - Response status codes', { tag: Tags.STATUS_CODES }, () => {
  test.describe('Public (no token required)', { tag: Tags.PUBLIC }, () => {
    test('200 OK - GET list', async ({ publicApi }) => {
      expect(await publicApi.comments.list()).toHaveStatus(HttpStatus.OK);
    });

    test('304 Not Modified - GET with matching If-None-Match', async ({ publicApi }) => {
      const [first] = (await publicApi.comments.list({ per_page: 1 })).body;
      const etag = (await publicApi.comments.getById(first.id)).header('etag')!;

      expect(await publicApi.comments.getById(first.id, { 'If-None-Match': etag })).toHaveStatus(HttpStatus.NOT_MODIFIED);
    });

    test('401 Unauthorized - POST / PUT / PATCH / DELETE without token', async ({ publicApi }) => {
      const payload = CommentBuilder.aComment(1).build();
      for (const response of [
        await publicApi.comments.create(payload),
        await publicApi.comments.update(await publicApi.comments.anyExistingId(), payload),
        await publicApi.comments.patch(await publicApi.comments.anyExistingId(), { body: 'x' }),
        await publicApi.comments.delete(await publicApi.comments.anyExistingId()),
      ]) {
        expect(response).toHaveStatus(HttpStatus.UNAUTHORIZED);
        expect(response).toHaveErrorMessage(ErrorMessages.AUTHENTICATION_FAILED);
      }
    });

    test('401 Unauthorized - POST with invalid token', async ({ invalidTokenApi }) => {
      const response = await invalidTokenApi.comments.create(CommentBuilder.aComment(1).build());

      expect(response).toHaveStatus(HttpStatus.UNAUTHORIZED);
      expect(response).toHaveErrorMessage(ErrorMessages.INVALID_TOKEN);
    });

    test('404 Not Found - GET non-existent comment', async ({ publicApi }) => {
      const response = await publicApi.comments.getById(999_999_999);

      expect(response).toHaveStatus(HttpStatus.NOT_FOUND);
      expect(response).toHaveErrorMessage(ErrorMessages.RESOURCE_NOT_FOUND);
    });
  });

  test.describe('Authenticated', () => {
    test('201 Created - POST', async ({ api, shared, testData }) => {
      const post = await shared.getPost();
      const response = await api.comments.create(CommentBuilder.aComment(post.id).build());
      testData.track(() => api.comments.delete(response.body.id));

      expect(response).toHaveStatus(HttpStatus.CREATED);
    });

    test('200 OK - PUT / PATCH', async ({ api, testData }) => {
      const comment = await testData.createComment();

      expect(await api.comments.update(comment.id, CommentBuilder.aComment(comment.post_id).build())).toHaveStatus(HttpStatus.OK);
      expect(await api.comments.patch(comment.id, { name: 'Patched' })).toHaveStatus(HttpStatus.OK);
    });

    test('204 No Content - DELETE', async ({ api, testData }) => {
      const comment = await testData.createComment();

      expect(await api.comments.delete(comment.id)).toHaveStatus(HttpStatus.NO_CONTENT);
    });

    test('404 Not Found - PUT / PATCH / DELETE non-existent comment', async ({ api }) => {
      expect(await api.comments.update(999_999_999, CommentBuilder.aComment(1).build())).toHaveStatus(HttpStatus.NOT_FOUND);
      expect(await api.comments.patch(999_999_999, { body: 'x' })).toHaveStatus(HttpStatus.NOT_FOUND);
      expect(await api.comments.delete(999_999_999)).toHaveStatus(HttpStatus.NOT_FOUND);
    });

    test('422 Unprocessable Entity - POST invalid body', async ({ api }) => {
      const response = await api.comments.create({});

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response).toMatchSchema(validationErrorsSchema);
    });
  });
});
