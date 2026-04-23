import { THUMBNAIL_QUALITY, MISSING_THUMB_DEFAULT } from 'config';
import { getImageProxyUrl, getThumbnailCdnUrl } from 'util/thumbnail';
import React from 'react';
import useLiveThumbnailFrame from 'effects/use-live-thumbnail-frame';
import useVideoPreviewOnHover from 'effects/use-video-preview-on-hover';
import useHlsVideoPreview from 'effects/use-hls-video-preview';
import FreezeframeWrapper from 'component/common/freezeframe-wrapper';
import * as ICONS from 'constants/icons';
import { icons } from 'component/common/icon-custom';
import classnames from 'classnames';
import Thumb from './internal/thumb';
import PreviewOverlayProtectedContent from '../previewOverlayProtectedContent';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectHasResolvedClaimForUri, selectThumbnailForUri, selectClaimForUri } from 'redux/selectors/claims';
import { selectIsActiveLivestreamForUri, selectLiveThumbnailForUri } from 'redux/selectors/livestream';
import { selectStreamingUrlForUri } from 'redux/selectors/file_info';
import { doAnalyticsViewForUri } from 'redux/actions/app';
import { selectUser } from 'redux/selectors/user';
import analytics from 'analytics';

const previewViewedUris = new Set<string>();

function parseVttTime(str: string): number {
  const parts = str.split(':');
  if (parts.length === 3) return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  if (parts.length === 2) return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  return parseFloat(parts[0]);
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const FALLBACK = MISSING_THUMB_DEFAULT
  ? getThumbnailCdnUrl({
      thumbnail: MISSING_THUMB_DEFAULT,
    })
  : undefined;

function isMissingThumbLike(url: string | null | undefined) {
  if (!url) return false;
  const normalized = url.toLowerCase();
  return normalized.includes('missing-thumb-png') || normalized.includes('missing-thumb');
}

type Props = {
  uri?: string;
  secondaryUri?: string;
  thumbnail?: string | null | undefined;
  children?: React.ReactNode;
  allowGifs?: boolean;
  claim?: StreamClaim | null | undefined;
  className?: string;
  small?: boolean;
  forceReload?: boolean;
  isShort?: boolean;
  tileLayout?: boolean;
  hoverPreview?: boolean;
  externalHover?: boolean;
};

function FileThumbnail(props: Props) {
  const {
    uri,
    secondaryUri,
    thumbnail: rawThumbnail,
    children,
    allowGifs = false,
    className,
    small,
    forceReload,
    isShort = false,
    hoverPreview = false,
    externalHover,
  } = props;

  const hasResolvedClaim = useAppSelector((state) => (uri ? selectHasResolvedClaimForUri(state, uri) : undefined));
  const thumbnailFromClaim = useAppSelector((state) => selectThumbnailForUri(state, uri)) as string | null | undefined;
  const thumbnailFromSecondaryClaim = useAppSelector((state) =>
    secondaryUri ? selectThumbnailForUri(state, secondaryUri) : undefined
  ) as string | null | undefined;
  const isActiveLivestream = useAppSelector((state) => (uri ? selectIsActiveLivestreamForUri(state, uri) : false));
  const liveThumbnailFromStore = useAppSelector((state) => (uri ? selectLiveThumbnailForUri(state, uri) : null));
  const liveThumbnail = isMissingThumbLike(liveThumbnailFromStore) ? null : liveThumbnailFromStore;

  const passedThumbnail = rawThumbnail && rawThumbnail.trim().replace(/^http:\/\//i, 'https://');
  const preferredClaimThumbnail = isActiveLivestream && isMissingThumbLike(passedThumbnail) ? null : passedThumbnail;
  const preferredResolvedThumbnail =
    isActiveLivestream && isMissingThumbLike(thumbnailFromClaim) ? null : thumbnailFromClaim;
  const preferredSecondaryThumbnail =
    isActiveLivestream && isMissingThumbLike(thumbnailFromSecondaryClaim) ? null : thumbnailFromSecondaryClaim;
  const thumbnail =
    liveThumbnail ||
    preferredClaimThumbnail ||
    (preferredResolvedThumbnail === null && secondaryUri ? preferredSecondaryThumbnail : preferredResolvedThumbnail);

  const shownThumbnailRef = React.useRef<string | null>(null);
  if (thumbnail) shownThumbnailRef.current = thumbnail;

  const gettingThumbnail =
    !shownThumbnailRef.current &&
    preferredClaimThumbnail === undefined &&
    (preferredResolvedThumbnail === null ||
      (!thumbnail && !hasResolvedClaim) ||
      (isActiveLivestream && !liveThumbnail));
  const isGif = thumbnail && thumbnail.endsWith('gif');

  // VOD hover preview: get streaming URL and duration for non-livestream video content
  const claim = useAppSelector((state) => (uri ? selectClaimForUri(state, uri) : undefined));
  const streamingUrl = useAppSelector((state) => (uri ? selectStreamingUrlForUri(state, uri) : undefined));
  const isVideoContent = Boolean(claim?.value?.video || claim?.value?.source?.media_type?.startsWith('video'));
  const videoDuration = claim?.value?.video?.duration || 0;
  const canPreviewOnHover =
    hoverPreview && isVideoContent && !isActiveLivestream && !liveThumbnail && videoDuration > 3;

  const [isHoveringLocal, setIsHoveringLocal] = React.useState(false);
  const isHovering = externalHover !== undefined ? externalHover : isHoveringLocal;

  const {
    videoRef: hlsVideoRef,
    isReady: hlsPreviewReady,
    isHlsAvailable,
    progress: hlsProgress,
    thumbnailBasePath,
  } = useHlsVideoPreview(
    canPreviewOnHover ? streamingUrl || null : null,
    canPreviewOnHover ? uri : undefined,
    isHovering && canPreviewOnHover
  );

  const shouldUseFallbackFrames = canPreviewOnHover && isHlsAvailable === false;

  const liveFrameUrl = useLiveThumbnailFrame(liveThumbnail, Boolean(isHovering && liveThumbnail));
  const vodPreview = useVideoPreviewOnHover(
    shouldUseFallbackFrames ? streamingUrl || null : null,
    shouldUseFallbackFrames ? uri : undefined,
    videoDuration,
    isHovering && shouldUseFallbackFrames
  );
  const [loadedLiveUrl, setLoadedLiveUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!liveFrameUrl) return;
    let canceled = false;
    const img = new Image();
    const handleLoad = () => {
      if (!canceled) setLoadedLiveUrl(liveFrameUrl);
    };
    const handleError = () => {
      if (!canceled) setLoadedLiveUrl((prev) => prev);
    };
    img.addEventListener('load', handleLoad, { once: true });
    img.addEventListener('error', handleError, { once: true });
    img.src = liveFrameUrl;

    return () => {
      canceled = true;
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [liveFrameUrl]);
  const enableLiveCrossfade = Boolean(isHovering && liveThumbnail && loadedLiveUrl);
  const isLiveRefreshing = Boolean(liveThumbnail && isHovering && loadedLiveUrl);

  const [isMuted, setIsMuted] = React.useState(() => (window as any).__previewMuted !== false);

  React.useEffect(() => {
    const onSync = () => setIsMuted((window as any).__previewMuted !== false);
    window.addEventListener('__previewMuteChanged', onSync);
    return () => window.removeEventListener('__previewMuteChanged', onSync);
  }, []);

  React.useEffect(() => {
    const video = hlsVideoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

  const [hoverFrac, setHoverFrac] = React.useState(0);
  const [thumbWidth, setThumbWidth] = React.useState(320);
  const [thumbHeight, setThumbHeight] = React.useState(180);
  const thumbMeasureRef = React.useCallback((el: HTMLElement | null) => {
    if (el) {
      setThumbWidth(el.clientWidth);
      const thumb = el.closest('.media__thumb');
      if (thumb) setThumbHeight(thumb.clientHeight);
    }
  }, []);

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoverFrac(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  }, []);

  const vttCues = React.useRef<Array<{
    start: number;
    end: number;
    url: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }> | null>(null);
  const [vttLoaded, setVttLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!thumbnailBasePath) return;
    let canceled = false;
    const vttUrl = thumbnailBasePath + '/stream_sprite.vtt';
    const basePath = thumbnailBasePath + '/';
    fetch(vttUrl)
      .then((r) => r.text())
      .then((text) => {
        if (canceled) return;
        const cues: typeof vttCues.current = [];
        const blocks = text.split(/\n\n+/);
        for (const block of blocks) {
          const lines = block.trim().split('\n');
          const timeLine = lines.find((l) => l.includes('-->'));
          const urlLine = lines.find((l) => l.includes('#xywh='));
          if (!timeLine || !urlLine) continue;
          const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
          const start = parseVttTime(startStr);
          const end = parseVttTime(endStr);
          const hashIdx = urlLine.indexOf('#xywh=');
          let spriteUrl = urlLine.substring(0, hashIdx).trim();
          if (spriteUrl.startsWith('./')) spriteUrl = basePath + spriteUrl.slice(2);
          else if (!spriteUrl.startsWith('http')) spriteUrl = basePath + spriteUrl;
          const [x, y, w, h] = urlLine
            .substring(hashIdx + 6)
            .split(',')
            .map(Number);
          cues.push({ start, end, url: spriteUrl, x, y, w, h });
        }
        vttCues.current = cues;
        setVttLoaded(true);
      })
      .catch(() => {});
    return () => {
      canceled = true;
    };
  }, [thumbnailBasePath]);

  const hoverTime = hoverFrac * videoDuration;
  const activeCue =
    vttLoaded && vttCues.current
      ? vttCues.current.find((c) => hoverTime >= c.start && hoverTime < c.end) || null
      : null;

  const hoverHandlers =
    externalHover === undefined && (liveThumbnail || canPreviewOnHover)
      ? {
          onMouseEnter: () => setIsHoveringLocal(true),
          onMouseLeave: () => {
            setIsHoveringLocal(false);
            setHoverFrac(0);
            (window as any).__previewCurrentTime = null;
          },
        }
      : {};

  if (!allowGifs && isGif) {
    const url = getImageProxyUrl(thumbnail);
    return (
      url && (
        <FreezeframeWrapper
          isShort={isShort}
          small={small}
          src={url}
          className={classnames('media__thumb', className, {
            'media__thumb--resolving': !hasResolvedClaim,
            'media__thumb--small': small,
          })}
        >
          <PreviewOverlayProtectedContent uri={uri} />
          {children}
        </FreezeframeWrapper>
      )
    );
  }

  let url = thumbnail || shownThumbnailRef.current;

  // Skip CDN proxy for live thumbnails (served directly from livestream CDN)
  if (url && !liveThumbnail) {
    if (isGif) {
      url = getImageProxyUrl(thumbnail);
    } else {
      url = getThumbnailCdnUrl({
        thumbnail,
        quality: THUMBNAIL_QUALITY,
        isShorts: isShort,
      });
    }
  }

  // Use preloaded live frame URL when available.
  if (loadedLiveUrl) {
    url = loadedLiveUrl;
  }

  const thumbnailUrl = url && url.replace(/'/g, "\\'");
  const hlsPreviewActive = Boolean(hlsPreviewReady && isHovering && canPreviewOnHover);

  React.useEffect(() => {
    if (hlsPreviewActive) {
      const video = hlsVideoRef.current;
      (window as any).__previewCurrentTime = null;
      const timer = setTimeout(() => {
        const update = () => {
          if (video) (window as any).__previewCurrentTime = Math.floor(video.currentTime);
        };
        video?.addEventListener('timeupdate', update);
        (video as any).__updateHandler = update;
      }, 5000);
      return () => {
        clearTimeout(timer);
        const handler = (video as any)?.__updateHandler;
        if (handler) video?.removeEventListener('timeupdate', handler);
        (window as any).__previewCurrentTime = null;
      };
    } else {
      (window as any).__previewCurrentTime = null;
    }
  }, [hlsPreviewActive]);

  const hasFrames = Boolean(vodPreview.current);
  const framePreviewActive = Boolean(hasFrames && isHovering);

  const [framesFadedIn, setFramesFadedIn] = React.useState(false);
  React.useEffect(() => {
    if (!hasFrames) {
      setFramesFadedIn(false);
      return;
    }
    if (framePreviewActive && !framesFadedIn) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFramesFadedIn(true);
        });
      });
    } else if (!framePreviewActive) {
      setFramesFadedIn(false);
    }
  }, [hasFrames, framePreviewActive, framesFadedIn]);

  const isPreviewActive = hlsPreviewActive || (framePreviewActive && framesFadedIn);

  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => selectUser(state))?.id;
  const claimId = claim?.claim_id;

  React.useEffect(() => {
    if (!isPreviewActive || !uri || !claimId || previewViewedUris.has(uri)) return;
    const timer = setTimeout(() => {
      if (previewViewedUris.has(uri)) return;
      previewViewedUris.add(uri);
      dispatch(doAnalyticsViewForUri(uri, true));
      const video = hlsVideoRef.current;
      if (video) {
        const playerShim = {
          currentSource: () => ({
            type: video.currentSrc?.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4',
            src: video.currentSrc,
          }),
          get currentTime() {
            return video.currentTime;
          },
          get duration() {
            return video.duration;
          },
          get seeking() {
            return video.seeking;
          },
        };
        analytics.video.videoStartEvent(claimId, 0, 'player-v10', userId, uri, playerShim, undefined, false, true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isPreviewActive, uri, claimId]);

  if (!gettingThumbnail) {
    return (
      <Thumb
        small={small}
        thumb={thumbnailUrl || MISSING_THUMB_DEFAULT}
        fallback={FALLBACK}
        className={classnames(className, {
          'media__thumb--live': Boolean(liveThumbnail),
          'media__thumb--has-preview': canPreviewOnHover,
          'media__thumb--preview-active': isPreviewActive,
          'media__thumb--live-refreshing': isLiveRefreshing,
        })}
        forceReload={forceReload}
        enableLiveCrossfade={enableLiveCrossfade}
        isLiveRefreshing={isLiveRefreshing}
        hoverHandlers={hoverHandlers}
      >
        {canPreviewOnHover && (
          <div
            className={classnames('media__thumb-video-wrap', {
              'media__thumb-video-wrap--active': hlsPreviewActive,
            })}
            style={{ pointerEvents: 'none' }}
          >
            <video
              ref={hlsVideoRef}
              disablePictureInPicture
              className={classnames('media__thumb-video-preview', {
                'media__thumb-video-preview--portrait': isShort,
              })}
              muted={isMuted}
              playsInline
            />
          </div>
        )}
        {hlsPreviewActive && (
          <button
            className="media__thumb-mute-btn"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMuted((m) => {
                const next = !m;
                (window as any).__previewMuted = next;
                window.dispatchEvent(new Event('__previewMuteChanged'));
                return next;
              });
            }}
          >
            {isMuted ? (
              React.createElement(icons[ICONS.VOLUME_MUTED], { size: 18, color: 'currentColor' })
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} fill="none" viewBox="0 0 18 18">
                <path
                  fill="currentColor"
                  d="M15.6 3.3c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4C15.4 5.9 16 7.4 16 9s-.6 3.1-1.8 4.3c-.4.4-.4 1 0 1.4.2.2.5.3.7.3.3 0 .5-.1.7-.3C17.1 13.2 18 11.2 18 9s-.9-4.2-2.4-5.7"
                />
                <path
                  fill="currentColor"
                  d="M.714 6.008h3.072l4.071-3.857c.5-.376 1.143 0 1.143.601V15.28c0 .602-.643.903-1.143.602l-4.071-3.858H.714c-.428 0-.714-.3-.714-.752V6.76c0-.451.286-.752.714-.752m10.568.59a.91.91 0 0 1 0-1.316.91.91 0 0 1 1.316 0c1.203 1.203 1.47 2.216 1.522 3.208q.012.255.011.51c0 1.16-.358 2.733-1.533 3.803a.7.7 0 0 1-.298.156c-.382.106-.873-.011-1.018-.156a.91.91 0 0 1 0-1.316c.57-.57.995-1.551.995-2.487 0-.944-.26-1.667-.995-2.402"
                />
              </svg>
            )}
          </button>
        )}
        {hasFrames && (
          <div
            className={classnames('media__thumb-frame-crossfade', {
              'media__thumb-frame-crossfade--active': framesFadedIn && isHovering,
              'media__thumb-frame-crossfade--portrait': isShort,
            })}
          >
            <img
              src={vodPreview.previous || vodPreview.current}
              className="media__thumb-frame-preview"
              alt=""
              draggable={false}
            />
            <img
              key={vodPreview.frameIndex}
              src={vodPreview.current}
              className="media__thumb-frame-preview media__thumb-frame-preview--front"
              alt=""
              draggable={false}
            />
          </div>
        )}
        {hlsPreviewActive &&
          (() => {
            const pct = hlsProgress * 100;
            return (
              <div
                ref={thumbMeasureRef}
                className="media__thumb-progress-wrap"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverFrac(0)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  const video = hlsVideoRef.current;
                  if (video && video.duration && isFinite(video.duration)) {
                    video.currentTime = frac * video.duration;
                  }
                }}
              >
                {hoverFrac > 0 && (
                  <div
                    className="media__thumb-progress-tooltip"
                    style={{
                      left: (() => {
                        const vttZoom = activeCue
                          ? activeCue.h > activeCue.w
                            ? Math.min(1, Math.max(90, Math.min(thumbHeight * 0.3, 120)) / activeCue.h)
                            : Math.min(1, (thumbWidth * 0.55) / activeCue.w)
                          : 1;
                        const halfW = activeCue ? Math.round((activeCue.w * vttZoom) / 2) + 6 : 86;
                        return `clamp(${halfW}px, ${hoverFrac * 100}%, calc(100% - ${halfW}px))`;
                      })(),
                    }}
                  >
                    {activeCue &&
                      (() => {
                        const isPortrait = activeCue.h > activeCue.w;
                        const portraitMaxH = Math.max(90, Math.min(thumbHeight * 0.3, 120));
                        const portraitScale = isPortrait && activeCue.h > portraitMaxH ? portraitMaxH / activeCue.h : 1;
                        const vttScale = Math.min(1, (thumbWidth * 0.55) / activeCue.w);
                        const scale = isPortrait ? portraitScale : vttScale;
                        return (
                          <div
                            className="media__thumb-progress-tooltip-sprite"
                            style={isPortrait ? { aspectRatio: 'auto', minWidth: 0, minHeight: 0 } : undefined}
                          >
                            <div
                              className="media__thumb-progress-tooltip-sprite-inner"
                              style={{
                                width: activeCue.w,
                                height: activeCue.h,
                                backgroundImage: `url(${activeCue.url})`,
                                backgroundPosition: `-${activeCue.x}px -${activeCue.y}px`,
                                zoom: scale,
                              }}
                            />
                          </div>
                        );
                      })()}
                    <span className="media__thumb-progress-tooltip-time">{formatTime(hoverTime)}</span>
                  </div>
                )}
                <div className="media__thumb-progress">
                  <div className="media__thumb-progress-hover" style={{ width: `${hoverFrac * 100}%` }} />
                  <div className="media__thumb-progress-bar" style={{ width: `${pct}%` }} />
                  <div className="media__thumb-progress-dot" style={{ left: `${pct}%` }} />
                </div>
              </div>
            );
          })()}
        {framePreviewActive && framesFadedIn && (
          <div className="media__thumb-frame-counter">
            {vodPreview.frameIndex + 1}/{10}
          </div>
        )}
        <PreviewOverlayProtectedContent uri={uri} />
        {children}
      </Thumb>
    );
  }

  return (
    <div
      className={classnames('media__thumb', className, {
        'media__thumb--resolving': !hasResolvedClaim,
        'media__thumb--small': small,
      })}
    >
      {children}
    </div>
  );
}

export default React.memo(FileThumbnail);
