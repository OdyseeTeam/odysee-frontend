export const HLS_FILETYPE = 'application/x-mpegURL';

const HLS_CONTENT_TYPES = new Set(['application/x-mpegurl', 'application/vnd.apple.mpegurl']);
const MAX_RETRIES = 5;
const RETRY_DELAYS = [2000, 3000, 5000, 8000, 12000];

type ResolvedSource = {
  src: string;
  type: string | null | undefined;
  isHls: boolean;
  originalSrc: { type: string | null | undefined; src: string } | null;
  hlsSrc: { type: string; src: string } | null;
  thumbnailBasePath: string | null;
};

type ResolveSourceResult = {
  resolved: ResolvedSource | null;
  playerServer: string | null;
  errorEvent: {
    url: string;
    redirected: boolean;
    status: number;
  } | null;
  cancelled: boolean;
};

type ResolveSourceOptions = {
  source: string | null | undefined;
  sourceType?: string | null;
  userId?: string | number | null;
  isProtectedContent?: boolean;
  fetchSource?: typeof fetch;
  wait?: (duration: number) => Promise<void>;
  isCancelled?: () => boolean;
};

export function isSignedOdycdnPlaybackUrl(src: string | null | undefined): boolean {
  if (!src) return false;

  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.href : undefined;
    const url = new URL(src, baseUrl);
    const host = url.hostname.toLowerCase();

    return (
      (host === 'secure.odycdn.com' || host.endsWith('.secure.odycdn.com')) &&
      (url.searchParams.has('hash77') || /^\/[^/]+,\d+\//.test(url.pathname))
    );
  } catch {
    return false;
  }
}

export function isDirectOdycdnPlaybackUrl(src: string | null | undefined): boolean {
  if (!src) return false;

  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.href : undefined;
    const url = new URL(src, baseUrl);
    const host = url.hostname.toLowerCase();

    return host === 'player.odycdn.com' && url.pathname.startsWith('/v6/streams/');
  } catch {
    return false;
  }
}

export function isHlsManifestPlaybackUrl(src: string | null | undefined, contentType?: string | null): boolean {
  if (contentType && HLS_CONTENT_TYPES.has(contentType.toLowerCase())) return true;
  if (!src) return false;

  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.href : undefined;
    const url = new URL(src, baseUrl);
    return url.pathname.toLowerCase().endsWith('.m3u8');
  } catch {
    return src.split(/[?#]/, 1)[0].toLowerCase().endsWith('.m3u8');
  }
}

export function isHyperbeamPlaybackUrl(src: string | null | undefined): boolean {
  if (!src) return false;

  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.href : undefined;
    const url = new URL(src, baseUrl);
    return url.pathname.includes('/~lbry-stream@1.0/media') || url.pathname.includes('/~odysee-stream@1.0/media');
  } catch {
    return src.includes('~lbry-stream@1.0/media') || src.includes('~odysee-stream@1.0/media');
  }
}

export function isHlsPlaybackUrl(src: string | null | undefined): boolean {
  if (!src) return false;

  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.href : undefined;
    const url = new URL(src, baseUrl);
    return url.pathname.toLowerCase().endsWith('.m3u8') || src.toLowerCase().includes('m3u8');
  } catch {
    return src.toLowerCase().includes('m3u8');
  }
}

export function shouldSkipHeadProbeForSource(
  src: string | null | undefined,
  contentType?: string | null,
  isProtectedContent?: boolean
): boolean {
  if (!src) return false;

  const signedOdycdnSource = isSignedOdycdnPlaybackUrl(src);
  const directOdycdnSource = isDirectOdycdnPlaybackUrl(src);
  const hyperbeamSource = isHyperbeamPlaybackUrl(src);
  const hlsManifest = isHlsManifestPlaybackUrl(src, contentType);
  if (hyperbeamSource || signedOdycdnSource || directOdycdnSource) return true;
  if (isProtectedContent && hlsManifest) return true;

  return Boolean(isProtectedContent && isHlsPlaybackUrl(src));
}

export async function resolveNonLivestreamSource(options: ResolveSourceOptions): Promise<ResolveSourceResult> {
  const {
    source,
    sourceType,
    userId,
    isProtectedContent,
    fetchSource = fetch,
    wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration)),
    isCancelled = () => false,
  } = options;

  if (!source) {
    return { resolved: null, playerServer: null, errorEvent: null, cancelled: false };
  }

  if (shouldSkipHeadProbeForSource(source, sourceType, isProtectedContent)) {
    const isHls = isHlsManifestPlaybackUrl(source, sourceType) || isHlsPlaybackUrl(source);
    return {
      resolved: {
        src: source,
        type: isHls ? HLS_FILETYPE : sourceType,
        isHls,
        originalSrc: isHls ? null : { type: sourceType, src: source },
        hlsSrc: isHls ? { src: source, type: HLS_FILETYPE } : null,
        thumbnailBasePath: isHls ? source.substring(0, source.lastIndexOf('/')) : null,
      },
      playerServer: null,
      errorEvent: null,
      cancelled: false,
    };
  }

  let response;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const headers = userId !== undefined && userId !== null ? { 'X-Odysee-User-Id': String(userId) } : undefined;
    try {
      response = await fetchSource(source, {
        method: 'HEAD',
        cache: 'no-store',
        ...(headers ? { headers } : {}),
        signal: controller.signal,
      });
    } catch {
      clearTimeout(timeout);
      return {
        resolved: {
          src: source,
          type: sourceType,
          isHls: false,
          originalSrc: { type: sourceType, src: source },
          hlsSrc: null,
          thumbnailBasePath: null,
        },
        playerServer: null,
        errorEvent: null,
        cancelled: isCancelled(),
      };
    } finally {
      clearTimeout(timeout);
    }
    if (isCancelled()) return { resolved: null, playerServer: null, errorEvent: null, cancelled: true };
    if (response.status < 400 || attempt === MAX_RETRIES) break;
    await wait(RETRY_DELAYS[attempt] || 5000);
    if (isCancelled()) return { resolved: null, playerServer: null, errorEvent: null, cancelled: true };
  }

  const playerServer = response.headers.get('x-powered-by');
  const originalSrc = { type: sourceType, src: source };
  const trimmedUrl = new URL(response.url);
  trimmedUrl.hash = '';
  trimmedUrl.search = '';
  const trimmedUrlString = trimmedUrl.toString();

  let resolved = null;
  if (response.redirected && response.url && trimmedUrlString.endsWith('m3u8') && response.status < 400) {
    const hlsSrc = { type: HLS_FILETYPE, src: response.url };
    const trimmedPath = response.url.substring(0, response.url.lastIndexOf('/'));
    resolved = {
      src: response.url,
      type: HLS_FILETYPE,
      isHls: true,
      originalSrc,
      hlsSrc,
      thumbnailBasePath: trimmedPath,
    };
  } else {
    resolved = {
      src: source,
      type: sourceType,
      isHls: false,
      originalSrc,
      hlsSrc: null,
      thumbnailBasePath: null,
    };
  }

  return {
    resolved,
    playerServer,
    errorEvent:
      response.status >= 400
        ? {
            url: response.url,
            redirected: response.redirected,
            status: response.status,
          }
        : null,
    cancelled: false,
  };
}

export function getOriginalPlaybackUrl(src: string) {
  if (isSignedOdycdnPlaybackUrl(src)) {
    return src;
  }

  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.href : undefined;
    const url = new URL(src, baseUrl);
    url.searchParams.set('download', 'true');
    url.searchParams.set('magic', String(Math.round(Date.now() / 1000)));
    return url.toString();
  } catch {
    return src;
  }
}
