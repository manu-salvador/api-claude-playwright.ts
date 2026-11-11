import { PostBuilder } from '../../src/builders';
import { ErrorMessages } from '../../src/constants/ErrorMessages';
import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { expect, test } from '../../src/fixtures/api.fixture';
import { validationErrorsSchema } from '../../src/schemas';

test.describe('Posts - Response status codes', { tag: Tags.STATUS_CODES }, () => {
  test.describe('Public (no token required)', { tag: Tags.PUBLIC }, () => {
    test('200 OK - GET list', async ({ publicApi }) => {
      expect(await publicApi.posts.list()).toHaveStatus(HttpStatus.OK);
    });

    test('304 Not Modified - GET with matching If-None-Match', async ({ publicApi }) => {
      const [first] = (await publicApi.posts.list({ per_page: 1 })).body;
      const etag = (await publicApi.posts.getById(first.id)).header('etag')!;

      expect(await publicApi.posts.getById(first.id, { 'If-None-Match': etag })).toHaveStatus(HttpStatus.NOT_MODIFIED);
    });

    test('401 Unauthorized - POST without token', async ({ publicApi }) => {
      const response = await publicApi.posts.create(PostBuilder.aPost(1).build());

      expect(response).toHaveStatus(HttpStatus.UNAUTHORIZED);
      expect(response).toHaveErrorMessage(ErrorMessages.AUTHENTICATION_FAILED);
    });

    test('401 Unauthorized - PUT / PATCH / DELETE without token', async ({ publicApi }) => {
      expect(await publicApi.posts.update(await publicApi.posts.anyExistingId(), PostBuilder.aPost(1).build())).toHaveStatus(HttpStatus.UNAUTHORIZED);
      expect(await publicApi.posts.patch(await publicApi.posts.anyExistingId(), { title: 'x' })).toHaveStatus(HttpStatus.UNAUTHORIZED);
      expect(await publicApi.posts.delete(await publicApi.posts.anyExistingId())).toHaveStatus(HttpStatus.UNAUTHORIZED);
    });

    test('401 Unauthorized - POST with invalid token', async ({ invalidTokenApi }) => {
      const response = await invalidTokenApi.posts.create(PostBuilder.aPost(1).build());

      expect(response).toHaveStatus(HttpStatus.UNAUTHORIZED);
      expect(response).toHaveErrorMessage(ErrorMessages.INVALID_TOKEN);
    });

    test('404 Not Found - GET non-existent post', async ({ publicApi }) => {
      const response = await publicApi.posts.getById(999_999_999);

      expect(response).toHaveStatus(HttpStatus.NOT_FOUND);
      expect(response).toHaveErrorMessage(ErrorMessages.RESOURCE_NOT_FOUND);
    });

    test('200 OK - comments of a non-existent post is an empty list', async ({ publicApi }) => {
      const response = await publicApi.posts.listComments(999_999_999);

      expect(response).toHaveStatus(HttpStatus.OK);
      expect(response.body).toEqual([]);
    });

    test('406 Not Acceptable - id with a format extension', async ({ publicApi }) => {
      expect(await publicApi.posts.getById('1.5')).toHaveStatus(HttpStatus.NOT_ACCEPTABLE);
    });
  });

  test.describe('Authenticated', () => {
    test('201 Created - POST', async ({ api, shared, testData }) => {
      const user = await shared.getUser();
      const response = await api.posts.create(PostBuilder.aPost(user.id).build());
      testData.track(() => api.posts.delete(response.body.id));

      expect(response).toHaveStatus(HttpStatus.CREATED);
    });

    test('200 OK - PUT / PATCH', async ({ api, testData }) => {
      const post = await testData.createPost();

      expect(await api.posts.update(post.id, PostBuilder.aPost(post.user_id).build())).toHaveStatus(HttpStatus.OK);
      expect(await api.posts.patch(post.id, { body: 'patched' })).toHaveStatus(HttpStatus.OK);
    });

    test('204 No Content - DELETE', async ({ api, testData }) => {
      const post = await testData.createPost();

      expect(await api.posts.delete(post.id)).toHaveStatus(HttpStatus.NO_CONTENT);
    });

    test('404 Not Found - PUT / PATCH / DELETE non-existent post', async ({ api }) => {
      expect(await api.posts.update(999_999_999, PostBuilder.aPost(1).build())).toHaveStatus(HttpStatus.NOT_FOUND);
      expect(await api.posts.patch(999_999_999, { title: 'x' })).toHaveStatus(HttpStatus.NOT_FOUND);
      expect(await api.posts.delete(999_999_999)).toHaveStatus(HttpStatus.NOT_FOUND);
    });

    test('422 Unprocessable Entity - POST invalid body', async ({ api }) => {
      const response = await api.posts.create({});

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response).toMatchSchema(validationErrorsSchema);
    });
  });
});
