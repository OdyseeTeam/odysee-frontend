import { connect } from 'react-redux';
import { selectIsUriResolving, selectTitleForUri, selectClaimIdForUri } from 'redux/selectors/claims';
import {
  selectUrlsForCollectionId,
  selectNameForCollectionId,
  selectCountForCollectionId,
  selectIsResolvingCollectionForId,
  selectFirstItemUrlForCollection,
  selectUpdatedAtForCollectionId,
  selectCreatedAtForCollectionId,
  selectPublishedCollectionClaimForId,
  selectIsCollectionBuiltInForId,
  selectCollectionHasEditsForId,
} from 'redux/selectors/collections';
import { getChannelFromClaim } from 'util/claim';
import CollectionPreview from './view';

const select = (state, props) => {
  const { collectionId: propCollectionId, uri } = props;
  const collectionId = propCollectionId || (uri && selectClaimIdForUri(state, uri));
  const claim = selectPublishedCollectionClaimForId(state, collectionId);
  const channel = getChannelFromClaim(claim);
  const collectionUri = uri || (claim && (claim.canonical_url || claim.permanent_url)) || null;

  return {
    collectionId,
    uri: collectionUri,
    collectionCount: selectCountForCollectionId(state, collectionId),
    collectionName: selectNameForCollectionId(state, collectionId),
    collectionItemUrls: selectUrlsForCollectionId(state, collectionId), // ForId || ForUri
    isResolvingCollectionClaims: selectIsResolvingCollectionForId(state, collectionId),
    isResolvingUri: collectionUri && selectIsUriResolving(state, collectionUri),
    title: collectionUri && selectTitleForUri(state, collectionUri),
    channel,
    hasClaim: Boolean(claim),
    firstCollectionItemUrl: selectFirstItemUrlForCollection(state, collectionId),
    collectionUpdatedAt: selectUpdatedAtForCollectionId(state, collectionId),
    collectionCreatedAt: selectCreatedAtForCollectionId(state, collectionId),
    isBuiltin: selectIsCollectionBuiltInForId(state, collectionId),
    hasEdits: selectCollectionHasEditsForId(state, collectionId),
  };
};

export default connect(select)(CollectionPreview);
