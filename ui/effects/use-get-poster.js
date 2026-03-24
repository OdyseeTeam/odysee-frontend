// @flow
import React from 'react';
import { THUMBNAIL_WIDTH_POSTER, THUMBNAIL_HEIGHT_POSTER } from 'config';
import { getThumbnailCdnUrl } from 'util/thumbnail';
// $FlowFixMe cannot resolve ...
import FileRenderPlaceholder from 'static/img/fileRenderPlaceholder.png';

export default function useGetPoster(claimThumbnail: ?string, isShorts?: boolean) {
  const [thumbnail, setThumbnail] = React.useState(() => {
    if (claimThumbnail) {
      return getThumbnailCdnUrl(
        isShorts
          ? { thumbnail: claimThumbnail, isShorts: true }
          : { thumbnail: claimThumbnail, width: THUMBNAIL_WIDTH_POSTER, height: THUMBNAIL_HEIGHT_POSTER }
      );
    }
    return isShorts ? null : FileRenderPlaceholder;
  });

  React.useEffect(() => {
    if (!claimThumbnail) {
      setThumbnail(isShorts ? null : FileRenderPlaceholder);
    } else {
      setThumbnail(
        getThumbnailCdnUrl(
          isShorts
            ? { thumbnail: claimThumbnail, isShorts: true }
            : { thumbnail: claimThumbnail, width: THUMBNAIL_WIDTH_POSTER, height: THUMBNAIL_HEIGHT_POSTER }
        )
      );
    }
  }, [claimThumbnail, isShorts]);

  return thumbnail;
}
