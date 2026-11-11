import { PostPayload } from '../models';
import { BaseBuilder } from './BaseBuilder';
import { DataGenerator } from './DataGenerator';

export class PostBuilder extends BaseBuilder<PostPayload> {
  private constructor(userId: number) {
    super({
      user_id: userId,
      title: DataGenerator.sentence(),
      body: DataGenerator.paragraph(),
    });
  }

  static aPost(userId: number): PostBuilder {
    return new PostBuilder(userId);
  }
}
