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
  tileLayout?: boolean;
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
  const thumbnailFromClaim = useAppSelector((state) => selectThumbnailForUri(state, uri)) as string | null | undefined;
  const thumbnailFromSecondaryClaim = useAppSelector((state) =>
    secondaryUri ? selectThumbnailForUri(state, secondaryUri) : undefined
  ) as string | null | undefined;
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

  // ---- Live thumbnail hover refresh (preload-then-swap, no flash) ----
  const [isHovering, setIsHovering] = React.useState(false);
  const [loadedLiveUrl, setLoadedLiveUrl] = React.useState<string | null>(null);
  const fetchingRef = React.useRef(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (isHovering && liveThumbnail) {
      let canceled = false;

      const fetchFrame = () => {
        if (canceled || fetchingRef.current) return;
        fetchingRef.current = true;
        const sep = liveThumbnail.includes('?') ? '&' : '?';
        const nextUrl = `${liveThumbnail}${sep}t=${Date.now()}`;
        const img = new Image();
        img.onload = () => {
          fetchingRef.current = false;
          if (!canceled) {
            setLoadedLiveUrl(nextUrl);
            // Schedule next frame only after this one loaded
            timerRef.current = setTimeout(fetchFrame, LIVE_THUMB_REFRESH_MS);
          }
        };
        img.onerror = () => {
          fetchingRef.current = false;
          if (!canceled) {
            // On error, retry after a longer delay (don't spam 404s)
            timerRef.current = setTimeout(fetchFrame, 1000);
          }
        };
        img.src = nextUrl;
      };

      fetchFrame();

      return () => {
        canceled = true;
        fetchingRef.current = false;
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else {
      // Stop fetching but keep the last good frame (don't clear to null)
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      fetchingRef.current = false;
    }
  }, [isHovering, liveThumbnail]);

  // Clear loaded URL only when the live thumbnail source itself changes (stream ended)
  React.useEffect(() => {
    if (!liveThumbnail) setLoadedLiveUrl(null);
  }, [liveThumbnail]);

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
