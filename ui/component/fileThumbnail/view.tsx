import { THUMBNAIL_QUALITY, MISSING_THUMB_DEFAULT } from 'config';
import { getImageProxyUrl, getThumbnailCdnUrl } from 'util/thumbnail';
import React from 'react';
import FreezeframeWrapper from 'component/common/freezeframe-wrapper';
import classnames from 'classnames';
import Thumb from './internal/thumb';
import PreviewOverlayProtectedContent from '../previewOverlayProtectedContent';
import { useAppSelector } from 'redux/hooks';
import { selectHasResolvedClaimForUri, selectThumbnailForUri } from 'redux/selectors/claims';
import { selectLiveThumbnailForUri } from 'redux/selectors/livestream';

const FALLBACK = MISSING_THUMB_DEFAULT
  ? getThumbnailCdnUrl({
      thumbnail: MISSING_THUMB_DEFAULT,
    })
  : undefined;

const LIVE_THUMB_REFRESH_MS = 200;

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
  } = props;

  const hasResolvedClaim = useAppSelector((state) => (uri ? selectHasResolvedClaimForUri(state, uri) : undefined));
  const thumbnailFromClaim = useAppSelector((state) => selectThumbnailForUri(state, uri));
  const thumbnailFromSecondaryClaim = useAppSelector((state) =>
    secondaryUri ? selectThumbnailForUri(state, secondaryUri) : undefined
  );
  const liveThumbnailFromStore = useAppSelector((state) => (uri ? selectLiveThumbnailForUri(state, uri) : null));
  // If the live thumbnail 404s (stream ended but state not yet updated), fall back
  const [liveThumbnailFailed, setLiveThumbnailFailed] = React.useState(false);
  React.useEffect(() => {
    if (!liveThumbnailFromStore) { setLiveThumbnailFailed(false); return; }
    const img = new Image();
    img.onload = () => setLiveThumbnailFailed(false);
    img.onerror = () => setLiveThumbnailFailed(true);
    img.src = liveThumbnailFromStore;
  }, [liveThumbnailFromStore]);
  const liveThumbnail = liveThumbnailFailed ? null : liveThumbnailFromStore;

  const passedThumbnail = rawThumbnail && rawThumbnail.trim().replace(/^http:\/\//i, 'https://');
  const thumbnail =
    liveThumbnail ||
    passedThumbnail ||
    (thumbnailFromClaim === null && secondaryUri ? thumbnailFromSecondaryClaim : thumbnailFromClaim);

  const shownThumbnailRef = React.useRef<string | null>(null);
  if (thumbnail) shownThumbnailRef.current = thumbnail;

  const gettingThumbnail =
    !shownThumbnailRef.current &&
    passedThumbnail === undefined &&
    (thumbnailFromClaim === null || (!thumbnail && !hasResolvedClaim));
  const isGif = thumbnail && thumbnail.endsWith('gif');

  // ---- Live thumbnail hover refresh (preload-then-swap to avoid flash) ----
  const [isHovering, setIsHovering] = React.useState(false);
  const [loadedLiveUrl, setLoadedLiveUrl] = React.useState<string | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (isHovering && liveThumbnail) {
      let canceled = false;

      const fetchFrame = () => {
        const sep = liveThumbnail.includes('?') ? '&' : '?';
        const nextUrl = `${liveThumbnail}${sep}t=${Date.now()}`;
        const img = new Image();
        img.onload = () => {
          if (!canceled) setLoadedLiveUrl(nextUrl);
        };
        img.src = nextUrl;
      };

      fetchFrame();
      intervalRef.current = setInterval(fetchFrame, LIVE_THUMB_REFRESH_MS);

      return () => {
        canceled = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setLoadedLiveUrl(null);
    }
  }, [isHovering, liveThumbnail]);

  const isLiveRefreshing = Boolean(liveThumbnail && isHovering && loadedLiveUrl);

  const hoverHandlers = liveThumbnail
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

  // Use preloaded frame URL when hovering (already loaded in Image(), no flash)
  if (loadedLiveUrl) {
    url = loadedLiveUrl;
  }

  const thumbnailUrl = url && url.replace(/'/g, "\\'");

  if (!gettingThumbnail) {
    return (
      <Thumb
        small={small}
        thumb={thumbnailUrl || MISSING_THUMB_DEFAULT}
        fallback={FALLBACK}
        className={classnames(className, {
          'media__thumb--live': Boolean(liveThumbnail),
          'media__thumb--live-refreshing': isLiveRefreshing,
        })}
        forceReload={forceReload}
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
