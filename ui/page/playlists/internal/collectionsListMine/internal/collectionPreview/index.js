import { connect } from 'react-redux';
import {
  selectIsResolvingForId,
  selectTitleForUri,
  selectClaimIdForUri,
  selectClaimForClaimId,
  selectThumbnailForUri,
  selectClaimIsPendingForId,
} from 'redux/selectors/claims';
import {
  selectCollectionTitleForId,
  selectCountForCollectionId,
  selectAreCollectionItemsFetchingForId,
  selectFirstItemUrlForCollection,
  selectUrlsForCollectionId,
  selectUpdatedAtForCollectionId,
  selectCreatedAtForCollectionId,
  selectIsCollectionBuiltInForId,
  selectThumbnailForCollectionId,
  selectCollectionIsEmptyForId,
  selectCollectionTypeForId,
  selectCollectionHasEditsForId,
  selectCollectionIsPublishingForId,
  selectCollectionPublishErrorForId,
} from 'redux/selectors/collections';
import { selectCanPlaybackFileForUri } from 'redux/selectors/content';
import { getChannelFromClaim } from 'util/claim';
import CollectionPreview from './view';

const select = (state, props) => {
  const { collectionId: propCollectionId, uri } = props;
  const collectionId = propCollectionId || (uri && selectClaimIdForUri(state, uri));
  const claim = selectClaimForClaimId(state, collectionId);
  const channel = getChannelFromClaim(claim);
  const collectionUri = uri || (claim && (claim.canonical_url || claim.permanent_url)) || null;
  let channelTitle = null;
  if (channel) {
    const { value, name } = channel;
    if (value && value.title) {
      channelTitle = value.title;
    } else {
      channelTitle = name;
    }
  }
  const firstCollectionItemUrl = selectFirstItemUrlForCollection(state, collectionId);
  const firstPlayableCollectionItemUrl = selectUrlsForCollectionId(state, collectionId)?.find((url) =>
    selectCanPlaybackFileForUri(state, url)
  );

  return {
    collectionId,
    uri: collectionUri,
    collectionCount: selectCountForCollectionId(state, collectionId),
    collectionName: selectCollectionTitleForId(state, collectionId),
    collectionType: selectCollectionTypeForId(state, collectionId),
    isFetchingItems: selectAreCollectionItemsFetchingForId(state, collectionId),
    isResolvingCollection: selectIsResolvingForId(state, collectionId),
    claimIsPending: selectClaimIsPendingForId(state, collectionId),
    title: collectionUri && selectTitleForUri(state, collectionUri),
    channel,
    channelTitle,
    hasClaim: Boolean(claim),
    firstCollectionItemUrl,
    firstPlayableCollectionItemUrl,
    collectionUpdatedAt: selectUpdatedAtForCollectionId(state, collectionId),
    collectionCreatedAt: selectCreatedAtForCollectionId(state, collectionId),
    isBuiltin: selectIsCollectionBuiltInForId(state, collectionId),
    thumbnail: selectThumbnailForCollectionId(state, collectionId),
    isEmpty: selectCollectionIsEmptyForId(state, collectionId),
    thumbnailFromClaim: selectThumbnailForUri(state, collectionUri),
    thumbnailFromSecondaryClaim: selectThumbnailForUri(state, firstCollectionItemUrl, true),
    collectionHasEdits: selectCollectionHasEditsForId(state, collectionId),
    isPublishing: selectCollectionIsPublishingForId(state, collectionId),
    publishError: selectCollectionPublishErrorForId(state, collectionId),
  };
};

export default connect(select)(CollectionPreview);
