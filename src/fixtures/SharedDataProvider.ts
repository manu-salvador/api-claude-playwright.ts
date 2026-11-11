import { Post, User } from '../models';
import { GoRestApi } from '../services/GoRestApi';
import { TestDataManager } from './TestDataManager';

/**
 * Worker-scoped, lazily created parent resources (a user and a post) reused by
 * negative tests that only need a valid foreign key. Reduces calls against the rate limit.
 */
export class SharedDataProvider {
  private manager?: TestDataManager;
  private user?: Promise<User>;
  private post?: Promise<Post>;

  constructor(private readonly apiProvider: () => GoRestApi) {}

  getUser(): Promise<User> {
    this.user ??= this.getManager().createUser();
    return this.user;
  }

  async getPost(): Promise<Post> {
    this.post ??= this.getUser().then((u) => this.getManager().createPost(u.id));
    return this.post;
  }

  async dispose(): Promise<void> {
    await this.manager?.cleanup();
  }

  private getManager(): TestDataManager {
    this.manager ??= new TestDataManager(this.apiProvider());
    return this.manager;
  }
}
