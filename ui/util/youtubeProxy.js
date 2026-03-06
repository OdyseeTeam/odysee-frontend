// @flow
import { LocalStorage } from 'util/storage';

export const YOUTUBE_PROXY_MODE_AUTO = 'auto';
export const YOUTUBE_PROXY_MODE_EXTENSION = 'extension';
export const YOUTUBE_PROXY_MODE_MOBILE = 'mobile';
export const YOUTUBE_PROXY_MODE_DIRECT = 'direct';
export const YOUTUBE_PROXY_QUERY_PARAM = 'yt_proxy';
export const YOUTUBE_PROXY_MODE_QUERY_PARAM = 'yt_proxy_mode';
export const YOUTUBE_PROXY_MODE_STORAGE_KEY = 'odysee.youtubeProxy.mode';
export const YOUTUBE_PROXY_BASE_URL_STORAGE_KEY = 'odysee.youtubeProxy.baseUrl';

const WATCH_ON_ODYSEE_PROXY_REQUEST = 'WATCH_ON_ODYSEE_PROXY_REQUEST';
const WATCH_ON_ODYSEE_PROXY_RESPONSE = 'WATCH_ON_ODYSEE_PROXY_RESPONSE';
const WATCH_ON_ODYSEE_PROXY_FLAG = '__WATCH_ON_ODYSEE_PROXY_AVAILABLE__';
const YOUTUBE_PROXY_PATH = 'proxy';
const DEFAULT_TIMEOUT_MS = 10000;
const EXTENSION_WAIT_BUFFER_MS = 1000;
const BLOCKED_PROXY_HEADER_NAMES = new Set(['cookie', 'authorization', 'proxy-authorization']);
const SUPPORTED_PROXY_METHODS = new Set(['GET', 'HEAD', 'POST']);
const ALLOWED_YOUTUBE_HOSTS = ['youtube.com', 'youtu.be'];
const ALLOWED_YOUTUBE_EXACT_HOSTS = new Set(['youtubei.googleapis.com']);

export type YouTubeProxyMode = 'auto' | 'extension' | 'mobile' | 'direct';
export type YouTubeProxyResponseType = 'json' | 'text';
export type YouTubeProxySource = 'extension' | 'mobile' | 'direct';
export type YouTubeProxyMethod = 'GET' | 'HEAD' | 'POST';
export type YouTubeProxyHeaders = { [string]: string };

export type YouTubeProxyResult = {
  ok: boolean,
  status: number,
  statusText: string,
  url: string,
  headers: { [string]: string },
  responseType: YouTubeProxyResponseType,
  data: any,
  error?: string,
  source: YouTubeProxySource,
};

type ProxyRequestBody = string | { [string]: mixed } | Array<mixed> | number | boolean | null;

type ProxyFetchOptions = {
  url: string,
  method?: YouTubeProxyMethod,
  headers?: YouTubeProxyHeaders,
  body?: ProxyRequestBody,
  responseType?: YouTubeProxyResponseType,
  timeoutMs?: number,
  signal?: AbortSignal,
};

type AbortBundle = {
  signal: AbortSignal,
  cleanup: () => void,
};

type ExtensionProxyPayload = {
  ok?: boolean,
  status?: number,
  statusText?: string,
  url?: string,
  headers?: { [string]: string },
  data?: any,
  error?: string,
};

function createAbortBundle(timeoutMs: number, externalSignal?: AbortSignal): AbortBundle {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const onAbort = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onAbort);
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      window.clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onAbort);
      }
    },
  };
}

function createRequestId() {
  // $FlowFixMe[prop-missing]
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    // $FlowFixMe[prop-missing]
    return window.crypto.randomUUID();
  }

  return `woo_proxy_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function createAbortError() {
  const error: any = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

function isAllowedYouTubeUrl(rawUrl: string): boolean {
  let parsedUrl;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsedUrl.protocol !== 'https:') {
    return false;
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (ALLOWED_YOUTUBE_EXACT_HOSTS.has(hostname)) {
    return true;
  }

  return ALLOWED_YOUTUBE_HOSTS.some((allowedHost) => hostname === allowedHost || hostname.endsWith(`.${allowedHost}`));
}

function coerceProxyMode(value: ?string): ?YouTubeProxyMode {
  switch (value) {
    case YOUTUBE_PROXY_MODE_AUTO:
    case YOUTUBE_PROXY_MODE_EXTENSION:
    case YOUTUBE_PROXY_MODE_MOBILE:
    case YOUTUBE_PROXY_MODE_DIRECT:
      return (value: any);
    default:
      return null;
  }
}

function normalizeProxyMethod(rawMethod?: ?string): YouTubeProxyMethod {
  if (!rawMethod) {
    return 'GET';
  }

  const normalizedMethod = rawMethod.toUpperCase();
  return SUPPORTED_PROXY_METHODS.has(normalizedMethod) ? (normalizedMethod: any) : 'GET';
}

function sanitizeProxyHeaders(rawHeaders?: ?YouTubeProxyHeaders): YouTubeProxyHeaders {
  const sanitizedHeaders: YouTubeProxyHeaders = {};
  const sourceHeaders: YouTubeProxyHeaders = rawHeaders || {};

  if (!rawHeaders) {
    return sanitizedHeaders;
  }

  Object.keys(sourceHeaders).forEach((headerName) => {
    const trimmedName = headerName.trim();
    const lowerName = trimmedName.toLowerCase();
    const headerValue = sourceHeaders[headerName];

    if (!trimmedName || BLOCKED_PROXY_HEADER_NAMES.has(lowerName) || typeof headerValue !== 'string') {
      return;
    }

    const trimmedValue = headerValue.trim();
    if (!trimmedValue) {
      return;
    }

    sanitizedHeaders[trimmedName] = trimmedValue;
  });

  return sanitizedHeaders;
}

function hasHeader(headers: YouTubeProxyHeaders, headerName: string) {
  const lowerHeaderName = headerName.toLowerCase();
  return Object.keys(headers).some((name) => name.toLowerCase() === lowerHeaderName);
}

function normalizeProxyRequest({
  method,
  headers,
  body,
}: {
  method?: YouTubeProxyMethod,
  headers?: YouTubeProxyHeaders,
  body?: ProxyRequestBody,
}): {
  method: YouTubeProxyMethod,
  headers: YouTubeProxyHeaders,
  body?: string,
} {
  const normalizedMethod = normalizeProxyMethod(method);
  const normalizedHeaders = sanitizeProxyHeaders(headers);

  if (normalizedMethod !== 'POST' || body === undefined || body === null) {
    return {
      method: normalizedMethod,
      headers: normalizedHeaders,
    };
  }

  if (typeof body === 'string') {
    return {
      method: normalizedMethod,
      headers: normalizedHeaders,
      body,
    };
  }

  if (!hasHeader(normalizedHeaders, 'content-type')) {
    normalizedHeaders['Content-Type'] = 'application/json';
  }

  return {
    method: normalizedMethod,
    headers: normalizedHeaders,
    body: JSON.stringify(body),
  };
}

function normalizeMobileProxyBaseUrl(rawBaseUrl: ?string): ?string {
  if (!rawBaseUrl) return null;

  const trimmed = rawBaseUrl.trim();
  if (!trimmed) return null;

  try {
    const normalizedSource = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    const parsed = new URL(normalizedSource);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    parsed.hash = '';
    parsed.search = '';
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function readStoredMode(): YouTubeProxyMode {
  const storedMode = LocalStorage.getItem(YOUTUBE_PROXY_MODE_STORAGE_KEY);
  return coerceProxyMode(storedMode) || YOUTUBE_PROXY_MODE_AUTO;
}

function persistMode(mode: YouTubeProxyMode) {
  LocalStorage.setItem(YOUTUBE_PROXY_MODE_STORAGE_KEY, mode);
}

function persistBaseUrl(baseUrl: string) {
  LocalStorage.setItem(YOUTUBE_PROXY_BASE_URL_STORAGE_KEY, baseUrl);
}

function clearBaseUrl() {
  LocalStorage.removeItem(YOUTUBE_PROXY_BASE_URL_STORAGE_KEY);
}

export function setConfiguredYouTubeProxyMode(mode: YouTubeProxyMode) {
  persistMode(mode);
}

export function setConfiguredYouTubeProxyBaseUrl(baseUrl: ?string) {
  const normalizedBaseUrl = normalizeMobileProxyBaseUrl(baseUrl);

  if (normalizedBaseUrl) {
    persistBaseUrl(normalizedBaseUrl);
    return normalizedBaseUrl;
  }

  clearBaseUrl();
  return null;
}

export function clearConfiguredYouTubeProxySettings() {
  persistMode(YOUTUBE_PROXY_MODE_AUTO);
  clearBaseUrl();
}

function applyQueryOverrides() {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const rawProxy = params.get(YOUTUBE_PROXY_QUERY_PARAM);
  const rawMode = params.get(YOUTUBE_PROXY_MODE_QUERY_PARAM);

  if (rawProxy) {
    const lowered = rawProxy.trim().toLowerCase();
    const normalizedMode = coerceProxyMode(lowered);
    if (normalizedMode) {
      persistMode(normalizedMode);
    } else if (lowered === 'off' || lowered === 'clear') {
      persistMode(YOUTUBE_PROXY_MODE_DIRECT);
      clearBaseUrl();
    } else {
      const normalizedBaseUrl = normalizeMobileProxyBaseUrl(rawProxy);
      if (normalizedBaseUrl) {
        persistBaseUrl(normalizedBaseUrl);
        persistMode(YOUTUBE_PROXY_MODE_MOBILE);
      }
    }
  }

  if (rawMode) {
    const loweredMode = rawMode.trim().toLowerCase();
    const normalizedMode = coerceProxyMode(loweredMode);
    if (normalizedMode) {
      persistMode(normalizedMode);
    }
  }
}

export function getConfiguredYouTubeProxyBaseUrl(): ?string {
  applyQueryOverrides();
  return normalizeMobileProxyBaseUrl(LocalStorage.getItem(YOUTUBE_PROXY_BASE_URL_STORAGE_KEY));
}

export function getConfiguredYouTubeProxyMode(): YouTubeProxyMode {
  applyQueryOverrides();
  return readStoredMode();
}

function hasExtensionBridgeMarker() {
  if (typeof window === 'undefined') return false;

  // $FlowFixMe[prop-missing]
  if (window[WATCH_ON_ODYSEE_PROXY_FLAG] === true) {
    return true;
  }

  if (typeof document !== 'undefined' && document.documentElement) {
    return document.documentElement.getAttribute('data-watch-on-odysee-proxy') === 'true';
  }

  return false;
}

function headersToObject(headers: Headers): { [string]: string } {
  const headerMap: { [string]: string } = {};

  headers.forEach((value, name) => {
    headerMap[name] = value;
  });

  return headerMap;
}

function buildMobileProxyEndpointUrl(baseUrl: string) {
  const proxyUrl = new URL(baseUrl);
  const basePath = proxyUrl.pathname.replace(/\/+$/, '');

  proxyUrl.pathname = `${basePath}/${YOUTUBE_PROXY_PATH}`.replace(/\/{2,}/g, '/');

  return proxyUrl;
}

function buildMobileProxyRequestUrl(
  baseUrl: string,
  targetUrl: string,
  method: YouTubeProxyMethod,
  responseType: YouTubeProxyResponseType,
  timeoutMs: number
) {
  const proxyUrl = buildMobileProxyEndpointUrl(baseUrl);
  proxyUrl.searchParams.set('url', targetUrl);
  proxyUrl.searchParams.set('method', method);
  proxyUrl.searchParams.set('responseType', responseType);
  proxyUrl.searchParams.set('timeoutMs', String(timeoutMs));

  return proxyUrl.toString();
}

async function fetchViaMobileProxy({
  baseUrl,
  targetUrl,
  method,
  headers,
  body,
  responseType,
  timeoutMs,
  signal,
}: {
  baseUrl: string,
  targetUrl: string,
  method: YouTubeProxyMethod,
  headers: YouTubeProxyHeaders,
  body?: string,
  responseType: YouTubeProxyResponseType,
  timeoutMs: number,
  signal?: AbortSignal,
}): Promise<YouTubeProxyResult> {
  const canUseQueryTransport = method !== 'POST' && !body && Object.keys(headers).length === 0;
  const response = await fetch(
    canUseQueryTransport
      ? buildMobileProxyRequestUrl(baseUrl, targetUrl, method, responseType, timeoutMs)
      : buildMobileProxyEndpointUrl(baseUrl).toString(),
    canUseQueryTransport
      ? {
          method: 'GET',
          signal,
        }
      : {
          method: 'POST',
          signal,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: targetUrl,
            method,
            responseType,
            timeoutMs,
            headers,
            body,
          }),
        }
  );
  const json: any = await response.json();

  if (!json || typeof json !== 'object') {
    throw new Error('Invalid response from mobile YouTube proxy.');
  }

  return {
    ok: Boolean(json.ok),
    status: typeof json.status === 'number' ? json.status : response.status,
    statusText: typeof json.statusText === 'string' ? json.statusText : response.statusText,
    url: typeof json.url === 'string' ? json.url : targetUrl,
    headers: json.headers && typeof json.headers === 'object' ? json.headers : {},
    responseType,
    data: json.data,
    error: typeof json.error === 'string' ? json.error : undefined,
    source: 'mobile',
  };
}

function fetchViaExtensionBridge({
  targetUrl,
  method,
  headers,
  body,
  responseType,
  timeoutMs,
  signal,
}: {
  targetUrl: string,
  method: YouTubeProxyMethod,
  headers: YouTubeProxyHeaders,
  body?: string,
  responseType: YouTubeProxyResponseType,
  timeoutMs: number,
  signal?: AbortSignal,
}): Promise<YouTubeProxyResult> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof window.postMessage !== 'function') {
      reject(new Error('Extension bridge is unavailable in this context.'));
      return;
    }

    const requestId = createRequestId();
    let settled = false;

    const onAbort = () => finalizeReject(createAbortError());
    const timeoutId = window.setTimeout(
      () => finalizeReject(new Error('YouTube extension proxy timed out or is unavailable.')),
      timeoutMs + EXTENSION_WAIT_BUFFER_MS
    );

    function cleanup() {
      window.clearTimeout(timeoutId);
      window.removeEventListener('message', onMessage);
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
    }

    function finalizeResolve(value: YouTubeProxyResult) {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    }

    function finalizeReject(error: Error) {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    }

    function onMessage(event) {
      if (event.source !== window) return;

      const data = event.data;
      if (!data || data.type !== WATCH_ON_ODYSEE_PROXY_RESPONSE || data.requestId !== requestId) {
        return;
      }

      const payload: ?ExtensionProxyPayload = data.payload;
      if (!payload || typeof payload !== 'object') {
        finalizeReject(new Error('Extension proxy returned an invalid payload.'));
        return;
      }

      finalizeResolve({
        ok: Boolean(payload.ok),
        status: typeof payload.status === 'number' ? payload.status : 0,
        statusText: typeof payload.statusText === 'string' ? payload.statusText : '',
        url: typeof payload.url === 'string' ? payload.url : targetUrl,
        headers: payload.headers && typeof payload.headers === 'object' ? payload.headers : {},
        responseType,
        data: payload.data,
        error: typeof payload.error === 'string' ? payload.error : undefined,
        source: 'extension',
      });
    }

    if (signal) {
      if (signal.aborted) {
        finalizeReject(createAbortError());
        return;
      }

      signal.addEventListener('abort', onAbort);
    }

    window.addEventListener('message', onMessage);
    window.postMessage(
      {
        type: WATCH_ON_ODYSEE_PROXY_REQUEST,
        requestId,
        payload: {
          url: targetUrl,
          method,
          headers,
          body,
          responseType,
          timeoutMs,
        },
      },
      window.location.origin
    );
  });
}

async function fetchDirect({
  targetUrl,
  method,
  headers,
  body,
  responseType,
  signal,
}: {
  targetUrl: string,
  method: YouTubeProxyMethod,
  headers: YouTubeProxyHeaders,
  body?: string,
  responseType: YouTubeProxyResponseType,
  signal?: AbortSignal,
}): Promise<YouTubeProxyResult> {
  const response = await fetch(targetUrl, { method, headers, body, signal });
  const data = method === 'HEAD' ? null : responseType === 'json' ? await response.json() : await response.text();

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    url: response.url || targetUrl,
    headers: headersToObject(response.headers),
    responseType,
    data,
    error: response.ok ? undefined : `Request failed (${response.status})`,
    source: 'direct',
  };
}

export async function fetchYouTubeResource(options: ProxyFetchOptions): Promise<YouTubeProxyResult> {
  const { url, responseType = 'json', timeoutMs = DEFAULT_TIMEOUT_MS, signal } = options;
  const normalizedRequest = normalizeProxyRequest({
    method: options.method,
    headers: options.headers,
    body: options.body,
  });

  if (!isAllowedYouTubeUrl(url)) {
    throw new Error(
      'Only https://youtube.com/*, https://youtu.be/*, and https://youtubei.googleapis.com/* resources are supported.'
    );
  }

  const mode = getConfiguredYouTubeProxyMode();
  const baseUrl = getConfiguredYouTubeProxyBaseUrl();
  const abortBundle = createAbortBundle(timeoutMs, signal);

  try {
    if (mode === YOUTUBE_PROXY_MODE_EXTENSION) {
      return await fetchViaExtensionBridge({
        targetUrl: url,
        method: normalizedRequest.method,
        headers: normalizedRequest.headers,
        body: normalizedRequest.body,
        responseType,
        timeoutMs,
        signal: abortBundle.signal,
      });
    }

    if (mode === YOUTUBE_PROXY_MODE_MOBILE) {
      if (!baseUrl) {
        throw new Error('No mobile YouTube proxy URL is configured.');
      }

      return await fetchViaMobileProxy({
        baseUrl,
        targetUrl: url,
        method: normalizedRequest.method,
        headers: normalizedRequest.headers,
        body: normalizedRequest.body,
        responseType,
        timeoutMs,
        signal: abortBundle.signal,
      });
    }

    if (mode === YOUTUBE_PROXY_MODE_DIRECT) {
      return await fetchDirect({
        targetUrl: url,
        method: normalizedRequest.method,
        headers: normalizedRequest.headers,
        body: normalizedRequest.body,
        responseType,
        signal: abortBundle.signal,
      });
    }

    if (baseUrl) {
      return await fetchViaMobileProxy({
        baseUrl,
        targetUrl: url,
        method: normalizedRequest.method,
        headers: normalizedRequest.headers,
        body: normalizedRequest.body,
        responseType,
        timeoutMs,
        signal: abortBundle.signal,
      });
    }

    if (hasExtensionBridgeMarker()) {
      return await fetchViaExtensionBridge({
        targetUrl: url,
        method: normalizedRequest.method,
        headers: normalizedRequest.headers,
        body: normalizedRequest.body,
        responseType,
        timeoutMs,
        signal: abortBundle.signal,
      });
    }

    return await fetchDirect({
      targetUrl: url,
      method: normalizedRequest.method,
      headers: normalizedRequest.headers,
      body: normalizedRequest.body,
      responseType,
      signal: abortBundle.signal,
    });
  } finally {
    abortBundle.cleanup();
  }
}

export async function fetchYouTubeJson(url: string, options?: $Shape<ProxyFetchOptions>): Promise<any> {
  const result = await fetchYouTubeResource({ ...(options || {}), url, responseType: 'json' });

  if (!result.ok) {
    throw new Error(result.error || `YouTube request failed (${result.status})`);
  }

  return result.data;
}

export async function fetchYouTubeText(url: string, options?: $Shape<ProxyFetchOptions>): Promise<string> {
  const result = await fetchYouTubeResource({ ...(options || {}), url, responseType: 'text' });

  if (!result.ok) {
    throw new Error(result.error || `YouTube request failed (${result.status})`);
  }

  return typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
}
