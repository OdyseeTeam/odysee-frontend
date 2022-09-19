import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { selectIsResolvingForId, makeSelectClaimForClaimId } from 'redux/selectors/claims';

import {
  selectCollectionForId,
  selectBrokenUrlsForCollectionId,
  selectMyEditedCollections,
} from 'redux/selectors/collections';
import { doFetchItemsInCollection } from 'redux/actions/collections';

import CollectionPage from './view';

const select = (state, props) => {
  const { match } = props;
  const { params } = match;
  const { collectionId } = params;

  const claim = collectionId && makeSelectClaimForClaimId(collectionId)(state);
  const uri = (claim && (claim.canonical_url || claim.permanent_url)) || null;

  return {
    collectionId,
    uri,
    collection: selectCollectionForId(state, collectionId),
    brokenUrls: selectBrokenUrlsForCollectionId(state, collectionId),
    editedCollections: selectMyEditedCollections(state),
    isResolvingCollection: selectIsResolvingForId(state, collectionId),
  };
};

const perform = {
  doFetchItemsInCollection,
};

export default withRouter(connect(select, perform)(CollectionPage));
