import { connect } from 'react-redux';

import { selectHasClaimForId, selectIsResolvingForId } from 'redux/selectors/claims';
import {
  selectCollectionForId,
  selectUrlsForCollectionId,
  selectIsResolvingCollectionForId,
  selectBrokenUrlsForCollectionId,
  selectCollectionIsMine,
} from 'redux/selectors/collections';

import { doFetchItemsInCollection } from 'redux/actions/collections';

import CollectionPage from './view';

const select = (state, props) => {
  const { match } = props;
  const { params } = match;
  const { collectionId } = params;

  return {
    collectionId,
    hasClaim: selectHasClaimForId(state, collectionId),
    collection: selectCollectionForId(state, collectionId),
    collectionUrls: selectUrlsForCollectionId(state, collectionId),
    brokenUrls: selectBrokenUrlsForCollectionId(state, collectionId),
    isResolvingCollection: selectIsResolvingCollectionForId(state, collectionId),
    isResolving: selectIsResolvingForId(state, collectionId),
    isCollectionMine: selectCollectionIsMine(state, collectionId),
  };
};

const perform = {
  doFetchItemsInCollection,
};

export default connect(select, perform)(CollectionPage);
