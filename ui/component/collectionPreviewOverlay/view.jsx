// @flow
import React from 'react';
import { withRouter } from 'react-router-dom';
import FileThumbnail from 'component/fileThumbnail';

type Props = {
  // redux
  collectionItemUrls: ?Array<string>,
  collectionThumbnail: ?string,
};

function CollectionPreviewOverlay(props: Props) {
  const { collectionItemUrls, collectionThumbnail } = props;

  if (!collectionItemUrls || collectionItemUrls.length === 0) {
    return null;
  }

  // if the playlist's thumbnail is the first item of the list, then don't show it again
  // on the preview overlay (show the second and third instead)
  const isThumbnailFirstItem = collectionItemUrls.length > 2 && !collectionThumbnail;
  const displayedItems = isThumbnailFirstItem ? collectionItemUrls.slice(1, 3) : collectionItemUrls.slice(0, 2);

  return (
    <div className="claim-preview__collection-wrapper">
      <ul className="ul--no-style collection-preview-overlay__grid">
        {displayedItems.map((uri) => (
          <li className="li--no-style collection-preview-overlay__grid-item" key={uri}>
            <FileThumbnail uri={uri} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default withRouter(CollectionPreviewOverlay);
