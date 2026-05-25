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
