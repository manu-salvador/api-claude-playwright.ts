import { CommentBuilder } from '../../src/builders';
import { HttpStatus } from '../../src/constants/HttpStatus';
import { Tags } from '../../src/constants/Tags';
import { expect, test } from '../../src/fixtures/api.fixture';
import { commentListSchema, commentSchema } from '../../src/schemas';

test.describe('Comments - Happy path', { tag: [Tags.HAPPY_PATH, Tags.SMOKE] }, () => {
  test('GET /comments returns a list of comments', { tag: Tags.PUBLIC }, async ({ publicApi }) => {
    const response = await publicApi.comments.list();

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response).toMatchSchema(commentListSchema);
  });

  test('POST /comments creates a comment', async ({ api, testData }) => {
    const post = await testData.createPost();
    const payload = CommentBuilder.aComment(post.id).build();

    const response = await api.comments.create(payload);
    testData.track(() => api.comments.delete(response.body.id));

    expect(response).toHaveStatus(HttpStatus.CREATED);
    expect(response).toMatchSchema(commentSchema);
    expect(response.body).toMatchObject(payload);
  });

  test('GET /comments/{id} returns the comment', async ({ api, testData }) => {
    const comment = await testData.createComment();

    const response = await api.comments.getById(comment.id);

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response.body).toEqual(comment);
  });

  test('PUT /comments/{id} replaces the comment', async ({ api, testData }) => {
    const comment = await testData.createComment();
    const update = CommentBuilder.aComment(comment.post_id).build();

    const response = await api.comments.update(comment.id, update);

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response.body).toEqual({ id: comment.id, ...update });
  });

  test('PATCH /comments/{id} partially updates the comment', async ({ api, testData }) => {
    const comment = await testData.createComment();

    const response = await api.comments.patch(comment.id, { body: 'Patched body' });

    expect(response).toHaveStatus(HttpStatus.OK);
    expect(response.body).toEqual({ ...comment, body: 'Patched body' });
  });

  test('DELETE /comments/{id} deletes the comment', async ({ api, testData }) => {
    const comment = await testData.createComment();

    expect(await api.comments.delete(comment.id)).toHaveStatus(HttpStatus.NO_CONTENT);
    expect(await api.comments.getById(comment.id)).toHaveStatus(HttpStatus.NOT_FOUND);
  });
});
