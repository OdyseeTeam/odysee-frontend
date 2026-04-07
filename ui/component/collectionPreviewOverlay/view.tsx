import React from 'react';
import FileThumbnail from 'component/fileThumbnail';
import { useAppSelector } from 'redux/hooks';
import { selectThumbnailForId } from 'redux/selectors/claims';
import { selectUrlsForCollectionId } from 'redux/selectors/collections';
type Props = {
  collectionId: string;
};

function CollectionPreviewOverlay(props: Props) {
  const { collectionId } = props;
  const collectionItemUrls = useAppSelector((state) => selectUrlsForCollectionId(state, collectionId, 3));
  const collectionThumbnail = useAppSelector((state) => selectThumbnailForId(state, collectionId));

  if (
    !collectionItemUrls ||
    collectionItemUrls.length === 0 ||
    (collectionItemUrls.length === 1 && !collectionThumbnail)
  ) {
    return null;
  }

  // if the playlist's thumbnail is the first item of the list, then don't show it again
  // on the preview overlay (show the second and third instead)
  const displayedItems = !collectionThumbnail ? collectionItemUrls.slice(1, 3) : collectionItemUrls.slice(0, 2);
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

export default CollectionPreviewOverlay;
