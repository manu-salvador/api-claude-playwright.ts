import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { expect, test } from '../../src/fixtures/api.fixture';

test.describe('Comments - Functional', { tag: Tags.FUNCTIONAL }, () => {
  test('per_page limits the amount of results', { tag: Tags.PUBLIC }, async ({ publicApi }) => {
    const response = await publicApi.comments.list({ per_page: 2 });

    expect(response.body).toHaveLength(2);
  });

  test('filter by post_id returns only comments of that post', async ({ api, testData }) => {
    const post = await testData.createPost();
    const comment = await testData.createComment(post.id);

    const response = await api.comments.list({ post_id: post.id });

    expect(response.body).toEqual([comment]);
  });

  test('filter by email returns the matching comment', async ({ api, testData }) => {
    const comment = await testData.createComment();

    const response = await api.comments.list({ email: comment.email });

    expect(response.body).toContainEqual(comment);
  });

  test('several comments can be added to the same post', async ({ api, testData, shared }) => {
    const post = await shared.getPost();
    const first = await testData.createComment(post.id);
    const second = await testData.createComment(post.id);

    const ids = (await api.posts.listComments(post.id)).body.map((c) => c.id);

    expect(ids).toEqual(expect.arrayContaining([first.id, second.id]));
  });

  test('the same email can be used in multiple comments', async ({ testData, shared }) => {
    const post = await shared.getPost();
    const first = await testData.createComment(post.id);

    const second = await testData.createComment(post.id, { email: first.email });

    expect(second.email).toBe(first.email);
  });

  test('deleting the parent post removes access to its comments', async ({ api, testData }) => {
    const post = await testData.createPost();
    const comment = await testData.createComment(post.id);

    await api.posts.delete(post.id);

    expect(await api.comments.getById(comment.id)).toHaveStatus(HttpStatus.NOT_FOUND);
  });
});
