import { connect } from 'react-redux';
import {
  selectIsResolvingForId,
  selectTitleForUri,
  selectClaimIdForUri,
  selectClaimForClaimId,
} from 'redux/selectors/claims';
import {
  selectCollectionTitleForId,
  selectCountForCollectionId,
  selectAreCollectionItemsFetchingForId,
  selectFirstItemUrlForCollection,
  selectUpdatedAtForCollectionId,
  selectCreatedAtForCollectionId,
  selectIsCollectionBuiltInForId,
  selectThumbnailForCollectionId,
  selectCollectionIsEmptyForId,
  selectCollectionTypeForId,
} from 'redux/selectors/collections';
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

  return {
    collectionId,
    uri: collectionUri,
    collectionCount: selectCountForCollectionId(state, collectionId),
    collectionName: selectCollectionTitleForId(state, collectionId),
    collectionType: selectCollectionTypeForId(state, collectionId),
    isFetchingItems: selectAreCollectionItemsFetchingForId(state, collectionId),
    isResolvingCollection: selectIsResolvingForId(state, collectionId),
    title: collectionUri && selectTitleForUri(state, collectionUri),
    channel,
    channelTitle,
    hasClaim: Boolean(claim),
    firstCollectionItemUrl: selectFirstItemUrlForCollection(state, collectionId),
    collectionUpdatedAt: selectUpdatedAtForCollectionId(state, collectionId),
    collectionCreatedAt: selectCreatedAtForCollectionId(state, collectionId),
    isBuiltin: selectIsCollectionBuiltInForId(state, collectionId),
    thumbnail: selectThumbnailForCollectionId(state, collectionId),
    isEmpty: selectCollectionIsEmptyForId(state, collectionId),
  };
};

export default connect(select)(CollectionPreview);
