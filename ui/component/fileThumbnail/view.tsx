import { THUMBNAIL_QUALITY, MISSING_THUMB_DEFAULT } from 'config';
import { getImageProxyUrl, getThumbnailCdnUrl } from 'util/thumbnail';
import React from 'react';
import useLiveThumbnailFrame from 'effects/use-live-thumbnail-frame';
import useVideoPreviewOnHover from 'effects/use-video-preview-on-hover';
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
  const videoDuration = (claim?.value as any)?.video?.duration || 0;
  const canPreviewOnHover = hoverPreview && isVideoContent && !isActiveLivestream && !liveThumbnail && videoDuration > 3;

  const [isHovering, setIsHovering] = React.useState(false);
  const liveFrameUrl = useLiveThumbnailFrame(liveThumbnail, Boolean(isHovering && liveThumbnail));
  const vodPreviewFrame = useVideoPreviewOnHover(
    canPreviewOnHover ? streamingUrl : null,
    videoDuration,
    isHovering && canPreviewOnHover
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

  const hoverHandlers = liveThumbnail || canPreviewOnHover
    ? {
        onMouseEnter: () => setIsHovering(true),
        onMouseLeave: () => setIsHovering(false),
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

  // VOD hover preview frame overrides thumbnail while hovering
  if (vodPreviewFrame && isHovering) {
    url = vodPreviewFrame;
  }

  const thumbnailUrl = url && url.replace(/'/g, "\\'");
  const isPreviewActive = Boolean(vodPreviewFrame && isHovering);

  if (!gettingThumbnail) {
    return (
      <Thumb
        small={small}
        thumb={thumbnailUrl || MISSING_THUMB_DEFAULT}
        fallback={FALLBACK}
        className={classnames(className, {
          'media__thumb--live': Boolean(liveThumbnail),
          'media__thumb--preview-active': isPreviewActive,
          'media__thumb--live-refreshing': isLiveRefreshing,
        })}
        forceReload={forceReload}
        enableLiveCrossfade={enableLiveCrossfade}
        isLiveRefreshing={isLiveRefreshing}
        hoverHandlers={hoverHandlers}
      >
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
