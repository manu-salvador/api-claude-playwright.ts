import { TodoBuilder } from '../../src/builders';
import { ErrorMessages } from '../../src/constants/ErrorMessages';
import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { expect, test } from '../../src/fixtures/api.fixture';
import { validationErrorsSchema } from '../../src/schemas';

test.describe('Todos - Response status codes', { tag: Tags.STATUS_CODES }, () => {
  test.describe('Public (no token required)', { tag: Tags.PUBLIC }, () => {
    test('200 OK - GET list', async ({ publicApi }) => {
      expect(await publicApi.todos.list()).toHaveStatus(HttpStatus.OK);
    });

    test('304 Not Modified - GET with matching If-None-Match', async ({ publicApi }) => {
      const [first] = (await publicApi.todos.list({ per_page: 1 })).body;
      const etag = (await publicApi.todos.getById(first.id)).header('etag')!;

      expect(await publicApi.todos.getById(first.id, { 'If-None-Match': etag })).toHaveStatus(HttpStatus.NOT_MODIFIED);
    });

    test('401 Unauthorized - POST / PUT / PATCH / DELETE without token', async ({ publicApi }) => {
      const payload = TodoBuilder.aTodo(1).build();
      for (const response of [
        await publicApi.todos.create(payload),
        await publicApi.todos.update(await publicApi.todos.anyExistingId(), payload),
        await publicApi.todos.patch(await publicApi.todos.anyExistingId(), { status: 'completed' }),
        await publicApi.todos.delete(await publicApi.todos.anyExistingId()),
      ]) {
        expect(response).toHaveStatus(HttpStatus.UNAUTHORIZED);
        expect(response).toHaveErrorMessage(ErrorMessages.AUTHENTICATION_FAILED);
      }
    });

    test('401 Unauthorized - POST with invalid token', async ({ invalidTokenApi }) => {
      const response = await invalidTokenApi.todos.create(TodoBuilder.aTodo(1).build());

      expect(response).toHaveStatus(HttpStatus.UNAUTHORIZED);
      expect(response).toHaveErrorMessage(ErrorMessages.INVALID_TOKEN);
    });

    test('404 Not Found - GET non-existent todo', async ({ publicApi }) => {
      const response = await publicApi.todos.getById(999_999_999);

      expect(response).toHaveStatus(HttpStatus.NOT_FOUND);
      expect(response).toHaveErrorMessage(ErrorMessages.RESOURCE_NOT_FOUND);
    });
  });

  test.describe('Authenticated', () => {
    test('201 Created - POST', async ({ api, shared, testData }) => {
      const user = await shared.getUser();
      const response = await api.todos.create(TodoBuilder.aTodo(user.id).build());
      testData.track(() => api.todos.delete(response.body.id));

      expect(response).toHaveStatus(HttpStatus.CREATED);
    });

    test('200 OK - PUT / PATCH', async ({ api, testData }) => {
      const todo = await testData.createTodo();

      expect(await api.todos.update(todo.id, TodoBuilder.aTodo(todo.user_id).build())).toHaveStatus(HttpStatus.OK);
      expect(await api.todos.patch(todo.id, { title: 'Patched' })).toHaveStatus(HttpStatus.OK);
    });

    test('204 No Content - DELETE', async ({ api, testData }) => {
      const todo = await testData.createTodo();

      expect(await api.todos.delete(todo.id)).toHaveStatus(HttpStatus.NO_CONTENT);
    });

    test('404 Not Found - PUT / PATCH / DELETE non-existent todo', async ({ api }) => {
      expect(await api.todos.update(999_999_999, TodoBuilder.aTodo(1).build())).toHaveStatus(HttpStatus.NOT_FOUND);
      expect(await api.todos.patch(999_999_999, { title: 'x' })).toHaveStatus(HttpStatus.NOT_FOUND);
      expect(await api.todos.delete(999_999_999)).toHaveStatus(HttpStatus.NOT_FOUND);
    });

    test('422 Unprocessable Entity - POST invalid body', async ({ api }) => {
      const response = await api.todos.create({});

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response).toMatchSchema(validationErrorsSchema);
    });
  });
});
