/** Playwright tags used to slice the suite (`--grep @smoke`, `--grep @parametric`, ...). */
export const Tags = {
  SMOKE: '@smoke',
  HAPPY_PATH: '@happy-path',
  FUNCTIONAL: '@functional',
  STATUS_CODES: '@status-codes',
  EMPTY_FIELDS: '@empty-fields',
  MISSING_FIELDS: '@missing-fields',
  PARAMETRIC: '@parametric',
  NEGATIVE: '@negative',
  PUBLIC: '@public',
} as const;
