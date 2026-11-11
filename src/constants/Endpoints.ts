export const Endpoints = {
  USERS: 'users',
  POSTS: 'posts',
  COMMENTS: 'comments',
  TODOS: 'todos',
} as const;

export type ResourceEndpoint = (typeof Endpoints)[keyof typeof Endpoints];
