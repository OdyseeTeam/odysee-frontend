import { connect } from 'react-redux';

import {
  selectHasPrivateCollectionForId,
  selectUrlsForCollectionId,
  selectClaimIdsForCollectionId,
} from 'redux/selectors/collections';

import { doResolveClaimId } from 'redux/actions/claims';
import { doFetchItemsInCollection } from 'redux/actions/collections';

import withCollectionItems from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    isPrivate: selectHasPrivateCollectionForId(state),
    collectionUrls: selectUrlsForCollectionId(state, collectionId),
    collectionIds: selectClaimIdsForCollectionId(state, collectionId),
  };
};

const perform = {
  doResolveClaimId,
  doFetchItemsInCollection,
};

export default (Component) => connect(select, perform)(withCollectionItems(Component));
