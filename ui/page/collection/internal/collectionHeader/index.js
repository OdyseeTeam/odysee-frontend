import { connect } from 'react-redux';

import { selectClaimIsPendingForId, selectClaimForId } from 'redux/selectors/claims';
import {
  selectCollectionForId,
  selectCountForCollectionId,
  selectCollectionHasEditsForId,
} from 'redux/selectors/collections';
import { doCollectionEdit } from 'redux/actions/collections';

import CollectionHeader from './view';

const select = (state, props) => {
  const { collectionId } = props;

  const claim = collectionId && selectClaimForId(state, collectionId);
  const uri = (claim && (claim.canonical_url || claim.permanent_url)) || null;

  return {
    collectionId,
    uri,
    collection: selectCollectionForId(state, collectionId),
    collectionCount: selectCountForCollectionId(state, collectionId),
    claimIsPending: selectClaimIsPendingForId(state, collectionId),
    collectionHasEdits: selectCollectionHasEditsForId(state, collectionId),
  };
};

const perform = {
  doCollectionEdit,
};

export default connect(select, perform)(CollectionHeader);
