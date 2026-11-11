import { ErrorMessages } from '../../src/constants/ErrorMessages';
import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { expect, test } from '../../src/fixtures/api.fixture';
import { commentListSchema } from '../../src/schemas';

test.describe('Posts - Functional', { tag: Tags.FUNCTIONAL }, () => {
  test('per_page limits the amount of results', { tag: Tags.PUBLIC }, async ({ publicApi }) => {
    const response = await publicApi.posts.list({ per_page: 3 });

    expect(response.body).toHaveLength(3);
    expect(response.header('x-pagination-limit')).toBe('3');
  });

  test('filter by user_id returns only posts of that user', async ({ api, testData }) => {
    const user = await testData.createUser();
    const post = await testData.createPost(user.id);

    const response = await api.posts.list({ user_id: user.id });

    expect(response.body).toEqual([post]);
  });

  test('filter by title performs a partial match', async ({ api, testData }) => {
    const unique = `zqx${Date.now()}`;
    const post = await testData.createPost(undefined, { title: `Automation ${unique} title` });

    const response = await api.posts.list({ title: unique });

    expect(response.body.map((p) => p.id)).toContain(post.id);
  });

  test('a post can be reassigned to another user with PATCH', async ({ api, testData }) => {
    const post = await testData.createPost();
    const newOwner = await testData.createUser();

    const response = await api.posts.patch(post.id, { user_id: newOwner.id });

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response.body.user_id).toBe(newOwner.id);
  });

  test('a post cannot be reassigned to a non-existent user', async ({ api, testData }) => {
    const post = await testData.createPost();

    const response = await api.posts.patch(post.id, { user_id: 999_999_999 });

    expect(response).toHaveStatus(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(response).toHaveValidationError('user', ErrorMessages.MUST_EXIST);
  });

  test('GET /posts/{id}/comments lists the comments of the post', async ({ api, testData }) => {
    const post = await testData.createPost();
    const comment = await testData.createComment(post.id);

    const response = await api.posts.listComments(post.id);

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response).toMatchSchema(commentListSchema);
    expect(response.body).toContainEqual(comment);
  });

  test('a long body (5000 chars) is accepted', async ({ api, testData }) => {
    const body = 'a'.repeat(5000);
    const post = await testData.createPost(undefined, { body });

    expect((await api.posts.getById(post.id)).body.body).toBe(body);
  });

  test('a deleted post cannot be updated', async ({ api, testData }) => {
    const post = await testData.createPost();
    await api.posts.delete(post.id);

    const response = await api.posts.patch(post.id, { title: 'ghost' });

    expect(response).toHaveStatus(HttpStatus.NOT_FOUND);
  });
});
