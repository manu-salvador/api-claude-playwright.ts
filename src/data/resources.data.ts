import { ErrorMessages as M } from '../constants/ErrorMessages';
import { CommentPayload, PostPayload, TodoPayload, UserPayload } from '../models';
import { ParametricCase } from './types';

/* ----------------------------------- USERS ----------------------------------- */

export const USER_REQUIRED_FIELDS = ['name', 'email', 'gender', 'status'] as const satisfies ReadonlyArray<keyof UserPayload>;

export const USER_BLANK_MESSAGES: Record<(typeof USER_REQUIRED_FIELDS)[number], string> = {
  name: M.BLANK,
  email: M.BLANK,
  gender: M.BLANK,
  status: M.BLANK,
};

export const USER_PARAMETRIC_CASES: readonly ParametricCase<UserPayload>[] = [
  { title: 'integer in email', field: 'email', value: 12345, expectedMessage: M.INVALID },
  { title: 'email without @', field: 'email', value: 'not-an-email.com', expectedMessage: M.INVALID },
  { title: 'email without domain', field: 'email', value: 'qa@', expectedMessage: M.INVALID },
  { title: 'boolean in email', field: 'email', value: true, expectedMessage: M.INVALID },
  { title: 'integer in gender', field: 'gender', value: 1, expectedMessage: M.GENDER_OPTIONS },
  { title: 'value outside enum in gender', field: 'gender', value: 'other', expectedMessage: M.GENDER_OPTIONS },
  { title: 'uppercase enum in gender', field: 'gender', value: 'MALE_X', expectedMessage: M.GENDER_OPTIONS },
  { title: 'boolean in status', field: 'status', value: true },
  { title: 'integer in status', field: 'status', value: 1 },
  { title: 'value outside enum in status', field: 'status', value: 'pending' },
  { title: 'null in name', field: 'name', value: null, expectedMessage: M.BLANK },
  { title: 'null in email', field: 'email', value: null, expectedMessage: M.BLANK },
];

/* ----------------------------------- POSTS ----------------------------------- */

export const POST_REQUIRED_FIELDS = ['user_id', 'title', 'body'] as const satisfies ReadonlyArray<keyof PostPayload>;

export const POST_PARAMETRIC_CASES: readonly ParametricCase<PostPayload>[] = [
  { title: 'string in user_id', field: 'user_id', value: 'abc', expectedMessage: M.NOT_A_NUMBER },
  { title: 'boolean in user_id', field: 'user_id', value: true, expectedMessage: M.NOT_A_NUMBER },
  { title: 'non-existent user_id', field: 'user_id', value: 999_999_999, expectedField: 'user', expectedMessage: M.MUST_EXIST },
  { title: 'negative user_id', field: 'user_id', value: -1, expectedField: 'user', expectedMessage: M.MUST_EXIST },
  { title: 'null in title', field: 'title', value: null, expectedMessage: M.BLANK },
  { title: 'null in body', field: 'body', value: null, expectedMessage: M.BLANK },
];

/* ---------------------------------- COMMENTS --------------------------------- */

export const COMMENT_REQUIRED_FIELDS = ['post_id', 'name', 'email', 'body'] as const satisfies ReadonlyArray<keyof CommentPayload>;

export const COMMENT_PARAMETRIC_CASES: readonly ParametricCase<CommentPayload>[] = [
  { title: 'string in post_id', field: 'post_id', value: 'abc', expectedMessage: M.NOT_A_NUMBER },
  // `false` is coerced to 0, so Go Rest reports the missing parent instead of a type error.
  { title: 'boolean in post_id', field: 'post_id', value: false, expectedField: 'post', expectedMessage: M.MUST_EXIST },
  { title: 'non-existent post_id', field: 'post_id', value: 999_999_999, expectedField: 'post', expectedMessage: M.MUST_EXIST },
  { title: 'integer in email', field: 'email', value: 98765, expectedMessage: M.INVALID },
  { title: 'invalid email format', field: 'email', value: 'comment@@mail', expectedMessage: M.INVALID },
  { title: 'null in body', field: 'body', value: null, expectedMessage: M.BLANK },
];

/* ----------------------------------- TODOS ----------------------------------- */

export const TODO_REQUIRED_FIELDS = ['user_id', 'title', 'status'] as const satisfies ReadonlyArray<keyof TodoPayload>;

export const TODO_PARAMETRIC_CASES: readonly ParametricCase<TodoPayload>[] = [
  { title: 'string in user_id', field: 'user_id', value: 'abc', expectedMessage: M.NOT_A_NUMBER },
  { title: 'non-existent user_id', field: 'user_id', value: 999_999_999, expectedField: 'user', expectedMessage: M.MUST_EXIST },
  { title: 'integer in status', field: 'status', value: 1, expectedMessage: M.TODO_STATUS_OPTIONS },
  { title: 'value outside enum in status', field: 'status', value: 'done', expectedMessage: M.TODO_STATUS_OPTIONS },
  { title: 'boolean in status', field: 'status', value: true, expectedMessage: M.TODO_STATUS_OPTIONS },
  { title: 'null in title', field: 'title', value: null, expectedMessage: M.BLANK },
];

/** Fields whose validation error is reported under a different key (e.g. user_id → user). */
export const FOREIGN_KEY_ALIASES: Record<string, string> = { user_id: 'user', post_id: 'post' };
