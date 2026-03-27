import 'scss/component/_videojs-skin.scss';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Video } from '@videojs/react/video';
import Hls from 'hls.js';
import Player from './player';
import OdyseeSkin from './OdyseeSkin';
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

const IS_IOS = platform.isIOS();
const IS_MOBILE = platform.isMobile();
const P2P_ANNOUNCE_TRACKERS = ['wss://tracker.novage.com.ua:443', 'wss://tracker.openwebtorrent.com:443'];
const P2P_LIVE_HIGH_DEMAND_WINDOW = 3;
const P2P_LIVE_SYNC_DURATION = 12;
const P2P_LIVE_MAX_LATENCY_DURATION = 24;

function getP2PAnnounceTrackers(trackerUrl?: string | null) {
  return trackerUrl ? [trackerUrl] : P2P_ANNOUNCE_TRACKERS;
}

function getP2PIceServers() {
  const turnServer = getLivestreamTurnServer();
  return [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }, ...(turnServer ? [turnServer] : [])];
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

function VideoJsInner(props) {
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
  const media = Player.useMedia();
  const connectedPeersRef = useRef<Set<string>>(new Set());
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [tapToUnmuteVisible, setTapToUnmuteVisible] = useState(false);
  const [tapToRetryVisible, setTapToRetryVisible] = useState(false);
  const readyCalledRef = useRef(false);
  const [reload, setReload] = useState('initial');

  const isLivestream = isLivestreamClaim && userClaimId;

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

  // Hooks
  useRecsys(claimId, userId, embedded || embeddedInternal, shareTelemetry);
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
      controlBar: { addChild: () => {}, getChild: () => null, removeChild: () => {} },
    };

    window.player = playerApi;
    window.dispatchEvent(new CustomEvent('playerReady'));
    onPlayerReady(playerApi, media);
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

  // Attach hls.js for HLS sources (or try HLS for any video source, falling back to native)
  useEffect(() => {
    if (!media || !resolvedSource || !resolvedSource.src) return;
    if (!Hls.isSupported()) return;
    const src = resolvedSource.src;
    const isHls = resolvedSource.isHls || src.includes('.m3u8') || src.includes('m3u8');
    const announceTrackers = getP2PAnnounceTrackers(activeLivestreamForChannel?.p2pTrackerUrl || null);
    const swarmId = activeLivestreamForChannel?.p2pSwarmId || null;
    if (p2pEnabled && isLivestreamClaim) {
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
        ...(isLivestreamClaim
          ? {
              liveSyncDuration: p2pEnabled ? P2P_LIVE_SYNC_DURATION : 4,
              liveMaxLatencyDuration: p2pEnabled ? P2P_LIVE_MAX_LATENCY_DURATION : Infinity,
            }
          : undefined),
        ...(p2pEnabled && isLivestreamClaim
          ? {
              p2p: {
                core: {
                  announceTrackers,
                  highDemandTimeWindow: P2P_LIVE_HIGH_DEMAND_WINDOW,
                  swarmId: swarmId || undefined,
                  rtcConfig: {
                    iceServers: p2pIceServers,
                  },
                },
              },
            }
          : undefined),
      });

      if (!isHls) {
        let recovered = false;
        hls.on('hlsManifestParsed', () => { recovered = true; });
        hls.on('hlsError', (_, data) => {
          if (!recovered && data.fatal) {
            hls.destroy();
            delete media._hls;
            media.src = src;
          }
        });
      }

      hls.attachMedia(media);
      hls.loadSource(src);
      media._hls = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        connectedPeersRef.current.clear();
        if (p2pEnabled && isLivestreamClaim) {
          console.log('[P2P] Viewer manifest parsed:', {
            requestedUrl: shortenP2PUrl(src),
            trackers: announceTrackers,
            swarmId,
            highDemandTimeWindow: P2P_LIVE_HIGH_DEMAND_WINDOW,
            liveSyncDuration: P2P_LIVE_SYNC_DURATION,
            liveMaxLatencyDuration: P2P_LIVE_MAX_LATENCY_DURATION,
            iceServers: p2pIceServers.map((server) => server.urls),
            manifestResponseUrl: shortenP2PUrl(hls.p2pEngine?.core?.manifestResponseUrl || null),
            streamSummaries: hls.p2pEngine?.core?.streams ? summarizeP2PStreams(hls.p2pEngine.core.streams) : [],
          }); // eslint-disable-line no-console
        }
      });

      hls.on(Hls.Events.LEVEL_LOADED, (_: any, data: any) => {
        if (p2pEnabled && isLivestreamClaim) {
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
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          media.play().catch(() => {});
        });
      }

      // P2P diagnostics
      if (p2pEnabled && isLivestreamClaim && hls.p2pEngine) {
        console.log('[P2P] Engine active:', hls.p2pEngine); // eslint-disable-line no-console
        const engine = hls.p2pEngine;
        try {
          engine.addEventListener('onSegmentStart', (details) => {
            console.log('[P2P] Segment start:', summarizeP2PSegment(details)); // eslint-disable-line no-console
          });
          engine.addEventListener('onSegmentLoaded', (details) => {
            console.log('[P2P] Segment loaded:', {
              ...summarizeP2PSegment(details),
              connectedPeers: connectedPeersRef.current.size,
              connectedPeerIds: Array.from(connectedPeersRef.current),
            }); // eslint-disable-line no-console
          });
          engine.addEventListener('onSegmentError', (details) => {
            console.warn('[P2P] Segment error:', {
              ...summarizeP2PSegment(details),
              error: details?.error?.type || details?.error?.message || details?.error || null,
            }); // eslint-disable-line no-console
          });
          engine.addEventListener('onTrackerWarning', (details) => {
            console.warn('[P2P] Tracker warning:', {
              streamType: details?.streamType || null,
              warning: serializeP2PError(details?.warning),
            }); // eslint-disable-line no-console
          });
          engine.addEventListener('onTrackerError', (details) => {
            console.warn('[P2P] Tracker error:', {
              streamType: details?.streamType || null,
              error: serializeP2PError(details?.error),
            }); // eslint-disable-line no-console
          });
          engine.addEventListener('onPeerConnect', (details) => {
            if (details?.peerId) connectedPeersRef.current.add(details.peerId);
            console.log('[P2P] Peer connected:', details); // eslint-disable-line no-console
          });
          engine.addEventListener('onPeerClose', (details) => {
            if (details?.peerId) connectedPeersRef.current.delete(details.peerId);
            console.warn('[P2P] Peer closed:', details); // eslint-disable-line no-console
          });
          engine.addEventListener('onPeerError', (details) => {
            console.warn('[P2P] Peer error:', {
              peerId: details?.peerId || null,
              error: serializeP2PError(details?.error),
            }); // eslint-disable-line no-console
          });
          engine.addEventListener('onSegmentAbort', (details) => {
            console.warn('[P2P] Segment aborted:', summarizeP2PSegment(details)); // eslint-disable-line no-console
          });
          engine.addEventListener('onChunkDownloaded', (bytesLength, downloadSource, peerId) => {
            if (downloadSource === 'http' && !peerId) return;
            console.log('[P2P] Chunk downloaded:', {
              bytesLength,
              downloadSource,
              peerId: peerId || null,
            }); // eslint-disable-line no-console
          });
          engine.addEventListener('onChunkUploaded', (bytesLength, peerId) => {
            console.log('[P2P] Chunk uploaded:', {
              bytesLength,
              peerId: peerId || null,
            }); // eslint-disable-line no-console
          });
        } catch (e) {
          console.warn('[P2P] Failed to attach event listeners:', e); // eslint-disable-line no-console
        }
        // Log peer count periodically
        const peerLogInterval = setInterval(() => {
          try {
            const core = engine.core;
            if (core && core.streams) {
              let totalPeers = 0;
              core.streams.forEach((stream) => {
                if (stream.peers) totalPeers += stream.peers.size;
              });
              console.log('[P2P] Swarm snapshot:', {
                peers: connectedPeersRef.current.size,
                trackedPeers: totalPeers,
                streams: core.streams.size,
                manifestResponseUrl: shortenP2PUrl(core.manifestResponseUrl || null),
                streamSummaries: summarizeP2PStreams(core.streams),
                connectedPeerIds: Array.from(connectedPeersRef.current),
              }); // eslint-disable-line no-console
            }
          } catch {} // eslint-disable-line no-empty
        }, 10000);
        hls.on('hlsDestroying', () => clearInterval(peerLogInterval));
      } else if (p2pEnabled && isLivestreamClaim) {
        console.warn('[P2P] p2pEngine not found on hls instance - mixin may not have worked'); // eslint-disable-line no-console
      }
    }

    if (p2pEnabled && isLivestreamClaim) {
      import('p2p-media-loader-hlsjs').then(({ HlsJsP2PEngine }) => {
        if (destroyed) return;
        // injectMixin RETURNS a new class that extends Hls with P2P support
        const HlsWithP2P = HlsJsP2PEngine.injectMixin(Hls);
        console.log('[P2P] P2P mixin injected, creating HLS instance...'); // eslint-disable-line no-console
        createHls(HlsWithP2P);
      }).catch((e) => {
        console.warn('[P2P] Failed to load p2p-media-loader, falling back to standard HLS:', e); // eslint-disable-line no-console
        createHls(Hls);
      });
    } else {
      createHls(Hls);
    }

    return () => {
      destroyed = true;
      if (media._hls) {
        media._hls.destroy();
        delete media._hls;
      }
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
        hls.off(Hls.Events.MANIFEST_PARSED, onReady);
        media.removeEventListener('canplay', onReady);
        attemptPlay();
      };
      hls.on(Hls.Events.MANIFEST_PARSED, onReady);
      media.addEventListener('canplay', onReady, { once: true });
    } else {
      attemptPlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, resolvedSource?.src]);

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
    <div className={classnames('video-js-parent', { 'video-js-parent--ios': IS_IOS })} ref={containerRef}>
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

export default React.memo(function VideoJs(props) {
  return (
    <Player.Provider>
      <VideoJsInner {...props} />
    </Player.Provider>
  );
});
