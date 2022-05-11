export const LIVESTREAM_REPLAY_API = 'https://api.live.odysee.com/v1/replays/odysee';
export const LIVESTREAM_RTMP_URL = 'rtmp://stream.odysee.com/live';
export const LIVESTREAM_KILL = 'https://api.odysee.live/streams/kill?app=live&';

// new livestream endpoints (old can be removed at some future point)
export const NEW_LIVESTREAM_RTMP_URL = 'rtmp://publish.odysee.live/live';
export const NEW_LIVESTREAM_REPLAY_API = 'https://api.odysee.live/replays/list';
export const NEW_LIVESTREAM_LIVE_API = 'https://api.odysee.live/livestream';

export const MAX_LIVESTREAM_COMMENTS = 50;

export const LIVESTREAM_STATUS_CHECK_INTERVAL = 45 * 1000;
export const LIVESTREAM_STATUS_CHECK_INTERVAL_SOON = 15 * 1000;
export const LIVESTREAM_STARTS_SOON_BUFFER = 15;
export const LIVESTREAM_STARTED_RECENTLY_BUFFER = 15;
export const LIVESTREAM_UPCOMING_BUFFER = 35;

export const FETCH_ACTIVE_LIVESTREAMS_MIN_INTERVAL_MS = 5 * 60 * 1000;
