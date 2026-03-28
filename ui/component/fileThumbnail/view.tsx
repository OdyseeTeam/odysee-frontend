import { THUMBNAIL_QUALITY, MISSING_THUMB_DEFAULT } from 'config';
import { getImageProxyUrl, getThumbnailCdnUrl } from 'util/thumbnail';
import React from 'react';
import useLiveThumbnailFrame from 'effects/use-live-thumbnail-frame';
import useVideoPreviewOnHover from 'effects/use-video-preview-on-hover';
import useHlsVideoPreview from 'effects/use-hls-video-preview';
import FreezeframeWrapper from 'component/common/freezeframe-wrapper';
import classnames from 'classnames';
import Thumb from './internal/thumb';
import PreviewOverlayProtectedContent from '../previewOverlayProtectedContent';
import { useAppSelector } from 'redux/hooks';
import { selectHasResolvedClaimForUri, selectThumbnailForUri, selectClaimForUri } from 'redux/selectors/claims';
import { selectIsActiveLivestreamForUri, selectLiveThumbnailForUri } from 'redux/selectors/livestream';
import { selectStreamingUrlForUri } from 'redux/selectors/file_info';

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

  const { videoRef: hlsVideoRef, isReady: hlsPreviewReady, isHlsAvailable } = useHlsVideoPreview(
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

  const hoverHandlers =
    externalHover === undefined && (liveThumbnail || canPreviewOnHover)
      ? {
          onMouseEnter: () => setIsHoveringLocal(true),
          onMouseLeave: () => setIsHoveringLocal(false),
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
          <div className={classnames('media__thumb-video-wrap', {
            'media__thumb-video-wrap--active': hlsPreviewActive,
          })}>
            <video
              ref={hlsVideoRef}
              className={classnames('media__thumb-video-preview', {
                'media__thumb-video-preview--portrait': isShort,
              })}
              muted
              playsInline
            />
          </div>
        )}
        {hasFrames && (
          <div className={classnames('media__thumb-frame-crossfade', {
            'media__thumb-frame-crossfade--active': framesFadedIn && isHovering,
            'media__thumb-frame-crossfade--portrait': isShort,
          })}>
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
