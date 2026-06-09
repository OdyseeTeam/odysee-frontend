import { ODYSEE_HYPERBEAM_NODE_API } from 'config';

export type HyperbeamDebugLevel = 'info' | 'ok' | 'warn' | 'error';

export type HyperbeamDebugEvent = {
  time: string;
  label: string;
  level: HyperbeamDebugLevel;
  data?: any;
};

const EVENT_NAME = 'odysee-hyperbeam-debug';
let installed = false;

export function hyperbeamDebugColor(level: HyperbeamDebugLevel, sourceLayer?: string) {
  const source = String(sourceLayer || '');
  if (level === 'error') return '#ff4d7d';
  if (source === 'native:sdk-proxy') return '#a78bfa';
  if (source === 'native:unverified') return '#38bdf8';
  if (source === 'native:verified') return '#22c55e';
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

  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, {
      detail: {
        time: new Date().toLocaleTimeString(),
        label,
        level,
        data,
      },
    })
  );
}

export function addHyperbeamDebugListener(listener: (event: HyperbeamDebugEvent) => void) {
  const wrapped = (event: Event) => listener((event as CustomEvent<HyperbeamDebugEvent>).detail);
  window.addEventListener(EVENT_NAME, wrapped);
  return () => window.removeEventListener(EVENT_NAME, wrapped);
}

export function installHyperbeamFetchDebug() {
  if (installed || typeof window === 'undefined' || typeof fetch !== 'function') return;

  const nodeBase = String(ODYSEE_HYPERBEAM_NODE_API || '').replace(/\/+$/, '');
  if (!nodeBase) return;

  installed = true;
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    const isHyperbeam = Boolean(url && url.startsWith(nodeBase));
    const startedAt = performance.now();

    if (isHyperbeam) {
      pushHyperbeamDebug('request', requestSummary(url, input, init), 'info');
    }

    try {
      const response = await nativeFetch(input, init);
      if (!isHyperbeam) return response;

      const elapsedMs = Math.round(performance.now() - startedAt);
      const summary = await responseSummary(url, response, elapsedMs);
      pushHyperbeamDebug('response', summary, response.ok ? 'ok' : 'error');
      return response;
    } catch (error: any) {
      if (isHyperbeam) {
        pushHyperbeamDebug(
          'request failed',
          {
            url,
            method: requestMethod(input, init),
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

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit) {
  return String(init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET') || 'GET');
}

function requestSummary(url: string, input: RequestInfo | URL, init?: RequestInit) {
  return {
    method: requestMethod(input, init),
    devicePath: devicePath(url),
    url,
    bodyBytes: typeof init?.body === 'string' ? init.body.length : undefined,
  };
}

async function responseSummary(url: string, response: Response, elapsedMs: number) {
  const summary: Record<string, any> = {
    status: response.status,
    ok: response.ok,
    elapsedMs,
    devicePath: devicePath(url),
    contentType: response.headers.get('content-type'),
    contentLength: response.headers.get('content-length'),
    contentRange: response.headers.get('content-range'),
    acceptRanges: response.headers.get('accept-ranges'),
    mediaMs: response.headers.get('x-odysee-media-ms'),
    mediaBlobs: response.headers.get('x-odysee-media-blobs'),
    sourceLayer: response.headers.get('x-odysee-source-layer') || undefined,
    sourceReason: response.headers.get('x-odysee-source-reason') || undefined,
  };

  if (!response.ok || (response.headers.get('content-type') || '').includes('application/json')) {
    summary.body = await response
      .clone()
      .text()
      .then((text) => previewBody(text))
      .catch(() => null);
    summary.sourceLayer = summary.sourceLayer || sourceLayer(summary.body);
  }

  return summary;
}

function sourceLayer(body: any) {
  if (body?.reason === 'native_source_required') return 'native-missing';

  const layer =
    body?.['source-layer'] ||
    body?.['source_layer'] ||
    body?.result?.['source-layer'] ||
    body?.result?.['source_layer'] ||
    body?.body?.['source-layer'] ||
    body?.body?.['source_layer'];

  if (!layer) return undefined;
  if (layer.native === true) {
    if (layer.source === 'backend_api_proxy' || String(layer.source?.source || '').startsWith('backend_api_proxy')) {
      return 'native:sdk-proxy';
    }
    return layer.verification?.status === 'verified' ? 'native:verified' : 'native:unverified';
  }
  if (layer.native === false) {
    const fallback = String(layer.fallback || layer.materialized_from || 'unknown');
    if (fallback.startsWith('sdk_proxy')) return 'native:sdk-proxy';
    return `fallback:${fallback}`;
  }
  return layer;
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
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search ? parsed.search.slice(0, 180) : ''}`;
  } catch {
    return url;
  }
}
