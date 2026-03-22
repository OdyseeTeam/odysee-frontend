import { THUMBNAIL_QUALITY, MISSING_THUMB_DEFAULT } from 'config';
import { getImageProxyUrl, getThumbnailCdnUrl } from 'util/thumbnail';
import React from 'react';
import FreezeframeWrapper from 'component/common/freezeframe-wrapper';
import classnames from 'classnames';
import Thumb from './internal/thumb';
import PreviewOverlayProtectedContent from '../previewOverlayProtectedContent';
import { useAppSelector } from 'redux/hooks';
import { selectHasResolvedClaimForUri, selectThumbnailForUri } from 'redux/selectors/claims';

const FALLBACK = MISSING_THUMB_DEFAULT
  ? getThumbnailCdnUrl({
      thumbnail: MISSING_THUMB_DEFAULT,
    })
  : undefined;
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

  const passedThumbnail = rawThumbnail && rawThumbnail.trim().replace(/^http:\/\//i, 'https://');
  const thumbnail =
    passedThumbnail || (thumbnailFromClaim === null && secondaryUri ? thumbnailFromSecondaryClaim : thumbnailFromClaim);
  // Show skeleton while the claim hasn't resolved yet, rather than flashing
  // the "missing thumbnail" placeholder before the real image arrives.
  const gettingThumbnail =
    passedThumbnail === undefined && (thumbnailFromClaim === null || (!thumbnail && !hasResolvedClaim));
  const isGif = thumbnail && thumbnail.endsWith('gif');

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

  let url = thumbnail;

  // Pass image urls through a compression proxy
  if (thumbnail) {
    if (isGif) {
      url = getImageProxyUrl(thumbnail); // Note: the '!allowGifs' case is handled in Freezeframe above.
    } else {
      url = getThumbnailCdnUrl({
        thumbnail,
        quality: THUMBNAIL_QUALITY,
        isShorts: isShort,
      });
    }
  }

  const thumbnailUrl = url && url.replace(/'/g, "\\'");

  if (!gettingThumbnail) {
    return (
      <Thumb
        small={small}
        thumb={thumbnailUrl || MISSING_THUMB_DEFAULT}
        fallback={FALLBACK}
        className={className}
        forceReload={forceReload}
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
