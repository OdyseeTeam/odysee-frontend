// @flow
import { LocalStorage } from 'util/storage';
import { fetchYouTubeJson, fetchYouTubeText } from 'util/youtubeProxy';
import type { YouTubeProxyHeaders } from 'util/youtubeProxy';

export const YOUTUBE_INNERTUBE_STORAGE_KEY = 'odysee.youtubeProxy.innertube';
export const DEFAULT_YOUTUBE_INNERTUBE_VIDEO_ID = 'S4Qf8o4QSDs';

export type YouTubeInnertubeConfig = {
  apiKey: string,
  clientName: string,
  clientVersion: string,
  hl: string,
  gl: string,
  visitorData: string,
};

export type YouTubeSearchResultItem = {
  id: string,
  type: 'video' | 'channel' | 'playlist',
  title: string,
  url: string,
  channelName?: string,
  channelUrl?: string,
  channelId?: string,
  publishedText?: string,
  viewsText?: string,
  durationText?: string,
  thumbnailUrl?: string,
  videoId?: string,
  isLive?: boolean,
  isShort?: boolean,
};

export type YouTubeSearchResultPage = {
  items: Array<YouTubeSearchResultItem>,
  continuationToken?: string,
  estimatedResults?: string,
};

export const DEFAULT_YOUTUBE_INNERTUBE_CONFIG: YouTubeInnertubeConfig = {
  apiKey: '',
  clientName: '1',
  clientVersion: '',
  hl: 'en',
  gl: 'US',
  visitorData: '',
};

const INNERTUBE_CONTEXT_NAMES = { '1': 'WEB', '2': 'ANDROID', '3': 'IOS', '5': 'MWEB', '7': 'TVHTML5' };

type DetectOptions = {
  videoId?: string,
  signal?: AbortSignal,
  timeoutMs?: number,
};

type SearchOptions = {
  query?: string,
  continuationToken?: string,
  config?: $Shape<YouTubeInnertubeConfig>,
  signal?: AbortSignal,
  timeoutMs?: number,
};

function normalizeInnertubeConfig(config: ?$Shape<YouTubeInnertubeConfig>): YouTubeInnertubeConfig {
  const sourceConfig = config || {};

  return {
    apiKey: typeof sourceConfig.apiKey === 'string' ? sourceConfig.apiKey : DEFAULT_YOUTUBE_INNERTUBE_CONFIG.apiKey,
    clientName:
      typeof sourceConfig.clientName === 'string' && sourceConfig.clientName
        ? sourceConfig.clientName
        : DEFAULT_YOUTUBE_INNERTUBE_CONFIG.clientName,
    clientVersion:
      typeof sourceConfig.clientVersion === 'string'
        ? sourceConfig.clientVersion
        : DEFAULT_YOUTUBE_INNERTUBE_CONFIG.clientVersion,
    hl: typeof sourceConfig.hl === 'string' && sourceConfig.hl ? sourceConfig.hl : DEFAULT_YOUTUBE_INNERTUBE_CONFIG.hl,
    gl: typeof sourceConfig.gl === 'string' && sourceConfig.gl ? sourceConfig.gl : DEFAULT_YOUTUBE_INNERTUBE_CONFIG.gl,
    visitorData:
      typeof sourceConfig.visitorData === 'string'
        ? sourceConfig.visitorData
        : DEFAULT_YOUTUBE_INNERTUBE_CONFIG.visitorData,
  };
}

function extractConfigValue(source: string, key: string): ?string {
  const match = source.match(new RegExp(`"${key}":("?)([^",}\\]]+)\\1`));
  return match ? match[2] : null;
}

function getTextFromRuns(value: any): string {
  if (!value || typeof value !== 'object') {
    return '';
  }

  if (typeof value.simpleText === 'string') {
    return value.simpleText;
  }

  if (Array.isArray(value.runs)) {
    return value.runs
      .map((run) => (run && typeof run.text === 'string' ? run.text : ''))
      .join('')
      .trim();
  }

  return '';
}

function getThumbnailUrl(value: any): ?string {
  const thumbnails = value?.thumbnails;
  if (!Array.isArray(thumbnails) || thumbnails.length === 0) {
    return null;
  }

  const last = thumbnails[thumbnails.length - 1];
  return typeof last?.url === 'string' ? last.url : null;
}

function getContinuationToken(value: any): ?string {
  const token =
    value?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token ||
    value?.continuationItemRenderer?.button?.buttonRenderer?.command?.continuationCommand?.token ||
    value?.continuationEndpoint?.continuationCommand?.token;

  return typeof token === 'string' && token ? token : null;
}

function isLiveVideoRenderer(videoRenderer: any): boolean {
  if (!videoRenderer || typeof videoRenderer !== 'object') {
    return false;
  }

  const thumbnailOverlays = Array.isArray(videoRenderer.thumbnailOverlays) ? videoRenderer.thumbnailOverlays : [];
  const style = thumbnailOverlays.find((overlay) => overlay?.thumbnailOverlayTimeStatusRenderer?.style === 'LIVE');
  if (style) {
    return true;
  }

  const badges = videoRenderer?.badges || [];
  return badges.some((badge) => {
    const label = badge?.metadataBadgeRenderer?.label;
    return typeof label === 'string' && label.toLowerCase().includes('live');
  });
}

function isShortVideoRenderer(videoRenderer: any): boolean {
  const webCommand = videoRenderer?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url;
  return typeof webCommand === 'string' && webCommand.includes('/shorts/');
}

function parseVideoRenderer(videoRenderer: any): ?YouTubeSearchResultItem {
  const videoId = typeof videoRenderer?.videoId === 'string' ? videoRenderer.videoId : '';
  const title = getTextFromRuns(videoRenderer?.title);

  if (!videoId || !title) {
    return null;
  }

  const channelName = getTextFromRuns(videoRenderer?.ownerText) || getTextFromRuns(videoRenderer?.shortBylineText);
  const channelId = videoRenderer?.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
  const channelUrl = videoRenderer?.ownerText?.runs?.[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url;

  return {
    id: `video:${videoId}`,
    type: 'video',
    title,
    url: `/$/${videoId}`,
    channelName: channelName || undefined,
    channelId: typeof channelId === 'string' ? channelId : undefined,
    channelUrl: typeof channelUrl === 'string' ? `https://www.youtube.com${channelUrl}` : undefined,
    publishedText: getTextFromRuns(videoRenderer?.publishedTimeText) || undefined,
    viewsText:
      getTextFromRuns(videoRenderer?.viewCountText) || getTextFromRuns(videoRenderer?.shortViewCountText) || undefined,
    durationText: getTextFromRuns(videoRenderer?.lengthText) || undefined,
    thumbnailUrl: getThumbnailUrl(videoRenderer?.thumbnail) || undefined,
    videoId,
    isLive: isLiveVideoRenderer(videoRenderer),
    isShort: isShortVideoRenderer(videoRenderer),
  };
}

function parseChannelRenderer(channelRenderer: any): ?YouTubeSearchResultItem {
  const channelId = typeof channelRenderer?.channelId === 'string' ? channelRenderer.channelId : '';
  const title = getTextFromRuns(channelRenderer?.title);

  if (!channelId || !title) {
    return null;
  }

  const channelUrl = channelRenderer?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url;

  return {
    id: `channel:${channelId}`,
    type: 'channel',
    title,
    url:
      typeof channelUrl === 'string'
        ? `https://www.youtube.com${channelUrl}`
        : `https://www.youtube.com/channel/${channelId}`,
    channelName: title,
    channelId,
    viewsText: getTextFromRuns(channelRenderer?.videoCountText) || undefined,
    thumbnailUrl: getThumbnailUrl(channelRenderer?.thumbnail) || undefined,
  };
}

function parsePlaylistRenderer(playlistRenderer: any): ?YouTubeSearchResultItem {
  const playlistId = typeof playlistRenderer?.playlistId === 'string' ? playlistRenderer.playlistId : '';
  const title = getTextFromRuns(playlistRenderer?.title);

  if (!playlistId || !title) {
    return null;
  }

  const owner = getTextFromRuns(playlistRenderer?.longBylineText) || getTextFromRuns(playlistRenderer?.shortBylineText);

  return {
    id: `playlist:${playlistId}`,
    type: 'playlist',
    title,
    url: `https://www.youtube.com/playlist?list=${playlistId}`,
    channelName: owner || undefined,
    viewsText:
      getTextFromRuns(playlistRenderer?.videoCountShortText) ||
      getTextFromRuns(playlistRenderer?.videoCount) ||
      undefined,
    thumbnailUrl: getThumbnailUrl(playlistRenderer?.thumbnails?.[0] || playlistRenderer?.thumbnail) || undefined,
  };
}

function collectSearchResults(
  node: any,
  items: Array<YouTubeSearchResultItem>,
  seen: Set<string>,
  continuation: { token: ?string }
) {
  if (!node) {
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((entry) => collectSearchResults(entry, items, seen, continuation));
    return;
  }

  if (typeof node !== 'object') {
    return;
  }

  const nextContinuation = getContinuationToken(node);
  if (nextContinuation && !continuation.token) {
    continuation.token = nextContinuation;
  }

  const parsedItem =
    parseVideoRenderer(node.videoRenderer) ||
    parseChannelRenderer(node.channelRenderer) ||
    parsePlaylistRenderer(node.playlistRenderer);

  if (parsedItem && !seen.has(parsedItem.id)) {
    seen.add(parsedItem.id);
    items.push(parsedItem);
  }

  Object.keys(node).forEach((key) => {
    collectSearchResults(node[key], items, seen, continuation);
  });
}

function parseSearchResults(data: any): YouTubeSearchResultPage {
  const items = [];
  const seen = new Set();
  const continuation = { token: null };

  collectSearchResults(data, items, seen, continuation);

  return {
    items,
    continuationToken: continuation.token || undefined,
    estimatedResults: typeof data?.estimatedResults === 'string' ? data.estimatedResults : undefined,
  };
}

export function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId.trim() || DEFAULT_YOUTUBE_INNERTUBE_VIDEO_ID)}`;
}

export function extractYouTubeInnertubeConfigFromHtml(source: string): $Shape<YouTubeInnertubeConfig> {
  return {
    apiKey: extractConfigValue(source, 'INNERTUBE_API_KEY') || '',
    clientName: extractConfigValue(source, 'INNERTUBE_CLIENT_NAME') || '',
    clientVersion: extractConfigValue(source, 'INNERTUBE_CLIENT_VERSION') || '',
    hl: extractConfigValue(source, 'INNERTUBE_CONTEXT_HL') || extractConfigValue(source, 'HL') || '',
    gl: extractConfigValue(source, 'INNERTUBE_CONTEXT_GL') || extractConfigValue(source, 'GL') || '',
    visitorData: extractConfigValue(source, 'VISITOR_DATA') || extractConfigValue(source, 'visitorData') || '',
  };
}

export function getStoredYouTubeInnertubeConfig(): YouTubeInnertubeConfig {
  try {
    const stored = LocalStorage.getItem(YOUTUBE_INNERTUBE_STORAGE_KEY);
    if (!stored) {
      return normalizeInnertubeConfig(null);
    }

    return normalizeInnertubeConfig(JSON.parse(stored));
  } catch {
    return normalizeInnertubeConfig(null);
  }
}

export function setStoredYouTubeInnertubeConfig(config: $Shape<YouTubeInnertubeConfig>): YouTubeInnertubeConfig {
  const nextConfig = normalizeInnertubeConfig({ ...getStoredYouTubeInnertubeConfig(), ...config });
  LocalStorage.setItem(YOUTUBE_INNERTUBE_STORAGE_KEY, JSON.stringify(nextConfig));
  return nextConfig;
}

export async function detectYouTubeInnertubeConfig(options?: DetectOptions = {}): Promise<YouTubeInnertubeConfig> {
  const watchPage = await fetchYouTubeText(
    buildYouTubeWatchUrl(options.videoId || DEFAULT_YOUTUBE_INNERTUBE_VIDEO_ID),
    {
      signal: options.signal,
      timeoutMs: options.timeoutMs || 10000,
    }
  );
  const detected = normalizeInnertubeConfig(extractYouTubeInnertubeConfigFromHtml(watchPage));

  if (!detected.apiKey || !detected.clientVersion) {
    throw new Error('Could not find Innertube API key and client version in the watch page.');
  }

  return setStoredYouTubeInnertubeConfig(detected);
}

export async function ensureYouTubeInnertubeConfig(options?: DetectOptions = {}): Promise<YouTubeInnertubeConfig> {
  const storedConfig = getStoredYouTubeInnertubeConfig();

  if (storedConfig.apiKey && storedConfig.clientVersion) {
    return storedConfig;
  }

  return detectYouTubeInnertubeConfig(options);
}

function toDetectOptions(options?: SearchOptions): DetectOptions {
  return {
    signal: options && options.signal,
    timeoutMs: options && options.timeoutMs,
  };
}

export function buildYouTubeInnertubeHeaders(config: $Shape<YouTubeInnertubeConfig>): YouTubeProxyHeaders {
  const normalized = normalizeInnertubeConfig(config);
  const headers: { [string]: string } = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-YouTube-Client-Name': normalized.clientName || DEFAULT_YOUTUBE_INNERTUBE_CONFIG.clientName,
    'X-YouTube-Client-Version': normalized.clientVersion,
  };

  if (normalized.visitorData) {
    headers['X-Goog-Visitor-Id'] = normalized.visitorData;
    headers['X-Youtube-Bootstrap-Logged-In'] = 'false';
  }

  return headers;
}

export function buildYouTubeInnertubeContext(config: $Shape<YouTubeInnertubeConfig>): { client: { [string]: string } } {
  const normalized = normalizeInnertubeConfig(config);
  const client: { [string]: string } = {
    clientName: INNERTUBE_CONTEXT_NAMES[normalized.clientName] || 'WEB',
    clientVersion: normalized.clientVersion,
    hl: normalized.hl,
    gl: normalized.gl,
  };

  if (normalized.visitorData) {
    client.visitorData = normalized.visitorData;
  }

  return { client };
}

async function runInnertubeRequest(endpoint: string, body: { [string]: mixed }, options?: SearchOptions = {}) {
  const config = options.config
    ? normalizeInnertubeConfig(options.config)
    : await ensureYouTubeInnertubeConfig(toDetectOptions(options));
  const apiKey = config.apiKey.trim();

  if (!apiKey || !config.clientVersion.trim()) {
    throw new Error('Innertube config is incomplete.');
  }

  return fetchYouTubeJson(
    `https://www.youtube.com/youtubei/v1/${endpoint}?prettyPrint=false&key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: buildYouTubeInnertubeHeaders(config),
      body,
      signal: options.signal,
      timeoutMs: options.timeoutMs || 10000,
    }
  );
}

export async function searchYouTubeInnertube(options: SearchOptions): Promise<YouTubeSearchResultPage> {
  const query = typeof options.query === 'string' ? options.query.trim() : '';
  const continuationToken = typeof options.continuationToken === 'string' ? options.continuationToken.trim() : '';
  const config = options.config
    ? normalizeInnertubeConfig(options.config)
    : await ensureYouTubeInnertubeConfig(toDetectOptions(options));
  const context = buildYouTubeInnertubeContext(config);

  const data = await runInnertubeRequest(
    'search',
    continuationToken ? { context, continuation: continuationToken } : { context, query },
    { ...options, config }
  );

  return parseSearchResults(data);
}
