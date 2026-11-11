import { QueryParamCase } from './types';

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/** Invalid pagination values are ignored by Go Rest and defaults are applied. */
export const INVALID_PAGINATION_CASES: readonly QueryParamCase[] = [
  { title: 'page as string', params: { page: 'abc' }, expectedLimit: DEFAULT_PAGE_SIZE, expectedPage: 1 },
  { title: 'per_page as string', params: { per_page: 'xyz' }, expectedLimit: DEFAULT_PAGE_SIZE, expectedPage: 1 },
  { title: 'per_page = 0', params: { per_page: 0 }, expectedLimit: DEFAULT_PAGE_SIZE, expectedPage: 1 },
  { title: 'negative page', params: { page: -1 }, expectedLimit: DEFAULT_PAGE_SIZE, expectedPage: 1 },
  { title: `per_page above max (${MAX_PAGE_SIZE + 1})`, params: { per_page: MAX_PAGE_SIZE + 1 }, expectedLimit: DEFAULT_PAGE_SIZE, expectedPage: 1 },
  { title: 'per_page as decimal', params: { per_page: '5.5' }, expectedLimit: 5, expectedPage: 1 },
];

/** Path ids that are not valid resource ids. */
export const INVALID_PATH_IDS: ReadonlyArray<{ title: string; id: string | number; expectedStatus: number }> = [
  { title: 'string id', id: 'abc', expectedStatus: 404 },
  { title: 'zero id', id: 0, expectedStatus: 404 },
  { title: 'negative id', id: -1, expectedStatus: 404 },
  { title: 'non-existent id', id: 999_999_999, expectedStatus: 404 },
  { title: 'special characters id', id: '%24%25%26', expectedStatus: 404 },
  { title: 'decimal id (interpreted as format → 406)', id: '1.5', expectedStatus: 406 },
];

export const MALFORMED_JSON = '{"name": "broken", "email": ';
