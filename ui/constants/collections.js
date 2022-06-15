import * as ICONS from 'constants/icons';

// ui
export const ICON_SIZE = 12;

// see which of these are used
export const COLLECTION_ID = 'lid';
export const COLLECTION_INDEX = 'linx';

export const COL_TYPE_PLAYLIST = 'playlist';
export const COL_TYPE_CHANNELS = 'channelList';

export const WATCH_LATER_ID = 'watchlater';
export const WATCH_LATER_NAME = 'Watch Later';

export const FAVORITES_ID = 'favorites';
export const FAVORITES_NAME = 'Favorites';

export const QUEUE_ID = 'queue';
export const QUEUE_NAME = 'Queue';

export const BUILTIN_PLAYLISTS = [WATCH_LATER_ID, FAVORITES_ID, QUEUE_ID];
// export const FAVORITE_CHANNELS_ID = 'favoriteChannels';
// export const BUILTIN_LISTS = [WATCH_LATER_ID, FAVORITES_ID, FAVORITE_CHANNELS_ID];

export const COL_KEY_BUILTIN = 'builtin';
export const COL_KEY_EDITED = 'edited';
export const COL_KEY_UNPUBLISHED = 'unpublished';
export const COL_KEY_PENDING = 'pending';

export const PLAYLIST_ICONS = {
  [FAVORITES_ID]: ICONS.STAR,
  [WATCH_LATER_ID]: ICONS.TIME,
  [QUEUE_ID]: ICONS.PLAYLIST,
};
