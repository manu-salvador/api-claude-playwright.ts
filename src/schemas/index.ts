import { JSONSchemaType } from 'ajv';
import { Comment, ErrorMessage, Post, Todo, User, ValidationError } from '../models';

export const userSchema: JSONSchemaType<User> = {
  $id: 'user',
  type: 'object',
  required: ['id', 'name', 'email', 'gender', 'status'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', minLength: 3 },
    gender: { type: 'string', enum: ['male', 'female'] },
    status: { type: 'string', enum: ['active', 'inactive'] },
  },
  additionalProperties: true,
};

export const postSchema: JSONSchemaType<Post> = {
  $id: 'post',
  type: 'object',
  required: ['id', 'user_id', 'title', 'body'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    user_id: { type: 'integer', minimum: 1 },
    title: { type: 'string', minLength: 1 },
    body: { type: 'string', minLength: 1 },
  },
  additionalProperties: true,
};

export const commentSchema: JSONSchemaType<Comment> = {
  $id: 'comment',
  type: 'object',
  required: ['id', 'post_id', 'name', 'email', 'body'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    post_id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', minLength: 3 },
    body: { type: 'string', minLength: 1 },
  },
  additionalProperties: true,
};

// due_on may be absent or null, which JSONSchemaType<Todo> cannot express: typed loosely on purpose.
export const todoSchema: JSONSchemaType<Omit<Todo, 'due_on'> & { due_on?: string | null }> = {
  $id: 'todo',
  type: 'object',
  required: ['id', 'user_id', 'title', 'status'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    user_id: { type: 'integer', minimum: 1 },
    title: { type: 'string', minLength: 1 },
    due_on: { type: 'string', nullable: true },
    status: { type: 'string', enum: ['pending', 'completed'] },
  },
  additionalProperties: true,
};

export const errorMessageSchema: JSONSchemaType<ErrorMessage> = {
  $id: 'errorMessage',
  type: 'object',
  required: ['message'],
  properties: { message: { type: 'string', minLength: 1 } },
  additionalProperties: true,
};

export const validationErrorsSchema: JSONSchemaType<ValidationError[]> = {
  $id: 'validationErrors',
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['field', 'message'],
    properties: {
      field: { type: 'string', minLength: 1 },
      message: { type: 'string', minLength: 1 },
    },
    additionalProperties: true,
  },
};

/** Wraps an item schema into an array schema (for list endpoints). */
export const arrayOf = (schema: object, id: string): object => {
  const { $id: _itemId, ...items } = schema as Record<string, unknown>;
  return { $id: id, type: 'array', items };
};

export const userListSchema = arrayOf(userSchema, 'userList');
export const postListSchema = arrayOf(postSchema, 'postList');
export const commentListSchema = arrayOf(commentSchema, 'commentList');
export const todoListSchema = arrayOf(todoSchema, 'todoList');
