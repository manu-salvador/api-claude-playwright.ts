import { TodoBuilder } from '../../src/builders';
import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { expect, test } from '../../src/fixtures/api.fixture';
import { todoListSchema, todoSchema } from '../../src/schemas';

test.describe('Todos - Happy path', { tag: [Tags.HAPPY_PATH, Tags.SMOKE] }, () => {
  test('GET /todos returns a list of todos', { tag: Tags.PUBLIC }, async ({ publicApi }) => {
    const response = await publicApi.todos.list();

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response).toMatchSchema(todoListSchema);
  });

  test('POST /todos creates a todo', async ({ api, testData }) => {
    const user = await testData.createUser();
    const payload = TodoBuilder.aTodo(user.id).build();

    const response = await api.todos.create(payload);
    testData.track(() => api.todos.delete(response.body.id));

    expect(response).toHaveStatus(HttpStatus.CREATED);
    expect(response).toMatchSchema(todoSchema);
    expect(response.body).toMatchObject({ user_id: payload.user_id, title: payload.title, status: payload.status });
    expect(response.body.due_on).toContain(payload.due_on!);
  });

  test('GET /todos/{id} returns the todo', async ({ api, testData }) => {
    const todo = await testData.createTodo();

    const response = await api.todos.getById(todo.id);

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response.body).toEqual(todo);
  });

  test('PUT /todos/{id} replaces the todo', async ({ api, testData }) => {
    const todo = await testData.createTodo(undefined, { status: 'pending' });
    const update = TodoBuilder.aTodo(todo.user_id).with('status', 'completed').build();

    const response = await api.todos.update(todo.id, update);

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response.body).toMatchObject({ id: todo.id, title: update.title, status: 'completed' });
  });

  test('PATCH /todos/{id} marks the todo as completed', async ({ api, testData }) => {
    const todo = await testData.createTodo(undefined, { status: 'pending' });

    const response = await api.todos.patch(todo.id, { status: 'completed' });

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response.body).toEqual({ ...todo, status: 'completed' });
  });

  test('DELETE /todos/{id} deletes the todo', async ({ api, testData }) => {
    const todo = await testData.createTodo();

    expect(await api.todos.delete(todo.id)).toHaveStatus(HttpStatus.NO_CONTENT);
    expect(await api.todos.getById(todo.id)).toHaveStatus(HttpStatus.NOT_FOUND);
  });
});
