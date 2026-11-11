import { PostBuilder } from '../../src/builders';
import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { expect, test } from '../../src/fixtures/api.fixture';
import { postListSchema, postSchema } from '../../src/schemas';

test.describe('Posts - Happy path', { tag: [Tags.HAPPY_PATH, Tags.SMOKE] }, () => {
  test('GET /posts returns a list of posts', { tag: Tags.PUBLIC }, async ({ publicApi }) => {
    const response = await publicApi.posts.list();

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response).toMatchSchema(postListSchema);
    expect(response.body.length).toBeGreaterThan(0);
  });

  test('POST /posts creates a post', async ({ api, testData }) => {
    const user = await testData.createUser();
    const payload = PostBuilder.aPost(user.id).build();

    const response = await api.posts.create(payload);
    testData.track(() => api.posts.delete(response.body.id));

    expect(response).toHaveStatus(HttpStatus.CREATED);
    expect(response).toMatchSchema(postSchema);
    expect(response.body).toMatchObject(payload);
  });

  test('GET /posts/{id} returns the post', async ({ api, testData }) => {
    const post = await testData.createPost();

    const response = await api.posts.getById(post.id);

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response.body).toEqual(post);
  });

  test('PUT /posts/{id} replaces the post', async ({ api, testData }) => {
    const post = await testData.createPost();
    const update = PostBuilder.aPost(post.user_id).build();

    const response = await api.posts.update(post.id, update);

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response.body).toEqual({ id: post.id, ...update });
  });

  test('PATCH /posts/{id} partially updates the post', async ({ api, testData }) => {
    const post = await testData.createPost();

    const response = await api.posts.patch(post.id, { title: 'Patched title' });

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response.body).toEqual({ ...post, title: 'Patched title' });
  });

  test('DELETE /posts/{id} deletes the post', async ({ api, testData }) => {
    const post = await testData.createPost();

    expect(await api.posts.delete(post.id)).toHaveStatus(HttpStatus.NO_CONTENT);
    expect(await api.posts.getById(post.id)).toHaveStatus(HttpStatus.NOT_FOUND);
  });
});
