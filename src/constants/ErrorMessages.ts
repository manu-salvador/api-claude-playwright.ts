/** Messages returned by Go Rest. Assertions use `toContain`, so partial strings are fine. */
export const ErrorMessages = {
  RESOURCE_NOT_FOUND: 'Resource not found',
  AUTHENTICATION_FAILED: 'Authentication failed',
  INVALID_TOKEN: 'Invalid token',
  BLANK: "can't be blank",
  INVALID: 'is invalid',
  ALREADY_TAKEN: 'has already been taken',
  MUST_EXIST: 'must exist',
  NOT_A_NUMBER: 'is not a number',
  GENDER_OPTIONS: 'can be male of female',
  TODO_STATUS_OPTIONS: 'can be pending or completed',
  TOO_LONG: 'is too long',
} as const;
