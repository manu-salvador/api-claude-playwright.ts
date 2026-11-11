import { TodoPayload } from '../models';
import { BaseBuilder } from './BaseBuilder';
import { DataGenerator } from './DataGenerator';

export class TodoBuilder extends BaseBuilder<TodoPayload> {
  private constructor(userId: number) {
    super({
      user_id: userId,
      title: DataGenerator.sentence(),
      due_on: DataGenerator.futureDate(),
      status: DataGenerator.pick(['pending', 'completed'] as const),
    });
  }

  static aTodo(userId: number): TodoBuilder {
    return new TodoBuilder(userId);
  }
}
