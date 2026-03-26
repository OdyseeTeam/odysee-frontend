import {
  LIVESTREAM_SERVER_API,
  LIVESTREAM_INGEST_HOST,
  LIVESTREAM_WEBRTC_PORT,
  LIVESTREAM_WHIP_URL_TEMPLATE,
} from 'config';
export const LIVESTREAM_REPLAY_API = 'https://api.live.odysee.com/v1/replays/odysee';
export const LIVESTREAM_RTMP_URL = 'rtmp://stream.odysee.com/live';
export const LIVESTREAM_KILL = `${LIVESTREAM_SERVER_API}/streams/kill?app=live&`;
// new livestream endpoints (old can be removed at some future point)
export const NEW_LIVESTREAM_RTMP_URL = 'rtmp://publish.odysee.live/live';
export const NEW_LIVESTREAM_REPLAY_API = `${LIVESTREAM_SERVER_API}/replays/list`;
export const MAX_LIVESTREAM_COMMENTS = 50;
export const LIVESTREAM_STATUS_CHECK_INTERVAL = 45 * 1000;
export const LIVESTREAM_STATUS_CHECK_INTERVAL_SOON = 15 * 1000;
export const LIVESTREAM_STARTS_SOON_BUFFER = 15;
export const LIVESTREAM_STARTED_RECENTLY_BUFFER = 15;
export const LIVESTREAM_UPCOMING_BUFFER = 10;
export const FETCH_ACTIVE_LIVESTREAMS_MIN_INTERVAL_MS = 5 * 60 * 1000;

function normalizeIngestHost(raw: string | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    if (trimmed.includes('://')) return new URL(trimmed).hostname;
    return trimmed.split('/')[0].split(':')[0];
  } catch {
    return trimmed.split('/')[0].split(':')[0];
  }
}

function getIngestProtocolFromApi(): 'http' | 'https' {
  try {
    if (!LIVESTREAM_SERVER_API) return 'https';
    return new URL(LIVESTREAM_SERVER_API).protocol === 'http:' ? 'http' : 'https';
  } catch {
    return 'https';
  }
}

/** Hostname used for RTMP + WebRTC ingest (override or LIVESTREAM_SERVER_API). */
export function getLivestreamIngestHostname(): string {
  if (LIVESTREAM_INGEST_HOST) return normalizeIngestHost(LIVESTREAM_INGEST_HOST);
  if (!LIVESTREAM_SERVER_API) return '';
  try {
    return new URL(LIVESTREAM_SERVER_API).hostname;
  } catch {
    return '';
  }
}

/**
 * TURN server config for WebRTC publishing.
 * Prefer UDP first for better realtime behavior, with TCP relay available as fallback.
 */
export function getLivestreamTurnServer(): RTCIceServer | null {
  const host = getLivestreamIngestHostname();
  if (!host) return null;
  return {
    urls: [`turn:${host}:3478?transport=udp`, `turn:${host}:3478?transport=tcp`],
    username: 'ome',
    credential: 'airen',
  };
}

/**
 * RTMP URL shown in the Livestream setup UI (OBS, etc.).
 * Uses LIVESTREAM_INGEST_HOST or localhost-style LIVESTREAM_SERVER_API when set; otherwise the default publish URL.
 */
export function getLivestreamIngestRtmpUrl(): string {
  const host = getLivestreamIngestHostname();
  if (LIVESTREAM_INGEST_HOST) {
    return `rtmp://${host}/live`;
  }
  if (LIVESTREAM_SERVER_API && /localhost|127\.0\.0\.1/.test(LIVESTREAM_SERVER_API) && host) {
    return `rtmp://${host}/live`;
  }
  return NEW_LIVESTREAM_RTMP_URL;
}

/**
 * Stream key format from setup: `{channelClaimId}?d=...&s=...&t=...`
 * WHIP URL shape: `{proto}://{host}:{port}/live/{channelClaimId}?direction=whip&d=...&s=...&t=...`
 */
function parseStreamKeyForWhip(streamKey: string): { channelId: string; sigQuery: string } {
  const q = streamKey.indexOf('?');
  if (q === -1) {
    return { channelId: streamKey, sigQuery: '' };
  }
  return {
    channelId: streamKey.slice(0, q),
    sigQuery: streamKey.slice(q + 1),
  };
}

/**
 * WHIP (WebRTC) ingest URL for the browser publisher.
 * Default: `/live/{channelId}?direction=whip&{signature query}` (see `parseStreamKeyForWhip`).
 *
 * `LIVESTREAM_WHIP_URL_TEMPLATE` may include: `{streamKey}`, `{proto}`, `{host}`, `{port}`,
 * `{channelId}`, `{sigQuery}` (the part after `?` in the stream key, without leading `?`).
 */
export function getLivestreamWhipIngestUrl(streamKey: string): string | null {
  if (!streamKey || !LIVESTREAM_SERVER_API) return null;
  const host = getLivestreamIngestHostname();
  if (!host) return null;
  const port = LIVESTREAM_WEBRTC_PORT || '3334';
  const proto = getIngestProtocolFromApi();
  const { channelId, sigQuery } = parseStreamKeyForWhip(streamKey);

  if (LIVESTREAM_WHIP_URL_TEMPLATE) {
    return LIVESTREAM_WHIP_URL_TEMPLATE.split('{streamKey}')
      .join(streamKey)
      .split('{proto}')
      .join(proto)
      .split('{host}')
      .join(host)
      .split('{port}')
      .join(port)
      .split('{channelId}')
      .join(channelId)
      .split('{sigQuery}')
      .join(sigQuery);
  }

  if (!sigQuery) {
    return `${proto}://${host}:${port}/live/${channelId}?direction=whip`;
  }
  return `${proto}://${host}:${port}/live/${channelId}?direction=whip&${sigQuery}`;
}

/**
 * WebRTC playback URL for viewers (OME signaling endpoint).
 * Uses WebSocket signaling: `wss://host:port/live/{channelClaimId}`
 */
export function getLivestreamWebrtcPlaybackUrl(channelClaimId: string): string | null {
  const host = getLivestreamIngestHostname();
  if (!host) return null;
  const port = LIVESTREAM_WEBRTC_PORT || '3334';
  const proto = getIngestProtocolFromApi() === 'https' ? 'wss' : 'ws';
  return `${proto}://${host}:${port}/live/${channelClaimId}`;
}
