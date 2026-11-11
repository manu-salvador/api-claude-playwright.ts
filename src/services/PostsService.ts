import { ApiResponse } from '../core/http/ApiResponse';
import { Endpoints } from '../constants/Endpoints';
import { Comment, Post, PostPayload } from '../models';
import { BaseResourceService, ResourceId } from './BaseResourceService';

export class PostsService extends BaseResourceService<Post, PostPayload> {
  protected readonly endpoint = Endpoints.POSTS;

  listComments(postId: ResourceId): Promise<ApiResponse<Comment[]>> {
    return this.http.request<Comment[]>('GET', this.path(postId, Endpoints.COMMENTS));
  }
}
