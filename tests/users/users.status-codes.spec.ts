import { UserBuilder } from '../../src/builders';
import { ErrorMessages } from '../../src/constants/ErrorMessages';
import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { MALFORMED_JSON } from '../../src/data/common.data';
import { expect, test } from '../../src/fixtures/api.fixture';
import { errorMessageSchema, validationErrorsSchema } from '../../src/schemas';

test.describe('Users - Response status codes', { tag: Tags.STATUS_CODES }, () => {
  test.describe('Public (no token required)', { tag: Tags.PUBLIC }, () => {
    test('200 OK - GET list', async ({ publicApi }) => {
      expect(await publicApi.users.list()).toHaveStatus(HttpStatus.OK);
    });

    test('304 Not Modified - GET with matching If-None-Match', async ({ publicApi }) => {
      const [first] = (await publicApi.users.list({ per_page: 1 })).body;
      const initial = await publicApi.users.getById(first.id);
      const etag = initial.header('etag');
      expect(etag, 'ETag header must be present').toBeTruthy();

      const response = await publicApi.users.getById(first.id, { 'If-None-Match': etag! });

      expect(response).toHaveStatus(HttpStatus.NOT_MODIFIED);
      expect(response.rawBody).toBe('');
    });

    test('200 OK - GET with stale If-None-Match', async ({ publicApi }) => {
      const [first] = (await publicApi.users.list({ per_page: 1 })).body;

      const response = await publicApi.users.getById(first.id, { 'If-None-Match': 'W/"stale-etag"' });

      expect(response).toHaveStatus(HttpStatus.OK);
    });

    test('401 Unauthorized - POST without token', async ({ publicApi }) => {
      const response = await publicApi.users.create(UserBuilder.aUser().build());

      expect(response).toHaveStatus(HttpStatus.UNAUTHORIZED);
      expect(response).toMatchSchema(errorMessageSchema);
      expect(response).toHaveErrorMessage(ErrorMessages.AUTHENTICATION_FAILED);
    });

    test('401 Unauthorized - PUT without token', async ({ publicApi }) => {
      const response = await publicApi.users.update(await publicApi.users.anyExistingId(), UserBuilder.aUser().build());

      expect(response).toHaveStatus(HttpStatus.UNAUTHORIZED);
      expect(response).toHaveErrorMessage(ErrorMessages.AUTHENTICATION_FAILED);
    });

    test('401 Unauthorized - PATCH without token', async ({ publicApi }) => {
      const response = await publicApi.users.patch(await publicApi.users.anyExistingId(), { name: 'x' });

      expect(response).toHaveStatus(HttpStatus.UNAUTHORIZED);
      expect(response).toHaveErrorMessage(ErrorMessages.AUTHENTICATION_FAILED);
    });

    test('401 Unauthorized - DELETE without token', async ({ publicApi }) => {
      const response = await publicApi.users.delete(await publicApi.users.anyExistingId());

      expect(response).toHaveStatus(HttpStatus.UNAUTHORIZED);
      expect(response).toHaveErrorMessage(ErrorMessages.AUTHENTICATION_FAILED);
    });

    test('404 takes precedence over 401 - DELETE non-existent user without token', async ({ publicApi }) => {
      const response = await publicApi.users.delete(999_999_999);

      expect(response).toHaveStatus(HttpStatus.NOT_FOUND);
      expect(response).toHaveErrorMessage(ErrorMessages.RESOURCE_NOT_FOUND);
    });

    test('401 Unauthorized - POST with invalid token', async ({ invalidTokenApi }) => {
      const response = await invalidTokenApi.users.create(UserBuilder.aUser().build());

      expect(response).toHaveStatus(HttpStatus.UNAUTHORIZED);
      expect(response).toHaveErrorMessage(ErrorMessages.INVALID_TOKEN);
    });

    test('401 Unauthorized - DELETE with invalid token', async ({ invalidTokenApi }) => {
      const response = await invalidTokenApi.users.delete(1);

      expect(response).toHaveStatus(HttpStatus.UNAUTHORIZED);
      expect(response).toHaveErrorMessage(ErrorMessages.INVALID_TOKEN);
    });

    test('404 Not Found - GET non-existent user', async ({ publicApi }) => {
      const response = await publicApi.users.getById(999_999_999);

      expect(response).toHaveStatus(HttpStatus.NOT_FOUND);
      expect(response).toMatchSchema(errorMessageSchema);
      expect(response).toHaveErrorMessage(ErrorMessages.RESOURCE_NOT_FOUND);
    });

    test('404 Not Found - unknown endpoint', async ({ publicApi }) => {
      const response = await publicApi.http.request('GET', 'userz');

      expect(response).toHaveStatus(HttpStatus.NOT_FOUND);
    });

    test('404 Not Found - unsupported method (POST /users/{id})', async ({ publicApi }) => {
      const response = await publicApi.http.request('POST', 'users/1', { data: {} });

      expect(response).toHaveStatus(HttpStatus.NOT_FOUND);
    });

    test('406 Not Acceptable - id with a format extension', async ({ publicApi }) => {
      expect(await publicApi.users.getById('1.5')).toHaveStatus(HttpStatus.NOT_ACCEPTABLE);
    });

    test('204 No Content - OPTIONS preflight', async ({ publicApi }) => {
      expect(await publicApi.http.request('OPTIONS', 'users')).toHaveStatus(HttpStatus.NO_CONTENT);
    });
  });

  test.describe('Authenticated', () => {
    test('201 Created - POST', async ({ api, testData }) => {
      const response = await api.users.create(UserBuilder.aUser().build());
      testData.track(() => api.users.delete(response.body.id));

      expect(response).toHaveStatus(HttpStatus.CREATED);
    });

    test('200 OK - PUT / PATCH', async ({ api, testData }) => {
      const user = await testData.createUser();

      expect(await api.users.update(user.id, UserBuilder.aUser().build())).toHaveStatus(HttpStatus.OK);
      expect(await api.users.patch(user.id, { name: 'Patched' })).toHaveStatus(HttpStatus.OK);
    });

    test('204 No Content - DELETE', async ({ api, testData }) => {
      const user = await testData.createUser();

      expect(await api.users.delete(user.id)).toHaveStatus(HttpStatus.NO_CONTENT);
    });

    test('404 Not Found - PUT non-existent user', async ({ api }) => {
      const response = await api.users.update(999_999_999, UserBuilder.aUser().build());

      expect(response).toHaveStatus(HttpStatus.NOT_FOUND);
      expect(response).toHaveErrorMessage(ErrorMessages.RESOURCE_NOT_FOUND);
    });

    test('404 Not Found - PATCH non-existent user', async ({ api }) => {
      expect(await api.users.patch(999_999_999, { name: 'x' })).toHaveStatus(HttpStatus.NOT_FOUND);
    });

    test('404 Not Found - DELETE non-existent user', async ({ api }) => {
      expect(await api.users.delete(999_999_999)).toHaveStatus(HttpStatus.NOT_FOUND);
    });

    test('422 Unprocessable Entity - POST invalid body', async ({ api }) => {
      const response = await api.users.create({});

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response).toMatchSchema(validationErrorsSchema);
    });

    test('4xx - POST malformed JSON is rejected', async ({ api }) => {
      const response = await api.users.createRaw(MALFORMED_JSON);

      expect([HttpStatus.BAD_REQUEST, HttpStatus.UNPROCESSABLE_ENTITY]).toContain(response.status);
    });

    test('4xx - POST with unsupported Content-Type is rejected', async ({ api }) => {
      const body = JSON.stringify(UserBuilder.aUser().build());
      const response = await api.users.createRaw(body, { 'Content-Type': 'text/plain' });

      expect([HttpStatus.UNSUPPORTED_MEDIA_TYPE, HttpStatus.UNPROCESSABLE_ENTITY]).toContain(response.status);
    });
  });
});
