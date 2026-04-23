import React from 'react';

const LIVE_THUMB_REFRESH_MS = 400;
const LIVE_THUMB_RETRY_MS = 1200;

type Listener = (nextUrl: string) => void;

type LiveThumbnailEntry = {
  currentUrl: string | null;
  listeners: Set<Listener>;
  timer: number | null;
  loading: boolean;
};

const liveThumbnailEntries = new Map<string, LiveThumbnailEntry>();

function getCacheBustedUrl(source: string) {
  const sep = source.includes('?') ? '&' : '?';
  return `${source}${sep}t=${Date.now()}`;
}

function clearEntryTimer(entry: LiveThumbnailEntry) {
  if (entry.timer != null) {
    window.clearTimeout(entry.timer);
    entry.timer = null;
  }
}

function disposeEntry(source: string, entry: LiveThumbnailEntry) {
  clearEntryTimer(entry);
  entry.loading = false;
  if (entry.listeners.size === 0) {
    liveThumbnailEntries.delete(source);
  }
}

function scheduleNextRefresh(source: string, entry: LiveThumbnailEntry, delayMs: number) {
  clearEntryTimer(entry);
  entry.timer = window.setTimeout(() => {
    refreshLiveThumbnail(source, entry);
  }, delayMs);
}

function refreshLiveThumbnail(source: string, entry: LiveThumbnailEntry) {
  if (entry.loading || entry.listeners.size === 0) {
    if (entry.listeners.size === 0) disposeEntry(source, entry);
    return;
  }

  entry.loading = true;
  const nextUrl = getCacheBustedUrl(source);
  const img = new Image();

  const handleLoad = () => {
    const currentEntry = liveThumbnailEntries.get(source);
    if (!currentEntry || currentEntry !== entry) return;

    entry.loading = false;
    entry.currentUrl = nextUrl;
    entry.listeners.forEach((listener) => listener(nextUrl));
    scheduleNextRefresh(source, entry, LIVE_THUMB_REFRESH_MS);
  };

  const handleError = () => {
    const currentEntry = liveThumbnailEntries.get(source);
    if (!currentEntry || currentEntry !== entry) return;

    entry.loading = false;
    scheduleNextRefresh(source, entry, LIVE_THUMB_RETRY_MS);
  };

  img.addEventListener('load', handleLoad, { once: true });
  img.addEventListener('error', handleError, { once: true });
  img.src = nextUrl;
}

function subscribeToLiveThumbnail(source: string, listener: Listener) {
  let entry = liveThumbnailEntries.get(source);

  if (!entry) {
    entry = {
      currentUrl: null,
      listeners: new Set(),
      timer: null,
      loading: false,
    };
    liveThumbnailEntries.set(source, entry);
  }

  entry.listeners.add(listener);

  if (entry.currentUrl) {
    listener(entry.currentUrl);
  }

  if (!entry.loading && entry.timer == null) {
    scheduleNextRefresh(source, entry, 0);
  }

  return () => {
    const currentEntry = liveThumbnailEntries.get(source);
    if (!currentEntry) return;

    currentEntry.listeners.delete(listener);
    if (currentEntry.listeners.size === 0) {
      disposeEntry(source, currentEntry);
    }
  };
}

export default function useLiveThumbnailFrame(source: string | null | undefined, enabled: boolean) {
  const [liveFrameUrl, setLiveFrameUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!source || !enabled) return;
    return subscribeToLiveThumbnail(source, setLiveFrameUrl);
  }, [enabled, source]);

  React.useEffect(() => {
    if (!source) {
      setLiveFrameUrl(null);
    }
  }, [source]);

  return liveFrameUrl;
}
