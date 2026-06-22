import { ODYSEE_HYPERBEAM_NODE_API } from 'config';
import { getHyperbeamMode, HYPERBEAM_MODES, shouldAllowOriginalNetworkFallback } from 'util/hyperbeamMode';

export type HyperbeamDebugLevel = 'info' | 'ok' | 'warn' | 'error';

export type HyperbeamDebugEvent = {
  time: string;
  label: string;
  level: HyperbeamDebugLevel;
  data?: any;
};

const EVENT_NAME = 'odysee-hyperbeam-debug';
const MAX_BUFFERED_EVENTS = 320;
let installed = false;
const bufferedEvents: Array<HyperbeamDebugEvent> = [];

export function hyperbeamDebugColor(level: HyperbeamDebugLevel, sourceLayer?: string) {
  const source = String(sourceLayer || '');
  if (source === 'native-device') return '#0ea5e9';
  if (level === 'error' || source === 'native-failed' || source === 'native-missing') return '#ff4d7d';
  if (source === 'original') return '#94a3b8';
  if (source === 'native:sdk-proxy') return '#a78bfa';
  if (
    level === 'warn' ||
    source.startsWith('fallback') ||
    source === 'device:fallback' ||
    source.startsWith('materialized:')
  ) {
    return '#ffb020';
  }
  if (level === 'ok') return '#22c55e';
  return 'rgba(255,255,255,0.76)';
}

export function pushHyperbeamDebug(label: string, data?: any, level: HyperbeamDebugLevel = 'info') {
  if (typeof window === 'undefined') return;

  const event = {
    time: new Date().toLocaleTimeString(),
    label,
    level,
    data,
  };
  bufferedEvents.push(event);
  if (bufferedEvents.length > MAX_BUFFERED_EVENTS) {
    bufferedEvents.splice(0, bufferedEvents.length - MAX_BUFFERED_EVENTS);
  }

  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, {
      detail: event,
    })
  );
}

export function addHyperbeamDebugListener(listener: (event: HyperbeamDebugEvent) => void) {
  const wrapped = (event: Event) => listener((event as CustomEvent<HyperbeamDebugEvent>).detail);
  window.addEventListener(EVENT_NAME, wrapped);
  bufferedEvents.forEach(listener);
  return () => window.removeEventListener(EVENT_NAME, wrapped);
}

export function installHyperbeamFetchDebug() {
  if (installed || typeof window === 'undefined' || typeof fetch !== 'function') return;

  const nodeBase = String(ODYSEE_HYPERBEAM_NODE_API || '').replace(/\/+$/, '');

  installed = true;
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    const mode = getHyperbeamMode();
    const isHyperbeam = Boolean(url && url.startsWith(nodeBase));
    const shouldLog = isHyperbeam || (shouldAllowOriginalNetworkFallback() && isOriginalModeFetch(url));
    const startedAt = performance.now();
    const pageContext = pageContextSummary();

    if (shouldLog) {
      pushHyperbeamDebug(
        'request',
        requestSummary(url, input, init, isHyperbeam ? undefined : 'original', pageContext),
        'info'
      );
    }

    try {
      const response = await nativeFetch(input, init);
      if (!shouldLog) return response;

      const elapsedMs = Math.round(performance.now() - startedAt);
      const summary = await responseSummary(
        url,
        response,
        elapsedMs,
        isHyperbeam ? hyperbeamFallbackLayer(url) : 'original',
        pageContext
      );
      pushHyperbeamDebug('response', summary, response.ok ? 'ok' : 'error');
      return response;
    } catch (error: any) {
      if (shouldLog) {
        pushHyperbeamDebug(
          'request failed',
          {
            ...pageContext,
            url: sanitizeUrl(url),
            method: requestMethod(input, init),
            devicePath: devicePath(url),
            device: hyperbeamDevice(url),
            deviceLayer: hyperbeamDeviceLayer(url),
            sourceLayer: isHyperbeam ? hyperbeamFallbackLayer(url) : 'original',
            error: String(error?.message || error),
            elapsedMs: Math.round(performance.now() - startedAt),
          },
          'error'
        );
      }

      throw error;
    }
  };
}

function hyperbeamFallbackLayer(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.pathname === '/~odysee@1.0/sdk') return 'fallback:sdk_proxy';
  } catch {}
  return undefined;
}

function isOriginalModeFetch(url: string) {
  if (!url) return false;

  try {
    const parsed = new URL(url, window.location.origin);
    const path = parsed.pathname;
    if (path.startsWith('/public/') || path.startsWith('/static/') || path === '/favicon.ico') return false;
    return true;
  } catch {
    return true;
  }
}

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit) {
  return String(init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET') || 'GET');
}

function requestSummary(
  url: string,
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackSourceLayer?: string,
  pageContext: Record<string, any> = pageContextSummary()
) {
  return {
    ...pageContext,
    method: requestMethod(input, init),
    devicePath: devicePath(url),
    device: hyperbeamDevice(url),
    deviceLayer: hyperbeamDeviceLayer(url),
    url: sanitizeUrl(url),
    sourceLayer: fallbackSourceLayer,
    bodyBytes: typeof init?.body === 'string' ? init.body.length : undefined,
  };
}

async function responseSummary(
  url: string,
  response: Response,
  elapsedMs: number,
  fallbackSourceLayer?: string,
  pageContext: Record<string, any> = pageContextSummary()
) {
  const summary: Record<string, any> = {
    ...pageContext,
    status: response.status,
    ok: response.ok,
    elapsedMs,
    devicePath: devicePath(url),
    device: hyperbeamDevice(url),
    deviceLayer: hyperbeamDeviceLayer(url),
    contentType: response.headers.get('content-type'),
    contentLength: response.headers.get('content-length'),
    contentRange: response.headers.get('content-range'),
    acceptRanges: response.headers.get('accept-ranges'),
    mediaMs: response.headers.get('x-odysee-media-ms'),
    mediaBlobs: response.headers.get('x-odysee-media-blobs'),
    responseDevice: response.headers.get('device'),
    sourceLayer: response.headers.get('x-odysee-source-layer') || fallbackSourceLayer,
    sourceReason: redactSensitive(response.headers.get('x-odysee-source-reason') || undefined),
  };
  const signatureInput = response.headers.get('signature-input') || '';
  summary.sourceAlg = nativeResponseDevice(response.headers.get('device'));
  if (signatureInput) {
    summary.signatureInput = redactSensitiveString(signatureInput.slice(0, 900));
    summary.sourceAlg = sourceCommitmentAlg(signatureInput) || nativeResponseDevice(response.headers.get('device'));
  }

  if (!response.ok || (response.headers.get('content-type') || '').includes('application/json')) {
    summary.body = await response
      .clone()
      .text()
      .then((text) => previewBody(text))
      .then((body) => redactSensitive(body))
      .catch(() => null);
    summary.sourceLayer = summary.sourceLayer || sourceLayer(summary.body);
  }

  return summary;
}

function pageContextSummary() {
  if (typeof window === 'undefined') return {};

  return {
    pageUrl: sanitizeUrl(window.location.href),
    pagePath: `${window.location.pathname}${window.location.search}${window.location.hash}`,
  };
}

function sourceLayer(body: any) {
  if (body?.reason === 'native_source_required') return 'native-missing';

  const layer =
    body?.['source-layer'] ||
    body?.['source_layer'] ||
    body?.sourceLayer ||
    body?.result?.['source-layer'] ||
    body?.result?.['source_layer'] ||
    body?.result?.sourceLayer ||
    body?.body?.['source-layer'] ||
    body?.body?.['source_layer'] ||
    body?.body?.sourceLayer;

  if (!layer) return undefined;
  if (layer.native === true) {
    if (layer.source === 'backend_api_proxy' || String(layer.source?.source || '').startsWith('backend_api_proxy')) {
      return 'native:sdk-proxy';
    }
    return 'native-device';
  }
  if (layer.native === false) {
    if (layer.fallback === false && layer.source) return 'native-failed';
    const fallback = String(layer.fallback || layer.materialized_from || 'unknown');
    if (fallback.startsWith('sdk_proxy')) return 'native:sdk-proxy';
    return `fallback:${fallback}`;
  }
  return layer;
}

function sourceCommitmentAlg(signatureInput: string) {
  const match = signatureInput.match(/alg="(lbry-[^"]+)"/);
  return match?.[1];
}

function nativeResponseDevice(device: string | null) {
  return device?.startsWith('lbry-') ? device : undefined;
}

function previewBody(text: string) {
  if (!text) return text;

  try {
    return JSON.parse(text);
  } catch {
    return text.length > 1200 ? `${text.slice(0, 1200)}...` : text;
  }
}

function devicePath(url: string) {
  return sanitizePath(url);
}

function hyperbeamDevice(url: string) {
  try {
    const firstPathPart = new URL(url).pathname.split('/').find(Boolean);
    return firstPathPart?.startsWith('~') ? firstPathPart : undefined;
  } catch {
    return undefined;
  }
}

function hyperbeamDeviceLayer(url: string) {
  const device = hyperbeamDevice(url);
  if (!device) return undefined;
  if (NATIVE_DEVICE_NAMES.has(device)) return 'native-device';
  return 'compat-device';
}

const NATIVE_DEVICE_NAMES = new Set(['~odysee@1.0']);

export function sanitizeHyperbeamDebugValue(value: any): any {
  return redactSensitive(value);
}

export function sanitizeHyperbeamDebugUrl(url: string): string {
  return sanitizeUrl(url);
}

function sanitizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${sanitizeParsedPath(parsed)}`;
  } catch {
    return sanitizeUrlLikeString(String(url || ''));
  }
}

function sanitizePath(url: string) {
  try {
    const parsed = new URL(url);
    return sanitizeParsedPath(parsed);
  } catch {
    return sanitizeUrlLikeString(String(url || ''));
  }
}

function sanitizeParsedPath(parsed: URL) {
  if (!parsed.search) return parsed.pathname;

  const params = Array.from(parsed.searchParams.entries()).map(([name, value]) => {
    if (isSensitiveQueryName(name)) return `${name}=...`;
    return `${name}=${redactQueryValue(name, value)}`;
  });
  return `${parsed.pathname}?${params.join('&')}`;
}

function sanitizeUrlLikeString(value: string) {
  return value.replace(/([?&](?:params64|urls64|auth_token|token|signature|uri64)=)[^&\s]+/gi, '$1...');
}

function isSensitiveQueryName(name: string) {
  const key = name.toLowerCase();
  return (
    key === 'params64' ||
    key === 'urls64' ||
    key === 'uri64' ||
    key.includes('auth') ||
    key.includes('token') ||
    key.includes('signature')
  );
}

function redactQueryValue(name: string, value: string) {
  return isSensitiveQueryName(name) ? '...' : encodeURIComponent(value);
}

function redactSensitive(value: any): any {
  if (value === undefined || value === null) return value;
  if (typeof value === 'string') return redactSensitiveString(value);
  if (Array.isArray(value)) return value.map((item) => redactSensitive(item));
  if (typeof value !== 'object') return value;

  const redacted: Record<string, any> = {};
  Object.entries(value).forEach(([key, child]) => {
    redacted[key] = isSensitiveFieldName(key) ? '[redacted]' : redactSensitive(child);
  });
  return redacted;
}

function isSensitiveFieldName(name: string) {
  const key = name.toLowerCase().replace(/[-_]/g, '');
  return (
    key === 'authorization' ||
    key === 'auth' ||
    key === 'authtoken' ||
    key === 'xlbryauthtoken' ||
    key.includes('auth') ||
    key.includes('token') ||
    key.includes('signature') ||
    key.includes('password')
  );
}

function redactSensitiveString(value: string) {
  return value
    .replace(/(auth[_-]?token["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, '$1[redacted]')
    .replace(/(authorization["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, '$1[redacted]')
    .replace(/(x[-_]?lbry[-_]?auth[-_]?token["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, '$1[redacted]')
    .replace(/([?&](?:params64|urls64|auth_token|token|signature|uri64)=)[^&\s]+/gi, '$1...');
}
