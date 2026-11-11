import { UserBuilder } from '../../src/builders';
import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { expect, test } from '../../src/fixtures/api.fixture';
import { userListSchema, userSchema } from '../../src/schemas';

test.describe('Users - Happy path', { tag: [Tags.HAPPY_PATH, Tags.SMOKE] }, () => {
  test('GET /users returns a list of users', { tag: Tags.PUBLIC }, async ({ publicApi }) => {
    const response = await publicApi.users.list();

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response).toMatchSchema(userListSchema);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.header('x-pagination-total')).toBeTruthy();
  });

  test('POST /users creates a user', async ({ api, testData }) => {
    const payload = UserBuilder.aUser().build();

    const response = await api.users.create(payload);
    testData.track(() => api.users.delete(response.body.id));

    expect(response).toHaveStatus(HttpStatus.CREATED);
    expect(response).toMatchSchema(userSchema);
    expect(response.body).toMatchObject(payload);
  });

  test('GET /users/{id} returns the user', async ({ api, testData }) => {
    const user = await testData.createUser();

    const response = await api.users.getById(user.id);

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response).toMatchSchema(userSchema);
    expect(response.body).toEqual(user);
  });

  test('PUT /users/{id} replaces the user', async ({ api, testData }) => {
    const user = await testData.createUser({ gender: 'male', status: 'active' });
    const update = UserBuilder.aUser().with('gender', 'female').with('status', 'inactive').build();

    const response = await api.users.update(user.id, update);

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response).toMatchSchema(userSchema);
    expect(response.body).toEqual({ id: user.id, ...update });
  });

  test('PATCH /users/{id} partially updates the user', async ({ api, testData }) => {
    const user = await testData.createUser({ status: 'active' });

    const response = await api.users.patch(user.id, { status: 'inactive' });

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response.body).toEqual({ ...user, status: 'inactive' });
  });

  test('DELETE /users/{id} deletes the user', async ({ api, testData }) => {
    const user = await testData.createUser();

    const response = await api.users.delete(user.id);

    expect(response).toHaveStatus(HttpStatus.NO_CONTENT);
    expect(response.rawBody).toBe('');
    expect(await api.users.getById(user.id)).toHaveStatus(HttpStatus.NOT_FOUND);
  });
});
