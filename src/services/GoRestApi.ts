import { IHttpClient } from '../core/http/IHttpClient';
import { CommentsService } from './CommentsService';
import { PostsService } from './PostsService';
import { TodosService } from './TodosService';
import { UsersService } from './UsersService';

/** Facade grouping every resource service that shares the same HTTP client (and therefore the same auth). */
export class GoRestApi {
  readonly users: UsersService;
  readonly posts: PostsService;
  readonly comments: CommentsService;
  readonly todos: TodosService;

  constructor(readonly http: IHttpClient) {
    this.users = new UsersService(http);
    this.posts = new PostsService(http);
    this.comments = new CommentsService(http);
    this.todos = new TodosService(http);
  }
}
