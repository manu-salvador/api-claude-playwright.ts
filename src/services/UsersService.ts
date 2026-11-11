import { ApiResponse } from '../core/http/ApiResponse';
import { Endpoints } from '../constants/Endpoints';
import { Post, Todo, User, UserPayload } from '../models';
import { BaseResourceService, ResourceId } from './BaseResourceService';

export class UsersService extends BaseResourceService<User, UserPayload> {
  protected readonly endpoint = Endpoints.USERS;

  listPosts(userId: ResourceId): Promise<ApiResponse<Post[]>> {
    return this.http.request<Post[]>('GET', this.path(userId, Endpoints.POSTS));
  }

  listTodos(userId: ResourceId): Promise<ApiResponse<Todo[]>> {
    return this.http.request<Todo[]>('GET', this.path(userId, Endpoints.TODOS));
  }
}
