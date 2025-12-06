export const FILE = 'file';
export const CHANNEL = 'channel';
export const SEARCH = 'search';
export const DEBOUNCE_WAIT_DURATION_MS = 250;
export const LIGHTHOUSE_MIN_CHARACTERS = 3;

export const SEARCH_TYPES = {
  FILE: 'file',
  CHANNEL: 'channel',
  SEARCH: 'search',
  TAG: 'tag',
};

export const SEARCH_OPTIONS = {
  RESULT_COUNT: 'size',
  CLAIM_TYPE: 'claimType',
  RELATED_TO: 'related_to',
  INCLUDE_FILES: 'file',
  INCLUDE_CHANNELS: 'channel',
  INCLUDE_FILES_AND_CHANNELS: 'file,channel',
  INCLUDE_MATURE: 'nsfw',
  MEDIA_AUDIO: 'audio',
  MEDIA_VIDEO: 'video',
  MEDIA_TEXT: 'text',
  MEDIA_IMAGE: 'image',
  MEDIA_APPLICATION: 'application',
  SORT: 'sort_by',
  SORT_ASCENDING: '^release_time',
  SORT_DESCENDING: 'release_time',
  EXACT: 'exact',
  PRICE_FILTER_FREE: 'free_only',
  LANGUAGE: 'language',
  TIME_FILTER: 'time_filter',
  TIME_FILTER_LAST_HOUR: 'lasthour',
  TIME_FILTER_TODAY: 'today',
  TIME_FILTER_THIS_WEEK: 'thisweek',
  TIME_FILTER_THIS_MONTH: 'thismonth',
  TIME_FILTER_THIS_YEAR: 'thisyear',
  MIN_DURATION: 'min_duration',
  MAX_DURATION: 'max_duration',
  DEBOOST_SAME_CREATOR: 'deboost_same_creator',
  MAX_ASPECT_RATIO: 'max_aspect_ratio',
  CONTENT_ASPECT_RATIO: 'content_aspect_ratio',
  CONTENT_ASPECT_RATIO_OR_MISSING: 'content_aspect_ratio_or_missing',
  EXCLUDE_SHORTS: 'exclude_shorts',
  EXCLUDE_SHORTS_ASPECT_RATIO_LTE: 'exclude_shorts_aspect_ratio_lte',
  EXCLUDE_SHORTS_DURATION_LTE: 'exclude_shorts_duration_lte',
};

export const SEARCH_PAGE_SIZE = 20;
