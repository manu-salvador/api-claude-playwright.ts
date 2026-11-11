import { CommentPayload } from '../models';
import { BaseBuilder } from './BaseBuilder';
import { DataGenerator } from './DataGenerator';

export class CommentBuilder extends BaseBuilder<CommentPayload> {
  private constructor(postId: number) {
    super({
      post_id: postId,
      name: DataGenerator.fullName(),
      email: DataGenerator.uniqueEmail('comment'),
      body: DataGenerator.paragraph(),
    });
  }

  static aComment(postId: number): CommentBuilder {
    return new CommentBuilder(postId);
  }
}
