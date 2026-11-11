import { faker } from '@faker-js/faker';

/** Centralised random data generation (single place to change the data strategy). */
export class DataGenerator {
  static uniqueEmail(prefix = 'qa'): string {
    const suffix = `${Date.now()}${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`;
    return `${prefix}.${suffix}@automation.example`;
  }

  static fullName(): string {
    return faker.person.fullName();
  }

  static sentence(words = 6): string {
    return faker.lorem.sentence(words);
  }

  static paragraph(): string {
    return faker.lorem.paragraph();
  }

  /** Future date in YYYY-MM-DD format. */
  static futureDate(days = 10): string {
    const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return date.toISOString().slice(0, 10);
  }

  static pick<T>(values: readonly T[]): T {
    return faker.helpers.arrayElement(values);
  }
}
