// @flow
import type { Node } from 'react';
import {
  THUMBNAIL_WIDTH,
  THUMBNAIL_WIDTH_POSTER,
  THUMBNAIL_HEIGHT,
  THUMBNAIL_HEIGHT_POSTER,
  THUMBNAIL_QUALITY,
  MISSING_THUMB_DEFAULT,
} from 'config';
import { useIsMobile } from 'effects/use-screensize';
import { getImageProxyUrl, getThumbnailCdnUrl } from 'util/thumbnail';
import React from 'react';
import FreezeframeWrapper from 'component/common/freezeframe-wrapper';
import classnames from 'classnames';
import Thumb from './internal/thumb';
import PreviewOverlayProtectedContent from '../previewOverlayProtectedContent';

const FALLBACK = MISSING_THUMB_DEFAULT ? getThumbnailCdnUrl({ thumbnail: MISSING_THUMB_DEFAULT }) : undefined;

type Props = {
  uri?: string,
  tileLayout?: boolean,
  thumbnail: ?string, // externally sourced image
  children?: Node,
  allowGifs: boolean,
  claim: ?StreamClaim,
  className?: string,
  small?: boolean,
  // forcePlaceholder?: boolean,
  forceReload?: boolean,
  // -- redux --
  hasResolvedClaim: ?boolean, // undefined if uri is not given (irrelevant); boolean otherwise.
  thumbnailFromClaim: ?string,
  thumbnailFromSecondaryClaim: ?string,
  isShort: ?string, // doResolveUri: (uri: string) => void,
};

function FileThumbnail(props: Props) {
  const {
    uri,
    tileLayout,
    thumbnail: rawThumbnail,
    children,
    allowGifs = false,
    className,
    small,
    // forcePlaceholder,
    forceReload,
    // -- redux --
    hasResolvedClaim,
    thumbnailFromClaim,
    thumbnailFromSecondaryClaim,
    isShort,
    // doResolveUri,
  } = props;

  const isMobile = useIsMobile();

  const passedThumbnail = rawThumbnail && rawThumbnail.trim().replace(/^http:\/\//i, 'https://');
  const thumbnail =
    passedThumbnail ||
    (thumbnailFromClaim === null && 'secondaryUri' in props ? thumbnailFromSecondaryClaim : thumbnailFromClaim);

  const gettingThumbnail = passedThumbnail === undefined && thumbnailFromClaim === null;
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
            'media__thumb--resolving': hasResolvedClaim === false,
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
        width: isMobile && tileLayout ? THUMBNAIL_WIDTH_POSTER : THUMBNAIL_WIDTH,
        height: isMobile && tileLayout ? THUMBNAIL_HEIGHT_POSTER : THUMBNAIL_HEIGHT,
        quality: THUMBNAIL_QUALITY,
        isShorts: isShort,
      });
    }
  }

  const thumbnailUrl = url && url.replace(/'/g, "\\'");

  if (!gettingThumbnail && thumbnailUrl !== undefined) {
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
        'media__thumb--resolving': hasResolvedClaim === false,
        'media__thumb--small': small,
        media__thumb__short: isShort,
      })}
    >
      {children}
    </div>
  );
}

export default FileThumbnail;
