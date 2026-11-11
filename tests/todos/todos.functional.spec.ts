import { TodoBuilder } from '../../src/builders';
import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { expect, test } from '../../src/fixtures/api.fixture';

test.describe('Todos - Functional', { tag: Tags.FUNCTIONAL }, () => {
  for (const status of ['pending', 'completed'] as const) {
    test(`filter by status=${status} returns only ${status} todos`, { tag: Tags.PUBLIC }, async ({ publicApi }) => {
      const response = await publicApi.todos.list({ status, per_page: 20 });

      expect(response).toHaveStatus(HttpStatus.OK);
      expect(response.body.every((t) => t.status === status)).toBe(true);
    });
  }

  test('filter by user_id returns only todos of that user', async ({ api, testData }) => {
    const user = await testData.createUser();
    const todo = await testData.createTodo(user.id);

    const response = await api.todos.list({ user_id: user.id });

    expect(response.body).toEqual([todo]);
  });

  test('due_on is optional', async ({ api, testData, shared }) => {
    const user = await shared.getUser();

    const response = await api.todos.create(TodoBuilder.aTodo(user.id).without('due_on').buildRaw());
    testData.track(() => api.todos.delete(response.body.id));

    expect(response).toHaveStatus(HttpStatus.CREATED);
    expect(response.body.due_on).toBeNull();
  });

  test('a todo can go back from completed to pending', async ({ api, testData }) => {
    const todo = await testData.createTodo(undefined, { status: 'completed' });

    const response = await api.todos.patch(todo.id, { status: 'pending' });

    expect(response.body.status).toBe('pending');
  });

  test('due_on can be updated', async ({ api, testData }) => {
    const todo = await testData.createTodo();
    const newDate = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

    const response = await api.todos.patch(todo.id, { due_on: newDate });

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response.body.due_on).toContain(newDate);
  });

  test('a user can have several todos', async ({ api, testData, shared }) => {
    const user = await shared.getUser();
    const first = await testData.createTodo(user.id);
    const second = await testData.createTodo(user.id);

    const ids = (await api.users.listTodos(user.id)).body.map((t) => t.id);

    expect(ids).toEqual(expect.arrayContaining([first.id, second.id]));
  });
});
