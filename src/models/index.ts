export type Gender = 'male' | 'female';
export type UserStatus = 'active' | 'inactive';
export type TodoStatus = 'pending' | 'completed';

export interface User {
  id: number;
  name: string;
  email: string;
  gender: Gender;
  status: UserStatus;
}
export type UserPayload = Omit<User, 'id'>;

export interface Post {
  id: number;
  user_id: number;
  title: string;
  body: string;
}
export type PostPayload = Omit<Post, 'id'>;

export interface Comment {
  id: number;
  post_id: number;
  name: string;
  email: string;
  body: string;
}
export type CommentPayload = Omit<Comment, 'id'>;

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  due_on: string | null;
  status: TodoStatus;
}
export type TodoPayload = Omit<Todo, 'id' | 'due_on'> & { due_on?: string | null };

/** 422 body item. */
export interface ValidationError {
  field: string;
  message: string;
}

/** 401 / 404 body. */
export interface ErrorMessage {
  message: string;
}

/** Any payload, including intentionally invalid ones (wrong types, missing fields...). */
export type LoosePayload = Record<string, unknown>;
