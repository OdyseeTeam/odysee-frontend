import { connect } from 'react-redux';

import {
  selectHasClaimForId,
  selectClaimIsPendingForId,
  selectClaimForId,
  selectGeoRestrictionForUri,
} from 'redux/selectors/claims';
import {
  selectCollectionForId,
  selectBrokenUrlsForCollectionId,
  selectCollectionIsMine,
  selectHasPrivateCollectionForId,
  selectIsCollectionPrivateForId,
} from 'redux/selectors/collections';

import { doResolveClaimId } from 'redux/actions/claims';
import { doCollectionEdit, doRemoveFromUnsavedChangesCollectionsForCollectionId } from 'redux/actions/collections';

import CollectionPage from './view';

const select = (state, props) => {
  const { match } = props;
  const { params } = match;
  const { collectionId } = params;

  const claim = selectClaimForId(state, collectionId);

  return {
    collectionId,
    geoRestiction: selectGeoRestrictionForUri(state, claim?.permanent_url),
    hasClaim: selectHasClaimForId(state, collectionId),
    collection: selectCollectionForId(state, collectionId),
    brokenUrls: selectBrokenUrlsForCollectionId(state, collectionId),
    isCollectionMine: selectCollectionIsMine(state, collectionId),
    hasPrivate: selectHasPrivateCollectionForId(state, collectionId),
    isPrivate: selectIsCollectionPrivateForId(state, collectionId),
    isClaimPending: selectClaimIsPendingForId(state, collectionId),
  };
};

const perform = {
  doResolveClaimId,
  doCollectionEdit,
  doRemoveFromUnsavedChangesCollectionsForCollectionId,
};

export default connect(select, perform)(CollectionPage);
