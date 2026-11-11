import { UserPayload } from '../models';
import { BaseBuilder } from './BaseBuilder';
import { DataGenerator } from './DataGenerator';

export class UserBuilder extends BaseBuilder<UserPayload> {
  private constructor() {
    super({
      name: DataGenerator.fullName(),
      email: DataGenerator.uniqueEmail('user'),
      gender: DataGenerator.pick(['male', 'female'] as const),
      status: DataGenerator.pick(['active', 'inactive'] as const),
    });
  }

  static aUser(): UserBuilder {
    return new UserBuilder();
  }
}
