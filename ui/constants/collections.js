import * as ICONS from 'constants/icons';

// ui
export const ICON_SIZE = 12;
export const PLACEHOLDER = 'My Awesome Playlist';

export const THUMBNAIL_PREVIEW_AMOUNT = 3;

// see which of these are used
export const COLLECTION_ID = 'lid';
export const COLLECTION_INDEX = 'linx';

export const FILTER_TYPE_KEY = 'filterType';

export const SEARCH_TERM_KEY = 'search';

export const COL_TYPES = Object.freeze({
  PLAYLIST: 'playlist',
  CHANNELS: 'channelList',
  FEATURED_CHANNELS: 'featuredChannels', // Specifically for Channel-sections, different from generic 'channelList'.
  COLLECTION: 'collection', // temp placeholder for mixed content
});

export const WATCH_LATER_ID = 'watchlater';
export const WATCH_LATER_NAME = 'Watch Later';

export const FAVORITES_ID = 'favorites';
export const FAVORITES_NAME = 'Favorites';

export const QUEUE_ID = 'queue';
export const QUEUE_NAME = 'Queue';

export const BUILTIN_PLAYLISTS_NO_QUEUE = [WATCH_LATER_ID, FAVORITES_ID];
export const BUILTIN_PLAYLISTS = [...BUILTIN_PLAYLISTS_NO_QUEUE, QUEUE_ID];
// export const FAVORITE_CHANNELS_ID = 'favoriteChannels';
// export const BUILTIN_LISTS = [WATCH_LATER_ID, FAVORITES_ID, FAVORITE_CHANNELS_ID];

export const KEYS = Object.freeze({
  BUILTIN: 'builtin',
  EDITED: 'edited',
  UPDATED: 'updated',
  UNPUBLISHED: 'unpublished',
  SAVED: 'savedIds',
  UNSAVED_CHANGES: 'unsavedChanges',
});

export const SECTION_TAGS = Object.freeze({
  FEATURED_CHANNELS: '__section__featured__',
});

export const PLAYLIST_ICONS = {
  [FAVORITES_ID]: ICONS.STAR,
  [WATCH_LATER_ID]: ICONS.TIME,
  [QUEUE_ID]: ICONS.PLAYLIST,
};

export const LIST_TYPE = Object.freeze({
  ALL: 'All',
  PRIVATE: 'Private',
  PUBLIC: 'Public',
  EDITED: 'Edited',
  SAVED: 'Saved',
});
export const PLAYLIST_SHOW_COUNT = Object.freeze({ DEFAULT: 12, MOBILE: 6 });

export const SORT_ORDER = Object.freeze({
  ASC: 'asc', // ascending
  DESC: 'desc', // descending
});

export const SORT_KEYS = Object.freeze({
  NAME: 'name',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  COUNT: 'count',
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
  [SORT_KEYS.COUNT]: {
    str: 'Video Count',
    orders: { [SORT_ORDER.ASC]: 'Increasing', [SORT_ORDER.DESC]: 'Decreasing' },
  },
});

export const DEFAULT_SORT = { key: 'name', value: SORT_ORDER.ASC };
