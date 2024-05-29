export const FILTER_TYPE_KEY = 'filterType';

export const SEARCH_TERM_KEY = 'search';

export const FILE_TYPE = Object.freeze({
  ALL: { key: 'All', cmd: 'stream,repost', label: 'All', ariaLabel: 'All uploads' },
  UPLOADS: { key: 'Uploads', cmd: 'stream', label: 'Uploads' },
  REPOSTS: { key: 'Reposts', cmd: 'repost', label: 'Reposts' },
  UNLISTED: { key: 'Unlisted', cmd: '', label: 'Unlisted' },
  SCHEDULED: { key: 'Scheduled', cmd: '', label: 'Scheduled' },
});

export const SORT_ORDER = Object.freeze({
  ASC: 'asc', // ascending
  DESC: 'desc', // descending
});

export const SORT_KEYS = Object.freeze({
  NAME: 'name',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
});

export const SORT_VALUES = Object.freeze({
  [SORT_KEYS.NAME]: { str: 'Name', orders: { [SORT_ORDER.ASC]: 'A-Z', [SORT_ORDER.DESC]: 'Z-A' } },
  [SORT_KEYS.CREATED_AT]: {
    str: 'Creation Time',
    orders: { [SORT_ORDER.ASC]: 'Newest First', [SORT_ORDER.DESC]: 'Oldest First' },
  },
  [SORT_KEYS.UPDATED_AT]: {
    str: 'Updated Time',
    orders: { [SORT_ORDER.ASC]: 'Newest First', [SORT_ORDER.DESC]: 'Oldest First' },
  },
});

export const DEFAULT_SORT = { key: SORT_KEYS.UPDATED_AT, value: SORT_ORDER.ASC };
