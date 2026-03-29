import 'scss/component/_videojs-skin.scss';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Video } from '@videojs/react/video';
import Player from './player';
import OdyseeSkin from './OdyseeSkin';
import { HLS_EVENT_LEVEL_LOADED, HLS_EVENT_MANIFEST_PARSED, loadHlsConstructor } from './hls';
import useResolvedSource from './hooks/useResolvedSource';
import useRecsys from './hooks/useRecsys';
import {
  fullscreenElement as getFullscreenElement,
  requestFullscreen,
  exitFullscreen,
  onFullscreenChange,
} from 'util/full-screen';
import useEventTracking from './hooks/useEventTracking';
import useWatchdog from './hooks/useWatchdog';
import useErrorRecovery from './hooks/useErrorRecovery';
import useLivestreamEdge from './hooks/useLivestreamEdge';
import useMediaSession from './hooks/useMediaSession';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import useVttSprite from 'effects/use-vtt-sprite';
import useAnalytics from './hooks/useAnalytics';
import useChromecast, { isCastSessionActive } from './hooks/useChromecast';
import MobileTouchOverlay from './components/MobileTouchOverlay';
import { useIsMobile } from 'effects/use-screensize';
import { platform } from 'util/platform';
import classnames from 'classnames';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import { useAppSelector } from 'redux/hooks';
import { selectClientSetting } from 'redux/selectors/settings';
import * as SETTINGS from 'constants/settings';
import { getLivestreamTurnServer } from 'constants/livestream';
import type { MediaWithHls, HlsWithP2P, P2PHlsConfig } from './types';

const IS_IOS = platform.isIOS();
const IS_MOBILE = platform.isMobile();
const P2P_DEBUG = process.env.NODE_ENV === 'development';
const P2P_LIVE_HIGH_DEMAND_WINDOW = 0; // all segments eligible for P2P (HTTP used as fallback when no peer has it)
const P2P_LIVE_SYNC_DURATION = 8; // seconds behind live edge (higher = more P2P opportunity)
const P2P_LIVE_MAX_LATENCY_DURATION = 16; // max seconds behind before seeking forward
const P2P_ACTIVITY_WINDOW_MS = 10000; // show P2P status as "active" for 10s after last transfer
const P2P_RATE_WINDOW_MS = 8000; // average throughput over 8s (covers ~2 segment cycles)
const P2P_FORCE_SEGMENT_MODE = true; // use full segments (not LL-HLS parts) for better P2P sharing

function getP2PAnnounceTrackers(trackerUrl?: string | null): string[] {
  if (!trackerUrl) return [];
  return [trackerUrl];
}

function getP2PIceServers() {
  const turnServer = getLivestreamTurnServer();
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    ...(turnServer ? [turnServer] : []),
  ];
}

function serializeP2PError(error: any) {
  if (!error) return null;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack || null,
    };
  }
  if (typeof error === 'object') {
    return {
      name: error.name || null,
      message: error.message || null,
      code: error.code || null,
      details: error.details || null,
      raw: String(error),
    };
  }
  return {
    raw: String(error),
  };
}

function shortenP2PUrl(url?: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url, window.location.href);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url.length > 120 ? `...${url.slice(-120)}` : url;
  }
}

function summarizeP2PStreams(streams: Map<any, any>) {
  return Array.from(streams.values()).map((stream: any) => ({
    type: stream?.type || 'unknown',
    index: stream?.index ?? null,
    runtimeId: shortenP2PUrl(String(stream?.runtimeId || '')),
    segments: stream?.segments?.size ?? 0,
    peers: stream?.peers?.size ?? 0,
  }));
}

function summarizeP2PSegment(details: any) {
  return {
    source: details?.downloadSource || (details?.peerId ? 'p2p' : 'http'),
    peerId: details?.peerId || null,
    bytesLength: details?.bytesLength ?? null,
    streamType: details?.streamType || null,
    segmentUrl: shortenP2PUrl(details?.segmentUrl || details?.segment?.url || null),
    externalId: details?.segment?.externalId ?? null,
    runtimeId: details?.segment?.runtimeId ? String(details.segment.runtimeId).slice(-80) : null,
  };
}

type Props = {
  claimId?: string;
  title?: string;
  channelTitle?: string;
  embedded?: boolean;
  embeddedInternal?: boolean;
  isAudio?: boolean;
  poster?: string;
  thumbnail?: string;
  shareTelemetry?: boolean;
  source?: string;
  sourceType?: string;
  startMuted?: boolean;
  userId?: string | number;
  defaultQuality?: string | null;
  onPlayerReady: (player: any, node: HTMLVideoElement) => void | (() => void);
  playNext: (options?: { manual?: boolean }) => void;
  playPrevious: () => void;
  toggleVideoTheaterMode: () => void;
  claimValues?: any;
  doAnalyticsViewForUri?: (...args: any[]) => void;
  doAnalyticsBuffer?: (...args: any[]) => void;
  claimRewards?: (...args: any[]) => void;
  uri: string;
  userClaimId?: string;
  isLivestreamClaim?: boolean;
  activeLivestreamForChannel?: any;
  isPurchasableContent?: boolean;
  isRentableContent?: boolean;
  isProtectedContent?: boolean;
  isDownloadDisabled?: boolean;
  isUnlisted?: boolean;
  doSetVideoSourceLoaded: (uri: string) => void;
  canPlayNext?: boolean;
  canPlayPrevious?: boolean;
  autoplayNext?: boolean;
  onToggleAutoplayNext?: () => void;
  floatingPlayer?: boolean;
  onToggleFloatingPlayer?: () => void;
  autoplayMedia?: boolean;
  onToggleAutoplayMedia?: () => void;
  videoTheaterMode?: boolean;
  isMarkdownOrComment?: boolean;
  isFloating?: boolean;
  doToast?: (...args: any[]) => void;
  autoPlayNextShort?: boolean;
};

function VideoJsInner(props: Props) {
  const {
    claimId,
    title,
    channelTitle,
    embedded,
    embeddedInternal,
    isAudio,
    poster,
    thumbnail,
    shareTelemetry,
    source,
    sourceType,
    startMuted,
    userId,
    defaultQuality,
    onPlayerReady,
    playNext,
    playPrevious,
    toggleVideoTheaterMode,
    claimValues,
    doAnalyticsViewForUri,
    doAnalyticsBuffer,
    claimRewards,
    uri,
    userClaimId,
    isLivestreamClaim,
    activeLivestreamForChannel,
    isPurchasableContent,
    isRentableContent,
    isProtectedContent,
    isDownloadDisabled,
    isUnlisted,
    doSetVideoSourceLoaded,
    canPlayNext,
    canPlayPrevious,
    autoplayNext,
    onToggleAutoplayNext,
    floatingPlayer,
    onToggleFloatingPlayer,
    autoplayMedia,
    onToggleAutoplayMedia,
    videoTheaterMode,
    isMarkdownOrComment,
    isFloating,
  } = props;

  const isMobile = useIsMobile();
  const p2pEnabled = useAppSelector((state) => selectClientSetting(state, SETTINGS.P2P_DELIVERY));
  const store = Player.usePlayer();
  const media = Player.useMedia() as MediaWithHls | null;
  const p2pActivityRef = useRef({
    peers: new Set<string>(),
    lastDownloadAt: 0,
    lastUploadAt: 0,
    downloadSamples: [] as Array<{ at: number; bytes: number }>,
    uploadSamples: [] as Array<{ at: number; bytes: number }>,
  });
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [tapToUnmuteVisible, setTapToUnmuteVisible] = useState(false);
  const [tapToRetryVisible, setTapToRetryVisible] = useState(false);
  const [p2pUiState, setP2PUiState] = useState({
    enabled: false,
    peerCount: 0,
    status: 'off',
    transferDirection: 'none',
    downloadRateBps: 0,
    uploadRateBps: 0,
  });
  const readyCalledRef = useRef(false);
  const [reload, setReload] = useState<string | number>('initial');

  const isLivestream = isLivestreamClaim && userClaimId;

  // Smoothed rates that decay gradually instead of jumping to 0
  const smoothedRatesRef = useRef({ download: 0, upload: 0 });
  const SMOOTH_FACTOR = 0.3; // 0 = no smoothing, 1 = instant

  const syncP2PUiState = useCallback(() => {
    const now = Date.now();
    const peerCount = p2pActivityRef.current.peers.size;
    const hasRecentDownload = now - p2pActivityRef.current.lastDownloadAt < P2P_ACTIVITY_WINDOW_MS;
    const hasRecentUpload = now - p2pActivityRef.current.lastUploadAt < P2P_ACTIVITY_WINDOW_MS;
    p2pActivityRef.current.downloadSamples = p2pActivityRef.current.downloadSamples.filter(
      (s) => now - s.at < P2P_RATE_WINDOW_MS
    );
    p2pActivityRef.current.uploadSamples = p2pActivityRef.current.uploadSamples.filter(
      (s) => now - s.at < P2P_RATE_WINDOW_MS
    );
    const downloadBytes = p2pActivityRef.current.downloadSamples.reduce((t, s) => t + s.bytes, 0);
    const uploadBytes = p2pActivityRef.current.uploadSamples.reduce((t, s) => t + s.bytes, 0);
    const rawDownload = Math.round((downloadBytes * 1000) / P2P_RATE_WINDOW_MS);
    const rawUpload = Math.round((uploadBytes * 1000) / P2P_RATE_WINDOW_MS);

    // Exponential moving average: smooth jumps but still respond to changes
    const prev = smoothedRatesRef.current;
    const downloadRateBps = Math.round(
      rawDownload > 0 ? prev.download * (1 - SMOOTH_FACTOR) + rawDownload * SMOOTH_FACTOR : prev.download * 0.85
    ); // decay slowly when no data
    const uploadRateBps = Math.round(
      rawUpload > 0 ? prev.upload * (1 - SMOOTH_FACTOR) + rawUpload * SMOOTH_FACTOR : prev.upload * 0.85
    );
    smoothedRatesRef.current = {
      download: downloadRateBps,
      upload: uploadRateBps,
    };

    const transferDirection =
      hasRecentDownload && hasRecentUpload
        ? 'both'
        : hasRecentDownload
          ? 'download'
          : hasRecentUpload
            ? 'upload'
            : 'none';

    setP2PUiState({
      enabled: Boolean(p2pEnabled && isLivestream),
      peerCount,
      status:
        !p2pEnabled || !isLivestream
          ? 'off'
          : transferDirection !== 'none'
            ? 'active'
            : peerCount > 0
              ? 'peered'
              : 'enabled',
      transferDirection,
      downloadRateBps,
      uploadRateBps,
    });
  }, [isLivestream, p2pEnabled]);

  const resolvedSource = useResolvedSource(
    source,
    sourceType,
    isLivestreamClaim,
    userClaimId,
    isProtectedContent,
    activeLivestreamForChannel,
    uri,
    doSetVideoSourceLoaded
  );

  const generatedVttUrl = useVttSprite(
    resolvedSource && !resolvedSource.thumbnailBasePath ? source : null,
    claimValues?.video?.duration,
    Boolean(resolvedSource?.thumbnailBasePath)
  );

  useEffect(() => {
    p2pActivityRef.current = {
      peers: new Set<string>(),
      lastDownloadAt: 0,
      lastUploadAt: 0,
      downloadSamples: [],
      uploadSamples: [],
    };
    syncP2PUiState();
  }, [resolvedSource?.src, p2pEnabled, isLivestream, syncP2PUiState]);

  useEffect(() => {
    const intervalId = window.setInterval(syncP2PUiState, 1000);
    return () => window.clearInterval(intervalId);
  }, [syncP2PUiState]);

  // Hooks
  useRecsys(
    claimId,
    userId !== undefined && userId !== null ? String(userId) : undefined,
    embedded || embeddedInternal,
    shareTelemetry
  );
  useEventTracking(
    claimId,
    userId,
    claimValues,
    channelTitle,
    embedded,
    uri,
    isLivestreamClaim,
    doAnalyticsViewForUri,
    doAnalyticsBuffer,
    claimRewards
  );
  useWatchdog(
    Boolean(isLivestream),
    useCallback(() => setReload(Date.now()), []),
    15000
  );
  useErrorRecovery(resolvedSource?.src, setReload, setTapToRetryVisible);
  useLivestreamEdge(Boolean(isLivestream));
  useMediaSession(claimValues, channelTitle);
  useKeyboardShortcuts({
    containerRef,
    isMobile,
    isLivestreamClaim,
    toggleVideoTheaterMode,
    playNext,
    playPrevious,
  });
  useAnalytics();
  const { castAvailable, isCasting, castState, castActions } = useChromecast();
  const castStateRef = useRef(castState);
  castStateRef.current = castState;

  const onCastToggle = useCallback(() => {
    if (isCasting) {
      const resumeTime = castStateRef.current.currentTime;
      castActions.stop();
      if (media) {
        media.currentTime = resumeTime;
        media.play();
      }
    } else {
      const cast = window.cast;
      const ctx = cast && cast.framework && cast.framework.CastContext && cast.framework.CastContext.getInstance();
      if (ctx) ctx.requestSession();
    }
  }, [isCasting, castActions, media]);

  const castLoadedSrcRef = useRef(null);
  const castSrc = resolvedSource ? resolvedSource.src : null;
  useEffect(() => {
    if (isCasting && castSrc && castSrc !== castLoadedSrcRef.current) {
      castLoadedSrcRef.current = castSrc;
      const contentType = castSrc.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4';
      const currentTime = media ? media.currentTime : 0;
      castActions.loadMedia(castSrc, title, channelTitle, poster, contentType, currentTime);
      if (media) media.pause();
    }
    if (!isCasting) {
      castLoadedSrcRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCasting, castSrc]);

  // Initial setup when media element becomes available
  useEffect(() => {
    if (!media || readyCalledRef.current) return;
    readyCalledRef.current = true;

    // Set initial state
    const state = store.state;
    if (startMuted) state.toggleMuted();

    // Call onPlayerReady with a compatible API object
    const playerApi = {
      currentTime: (val) => {
        if (val !== undefined) {
          media.currentTime = val;
          return val;
        }
        return media.currentTime;
      },
      muted: (val) => {
        if (val !== undefined) {
          if (val !== state.muted) state.toggleMuted();
          return val;
        }
        return state.muted;
      },
      volume: (val) => {
        if (val !== undefined) {
          state.setVolume(val);
          return val;
        }
        return state.volume;
      },
      playbackRate: (val) => {
        if (val !== undefined) {
          state.setPlaybackRate(val);
          return val;
        }
        return state.playbackRate;
      },
      on: (event, fn) => media.addEventListener(event, fn),
      off: (event, fn) => media.removeEventListener(event, fn),
      one: (event, fn) => media.addEventListener(event, fn, { once: true }),
      pause: () => media.pause(),
      play: () => media.play(),
      controlBar: {
        addChild: () => {},
        getChild: () => null,
        removeChild: () => {},
      },
    };

    window.player = playerApi;
    window.dispatchEvent(new CustomEvent('playerReady'));
    onPlayerReady(playerApi, media as HTMLVideoElement);
    if (window.pendingSeekTime != null) {
      media.currentTime = window.pendingSeekTime;
      delete window.pendingSeekTime;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media]);

  // Reset ready state when source changes
  useEffect(() => {
    readyCalledRef.current = false;
  }, [source, reload]);

  // Attach hls.js only for HLS sources. Use native playback for everything else (e.g. MP4).
  useEffect(() => {
    if (!media || !resolvedSource || !resolvedSource.src) return;
    const src = resolvedSource.src;
    const isHls = resolvedSource.isHls || src.includes('.m3u8') || src.includes('m3u8');
    const clearHls = () => {
      if (media._hls) {
        media._hls.destroy();
        delete media._hls;
      }
    };

    if (!isHls) {
      clearHls();
      media.src = src;
      return;
    }

    const announceTrackers = getP2PAnnounceTrackers(activeLivestreamForChannel?.p2pTrackerUrl || null);
    const swarmId = activeLivestreamForChannel?.p2pSwarmId || null;
    if (p2pEnabled && isLivestreamClaim) {
      if (P2P_DEBUG)
        console.log('[P2P] Viewer livestream source:', {
          src: shortenP2PUrl(src),
          isHls,
          preferredVideoUrl: shortenP2PUrl(activeLivestreamForChannel?.videoUrl || null),
          publicVideoUrl: shortenP2PUrl(activeLivestreamForChannel?.videoUrlPublic || null),
          trackerUrl: activeLivestreamForChannel?.p2pTrackerUrl || null,
          swarmId,
        }); // eslint-disable-line no-console
    }

    let destroyed = false;

    function createHls(HlsConstructor) {
      if (destroyed) return;
      const p2pIceServers = getP2PIceServers();
      // Remember play state so we can restore after HLS reattaches
      const wasPlaying = !media.paused;
      const hls = new HlsConstructor({
        backBufferLength: 30,
        capLevelToPlayerSize: true,
        capLevelOnFPSDrop: true,
        // P2P: disable low-latency mode (use full segments for sharing), buffer aggressively
        // Non-P2P: enable low-latency mode for LLHLS partial segments (~3-4s latency)
        ...(isLivestreamClaim
          ? p2pEnabled
            ? {
                lowLatencyMode: false,
                maxBufferLength: 20,
                maxMaxBufferLength: 30,
              }
            : {
                lowLatencyMode: true,
              }
          : undefined),
        ...(isLivestreamClaim
          ? {
              liveSyncDuration: p2pEnabled ? P2P_LIVE_SYNC_DURATION : 3,
              liveMaxLatencyDuration: p2pEnabled ? P2P_LIVE_MAX_LATENCY_DURATION : Infinity,
            }
          : undefined),
        ...(p2pEnabled && isLivestreamClaim
          ? {
              p2p: {
                core: {
                  announceTrackers,
                  highDemandTimeWindow: P2P_LIVE_HIGH_DEMAND_WINDOW,
                  simultaneousHttpDownloads: 2,
                  simultaneousP2PDownloads: 5,
                  p2pNotReadyTimeoutMs: 1500, // fallback to HTTP if P2P doesn't respond in 1.5s
                  httpNotReadyTimeoutMs: 2000, // switch to P2P if HTTP is slow
                  swarmId: swarmId || undefined,
                  rtcConfig: {
                    iceServers: p2pIceServers,
                  },
                },
              },
            }
          : undefined),
      } as P2PHlsConfig) as HlsWithP2P;

      hls.attachMedia(media);
      hls.loadSource(src);
      media._hls = hls;

      hls.on(HLS_EVENT_MANIFEST_PARSED as any, () => {
        p2pActivityRef.current.peers.clear();
        syncP2PUiState();
        if (p2pEnabled && isLivestreamClaim) {
          if (P2P_DEBUG)
            console.log('[P2P] Viewer manifest parsed:', {
              requestedUrl: shortenP2PUrl(src),
              trackers: announceTrackers,
              swarmId,
              highDemandTimeWindow: P2P_LIVE_HIGH_DEMAND_WINDOW,
              lowLatencyMode: !(p2pEnabled && isLivestreamClaim && P2P_FORCE_SEGMENT_MODE),
              liveSyncDuration: P2P_LIVE_SYNC_DURATION,
              liveMaxLatencyDuration: P2P_LIVE_MAX_LATENCY_DURATION,
              iceServers: p2pIceServers.map((server) => server.urls),
              manifestResponseUrl: shortenP2PUrl(hls.p2pEngine?.core?.manifestResponseUrl || null),
              streamSummaries: hls.p2pEngine?.core?.streams ? summarizeP2PStreams(hls.p2pEngine.core.streams) : [],
            }); // eslint-disable-line no-console
        }
      });

      hls.on(HLS_EVENT_LEVEL_LOADED as any, (_: any, data: any) => {
        if (p2pEnabled && isLivestreamClaim) {
          if (P2P_DEBUG)
            console.log('[P2P] Viewer playlist loaded:', {
              url: shortenP2PUrl(data?.details?.url || data?.url || null),
              fragments: data?.details?.fragments?.length ?? 0,
              live: Boolean(data?.details?.live),
              targetDuration: data?.details?.targetduration ?? null,
            }); // eslint-disable-line no-console
        }
      });

      // Restore play state after HLS reattaches
      if (wasPlaying) {
        hls.on(HLS_EVENT_MANIFEST_PARSED as any, () => {
          media.play().catch(() => {});
        });
      }

      // P2P diagnostics
      if (p2pEnabled && isLivestreamClaim && hls.p2pEngine) {
        console.log('[P2P] Engine active'); // eslint-disable-line no-console
        const engine = hls.p2pEngine;
        try {
          engine.addEventListener('onSegmentLoaded', (details) => {
            if (details?.downloadSource === 'p2p' || details?.peerId) {
              p2pActivityRef.current.lastDownloadAt = Date.now();
              syncP2PUiState();
            }
            if (P2P_DEBUG) console.log('[P2P] Segment:', summarizeP2PSegment(details)); // eslint-disable-line no-console
          });
          engine.addEventListener('onPeerConnect', (details) => {
            if (details?.peerId) p2pActivityRef.current.peers.add(details.peerId);
            syncP2PUiState();
            console.log('[P2P] Peer connected:', details?.peerId); // eslint-disable-line no-console
          });
          engine.addEventListener('onPeerClose', (details) => {
            if (details?.peerId) p2pActivityRef.current.peers.delete(details.peerId);
            syncP2PUiState();
            if (P2P_DEBUG) console.log('[P2P] Peer disconnected:', details?.peerId); // eslint-disable-line no-console
          });
          engine.addEventListener('onChunkDownloaded', (bytesLength, downloadSource, peerId) => {
            if (downloadSource === 'http' && !peerId) return;
            p2pActivityRef.current.lastDownloadAt = Date.now();
            p2pActivityRef.current.downloadSamples.push({
              at: Date.now(),
              bytes: bytesLength || 0,
            });
            syncP2PUiState();
          });
          engine.addEventListener('onChunkUploaded', (bytesLength, peerId) => {
            p2pActivityRef.current.lastUploadAt = Date.now();
            p2pActivityRef.current.uploadSamples.push({
              at: Date.now(),
              bytes: bytesLength || 0,
            });
            syncP2PUiState();
          });
          if (P2P_DEBUG) {
            engine.addEventListener('onSegmentError', (details) => {
              console.warn('[P2P] Segment error:', details?.error?.message || details); // eslint-disable-line no-console
            });
            engine.addEventListener('onTrackerError', (details) => {
              console.warn('[P2P] Tracker error:', details?.error?.message || details); // eslint-disable-line no-console
            });
          }
        } catch {} // eslint-disable-line no-empty
      } else if (p2pEnabled && isLivestreamClaim) {
        console.warn('[P2P] p2pEngine not found - mixin may have failed'); // eslint-disable-line no-console
      }
    }

    loadHlsConstructor()
      .then((HlsConstructor) => {
        if (destroyed) return;

        if (!HlsConstructor?.isSupported?.()) {
          clearHls();
          media.src = src;
          return;
        }

        if (p2pEnabled && isLivestreamClaim) {
          import('p2p-media-loader-hlsjs')
            .then(({ HlsJsP2PEngine }) => {
              if (destroyed) return;
              // injectMixin RETURNS a new class that extends Hls with P2P support
              const HlsWithP2P = HlsJsP2PEngine.injectMixin(HlsConstructor);
              console.log('[P2P] P2P delivery enabled'); // eslint-disable-line no-console
              createHls(HlsWithP2P);
            })
            .catch((e) => {
              console.warn('[P2P] Failed to load p2p-media-loader, falling back to standard HLS:', e); // eslint-disable-line no-console
              createHls(HlsConstructor);
            });
        } else {
          createHls(HlsConstructor);
        }
      })
      .catch((error) => {
        console.warn('[Video] Failed to load hls.js, falling back to native playback:', error); // eslint-disable-line no-console
        clearHls();
        media.src = src;
      });

    return () => {
      destroyed = true;
      clearHls();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, resolvedSource?.src]);

  // Auto-play on source load
  useEffect(() => {
    if (!media || !resolvedSource) return;
    if (isCastSessionActive()) return;

    const docEl = document.documentElement;
    const attemptPlay = () => {
      const playPromise = media.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (docEl) docEl.removeAttribute('data-shorts-transitioning');
          })
          .catch((error) => {
            if (docEl) docEl.removeAttribute('data-shorts-transitioning');
            if (error.name === 'NotAllowedError') {
              if (IS_IOS) {
                media.muted = true;
                const mutedPromise = media.play();
                if (mutedPromise !== undefined) {
                  mutedPromise.then(() => setTapToUnmuteVisible(true)).catch(() => {});
                }
              }
            }
          });
      }
    };

    const hls = media._hls;
    if (hls) {
      const onReady = () => {
        hls.off(HLS_EVENT_MANIFEST_PARSED as any, onReady);
        media.removeEventListener('canplay', onReady);
        attemptPlay();
      };
      hls.on(HLS_EVENT_MANIFEST_PARSED as any, onReady);
      media.addEventListener('canplay', onReady, { once: true });
    } else {
      attemptPlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, resolvedSource?.src]);

  // Inject generated VTT sprite for non-HLS videos
  useEffect(() => {
    if (!media || !generatedVttUrl || IS_MOBILE) return;
    const track = document.createElement('track');
    track.kind = 'metadata';
    track.label = 'thumbnails';
    track.default = true;
    track.src = generatedVttUrl;
    media.appendChild(track);
    return () => {
      if (track.parentNode) track.parentNode.removeChild(track);
    };
  }, [media, generatedVttUrl]);

  // Enable metadata tracks (thumbnails) - plain Video doesn't do this automatically
  useEffect(() => {
    if (!media) return;
    const enableTracks = () => {
      for (let i = 0; i < media.textTracks.length; i++) {
        const track = media.textTracks[i];
        if (track.kind === 'metadata' && track.mode === 'disabled') {
          track.mode = 'hidden';
        }
      }
    };
    enableTracks();
    media.textTracks.addEventListener('addtrack', enableTracks);
    return () => media.textTracks.removeEventListener('addtrack', enableTracks);
  }, [media]);

  useEffect(() => {
    let videoHoverForwarder = null;
    const handleFullscreenChange = () => {
      const fsTarget = document.querySelector('.player-fullscreen-target');

      if (fsTarget && getFullscreenElement() === fsTarget) {
        videoHoverForwarder = (e) => {
          if (e.target && e.target.closest && e.target.closest('.media-default-skin')) return;
          const skin = fsTarget.querySelector('.media-default-skin');
          if (skin) skin.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
        };
        fsTarget.addEventListener('pointermove', videoHoverForwarder);
      } else if (videoHoverForwarder && fsTarget) {
        fsTarget.removeEventListener('pointermove', videoHoverForwarder);
        videoHoverForwarder = null;
      }
    };

    onFullscreenChange(document, 'add', handleFullscreenChange);
    return () => {
      onFullscreenChange(document, 'remove', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (IS_MOBILE) return;
    const container = containerRef.current;
    if (!container) return;

    const handleDblClick = (e) => {
      if (e.target instanceof Element && e.target.closest('.media-controls')) return;
      const fsEl = getFullscreenElement();
      if (fsEl) {
        exitFullscreen();
      } else {
        const target = container.closest('.player-fullscreen-target');
        if (target) requestFullscreen(target);
      }
    };

    container.addEventListener('dblclick', handleDblClick);
    return () => container.removeEventListener('dblclick', handleDblClick);
  }, []);

  // Disable context menu for protected content
  useEffect(() => {
    if (!media) return;
    if (isPurchasableContent || isRentableContent || isProtectedContent || isUnlisted || isDownloadDisabled) {
      media.setAttribute('oncontextmenu', 'return false;');
    }
  }, [media, isPurchasableContent, isRentableContent, isProtectedContent, isUnlisted, isDownloadDisabled]);

  const unmuteAndHideHint = useCallback(() => {
    if (media) {
      media.muted = false;
      if (media.volume === 0) media.volume = 1.0;
    }
    setTapToUnmuteVisible(false);
  }, [media]);

  const retryVideoAfterFailure = useCallback(() => {
    setReload(Date.now());
    setTapToRetryVisible(false);
  }, []);

  return (
    <div
      className={classnames('video-js-parent', {
        'video-js-parent--ios': IS_IOS,
      })}
      ref={containerRef}
    >
      <OdyseeSkin
        isLivestream={Boolean(isLivestream)}
        isMarkdownOrComment={isMarkdownOrComment}
        onToggleTheaterMode={toggleVideoTheaterMode}
        videoTheaterMode={videoTheaterMode}
        onToggleAutoplayNext={onToggleAutoplayNext}
        autoplayNext={autoplayNext}
        floatingPlayer={floatingPlayer}
        onToggleFloatingPlayer={onToggleFloatingPlayer}
        autoplayMedia={autoplayMedia}
        onToggleAutoplayMedia={onToggleAutoplayMedia}
        onPlayNext={playNext}
        onPlayPrevious={playPrevious}
        canPlayNext={canPlayNext}
        canPlayPrevious={canPlayPrevious}
        defaultQuality={defaultQuality}
        originalVideoWidth={claimValues?.video?.width}
        originalVideoHeight={claimValues?.video?.height}
        title={title}
        description={claimValues?.description}
        isFloating={isFloating}
        embedded={embedded}
        uri={uri}
        castAvailable={castAvailable}
        isCasting={isCasting}
        onCastToggle={onCastToggle}
        castState={castState}
        castActions={castActions}
        p2pUiState={p2pUiState}
      >
        {isCasting && thumbnail && <img src={thumbnail} className="odysee-cast-thumbnail" alt="" />}

        {resolvedSource && (
          <Video
            ref={videoRef}
            src={resolvedSource.src}
            poster={isAudio ? poster : ''}
            playsInline
            crossOrigin="anonymous"
            className={classnames({ livestreamPlayer: isLivestream })}
          >
            {resolvedSource.thumbnailBasePath && !IS_MOBILE && (
              <track
                kind="metadata"
                label="thumbnails"
                default
                src={resolvedSource.thumbnailBasePath + '/stream_sprite.vtt'}
              />
            )}
          </Video>
        )}

        {IS_MOBILE && !embedded && (
          <MobileTouchOverlay
            onPlayNext={playNext}
            onPlayPrevious={playPrevious}
            canPlayNext={canPlayNext}
            canPlayPrevious={canPlayPrevious}
            isCasting={isCasting}
            castState={castState}
            castActions={castActions}
          />
        )}
      </OdyseeSkin>

      {tapToUnmuteVisible && (
        <Button
          label={__('Tap to unmute')}
          button="link"
          icon={ICONS.VOLUME_MUTED}
          className="video-js--tap-to-unmute"
          onClick={unmuteAndHideHint}
        />
      )}
      {tapToRetryVisible && (
        <Button
          label={__('Retry')}
          button="link"
          icon={ICONS.REFRESH}
          className="video-js--tap-to-unmute"
          onClick={retryVideoAfterFailure}
        />
      )}
    </div>
  );
}

export default React.memo(function VideoJs(props: Props) {
  return (
    <Player.Provider>
      <VideoJsInner {...props} />
    </Player.Provider>
  );
});
