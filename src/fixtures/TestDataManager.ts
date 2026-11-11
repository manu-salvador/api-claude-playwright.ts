import { CommentBuilder, PostBuilder, TodoBuilder, UserBuilder } from '../builders';
import { HttpStatus } from '../constants/HttpStatus';
import { ApiResponse } from '../core/http/ApiResponse';
import { Comment, CommentPayload, Post, PostPayload, Todo, TodoPayload, User, UserPayload } from '../models';
import { GoRestApi } from '../services/GoRestApi';

type Cleanup = () => Promise<unknown>;

/**
 * Creates prerequisite data through the API and removes it after the test.
 * Single responsibility: test data lifecycle (arrange + teardown).
 */
export class TestDataManager {
  private readonly cleanups: Cleanup[] = [];

  constructor(private readonly api: GoRestApi) {}

  async createUser(overrides: Partial<UserPayload> = {}): Promise<User> {
    const payload = { ...UserBuilder.aUser().build(), ...overrides };
    const user = this.ensureCreated(await this.api.users.create(payload), 'user');
    this.track(() => this.api.users.delete(user.id));
    return user;
  }

  async createPost(userId?: number, overrides: Partial<PostPayload> = {}): Promise<Post> {
    const ownerId = userId ?? (await this.createUser()).id;
    const payload = { ...PostBuilder.aPost(ownerId).build(), ...overrides };
    const post = this.ensureCreated(await this.api.posts.create(payload), 'post');
    this.track(() => this.api.posts.delete(post.id));
    return post;
  }

  async createComment(postId?: number, overrides: Partial<CommentPayload> = {}): Promise<Comment> {
    const parentId = postId ?? (await this.createPost()).id;
    const payload = { ...CommentBuilder.aComment(parentId).build(), ...overrides };
    const comment = this.ensureCreated(await this.api.comments.create(payload), 'comment');
    this.track(() => this.api.comments.delete(comment.id));
    return comment;
  }

  async createTodo(userId?: number, overrides: Partial<TodoPayload> = {}): Promise<Todo> {
    const ownerId = userId ?? (await this.createUser()).id;
    const payload = { ...TodoBuilder.aTodo(ownerId).build(), ...overrides };
    const todo = this.ensureCreated(await this.api.todos.create(payload), 'todo');
    this.track(() => this.api.todos.delete(todo.id));
    return todo;
  }

  /** Registers an external cleanup, e.g. for a resource created inside the test itself. */
  track(cleanup: Cleanup): void {
    this.cleanups.push(cleanup);
  }

  /** Deletes in reverse creation order (children before parents). Errors/404s are ignored. */
  async cleanup(): Promise<void> {
    while (this.cleanups.length) {
      const fn = this.cleanups.pop()!;
      await fn().catch(() => undefined);
    }
  }

  private ensureCreated<T>(response: ApiResponse<T>, label: string): T {
    if (response.status !== HttpStatus.CREATED) {
      throw new Error(`Test data setup failed creating ${label}: ${response.status} ${response.rawBody}`);
    }
    return response.body;
  }
}
