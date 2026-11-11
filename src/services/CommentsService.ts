import { Endpoints } from '../constants/Endpoints';
import { Comment, CommentPayload } from '../models';
import { BaseResourceService } from './BaseResourceService';

export class CommentsService extends BaseResourceService<Comment, CommentPayload> {
  protected readonly endpoint = Endpoints.COMMENTS;
}
