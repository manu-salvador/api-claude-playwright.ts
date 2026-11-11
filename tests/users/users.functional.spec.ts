import { UserBuilder } from '../../src/builders';
import { ErrorMessages } from '../../src/constants/ErrorMessages';
import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { MAX_PAGE_SIZE } from '../../src/data/common.data';
import { expect, test } from '../../src/fixtures/api.fixture';
import { postListSchema, todoListSchema } from '../../src/schemas';

test.describe('Users - Functional', { tag: Tags.FUNCTIONAL }, () => {
  test.describe('Pagination & filters', { tag: Tags.PUBLIC }, () => {
    test('per_page limits the amount of results', async ({ publicApi }) => {
      const response = await publicApi.users.list({ per_page: 5 });

      expect(response).toHaveStatus(HttpStatus.OK);
      expect(response.body).toHaveLength(5);
      expect(response.header('x-pagination-limit')).toBe('5');
    });

    test(`per_page accepts the maximum value (${MAX_PAGE_SIZE})`, async ({ publicApi }) => {
      const response = await publicApi.users.list({ per_page: MAX_PAGE_SIZE });

      expect(response).toHaveStatus(HttpStatus.OK);
      expect(response.header('x-pagination-limit')).toBe(String(MAX_PAGE_SIZE));
      expect(response.body.length).toBeLessThanOrEqual(MAX_PAGE_SIZE);
    });

    test('different pages return different users', async ({ publicApi }) => {
      const page1 = await publicApi.users.list({ page: 1, per_page: 5 });
      const page2 = await publicApi.users.list({ page: 2, per_page: 5 });

      expect(page2.header('x-pagination-page')).toBe('2');
      const ids1 = page1.body.map((u) => u.id);
      expect(page2.body.every((u) => !ids1.includes(u.id))).toBe(true);
    });

    test('pagination headers are consistent', async ({ publicApi }) => {
      const response = await publicApi.users.list({ per_page: 10 });
      const total = Number(response.header('x-pagination-total'));
      const pages = Number(response.header('x-pagination-pages'));

      expect(pages).toBe(Math.ceil(total / 10));
    });

    for (const gender of ['male', 'female'] as const) {
      test(`filter by gender=${gender} returns only ${gender} users`, async ({ publicApi }) => {
        const response = await publicApi.users.list({ gender, per_page: 20 });

        expect(response).toHaveStatus(HttpStatus.OK);
        expect(response.body.every((u) => u.gender === gender)).toBe(true);
      });
    }

    for (const status of ['active', 'inactive'] as const) {
      test(`filter by status=${status} returns only ${status} users`, async ({ publicApi }) => {
        const response = await publicApi.users.list({ status, per_page: 20 });

        expect(response).toHaveStatus(HttpStatus.OK);
        expect(response.body.every((u) => u.status === status)).toBe(true);
      });
    }

    test('combined filters are applied together', async ({ publicApi }) => {
      const response = await publicApi.users.list({ gender: 'female', status: 'active', per_page: 20 });

      expect(response.body.every((u) => u.gender === 'female' && u.status === 'active')).toBe(true);
    });

    test('filter with no matches returns an empty list', async ({ publicApi }) => {
      const response = await publicApi.users.list({ email: `nobody.${Date.now()}@nowhere.example` });

      expect(response).toHaveStatus(HttpStatus.OK);
      expect(response.body).toEqual([]);
    });
  });

  test.describe('Business rules', () => {
    test('a created user can be found filtering by email', async ({ api, testData }) => {
      const user = await testData.createUser();

      const response = await api.users.list({ email: user.email });

      expect(response.body).toContainEqual(user);
    });

    test('name filter performs a partial match', async ({ api, testData }) => {
      const unique = `Zqx${Date.now()}`;
      const user = await testData.createUser({ name: `${unique} Automation` });

      const response = await api.users.list({ name: unique });

      expect(response.body.map((u) => u.id)).toContain(user.id);
    });

    test('email must be unique on create', async ({ api, testData }) => {
      const existing = await testData.createUser();

      const response = await api.users.create(UserBuilder.aUser().with('email', existing.email).build());

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response).toHaveValidationError('email', ErrorMessages.ALREADY_TAKEN);
    });

    test('email must be unique on update', async ({ api, testData }) => {
      const first = await testData.createUser();
      const second = await testData.createUser();

      const response = await api.users.patch(second.id, { email: first.email });

      expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response).toHaveValidationError('email', ErrorMessages.ALREADY_TAKEN);
    });

    test('PATCH keeps the fields that were not sent', async ({ api, testData }) => {
      const user = await testData.createUser();
      const newName = `Patched ${Date.now()}`;

      await api.users.patch(user.id, { name: newName });
      const response = await api.users.getById(user.id);

      expect(response.body).toEqual({ ...user, name: newName });
    });

    test('update is persisted and visible on GET', async ({ api, testData }) => {
      const user = await testData.createUser();
      const update = UserBuilder.aUser().build();

      await api.users.update(user.id, update);
      const response = await api.users.getById(user.id);

      expect(response.body).toEqual({ id: user.id, ...update });
    });

    test('a deleted user cannot be deleted again', async ({ api, testData }) => {
      const user = await testData.createUser();
      await api.users.delete(user.id);

      const response = await api.users.delete(user.id);

      expect(response).toHaveStatus(HttpStatus.NOT_FOUND);
      expect(response).toHaveErrorMessage(ErrorMessages.RESOURCE_NOT_FOUND);
    });

    test('GET /users/{id}/posts lists the posts of the user', async ({ api, testData }) => {
      const user = await testData.createUser();
      const post = await testData.createPost(user.id);

      const response = await api.users.listPosts(user.id);

      expect(response).toHaveStatus(HttpStatus.OK);
      expect(response).toMatchSchema(postListSchema);
      expect(response.body).toContainEqual(post);
      expect(response.body.every((p) => p.user_id === user.id)).toBe(true);
    });

    test('GET /users/{id}/todos lists the todos of the user', async ({ api, testData }) => {
      const user = await testData.createUser();
      const todo = await testData.createTodo(user.id);

      const response = await api.users.listTodos(user.id);

      expect(response).toHaveStatus(HttpStatus.OK);
      expect(response).toMatchSchema(todoListSchema);
      expect(response.body.map((t) => t.id)).toContain(todo.id);
    });

    test('email is stored exactly as sent (case preserved or normalised)', async ({ api, testData }) => {
      const payload = UserBuilder.aUser().build();
      const response = await api.users.create({ ...payload, email: payload.email.toUpperCase() });
      testData.track(() => api.users.delete(response.body.id));

      expect(response).toHaveStatus(HttpStatus.CREATED);
      expect(response.body.email.toLowerCase()).toBe(payload.email.toLowerCase());
    });
  });
});
