import { connect } from 'react-redux';

import { makeSelectClaimIsPending, selectClaimForId } from 'redux/selectors/claims';
import {
  selectCollectionForId,
  selectCountForCollectionId,
  selectCollectionHasEditsForId,
  selectMyPublishedCollectionCountForId,
} from 'redux/selectors/collections';
import { doCollectionDelete, doCollectionEdit } from 'redux/actions/collections';
import { doOpenModal } from 'redux/actions/app';

import CollectionHeader from './view';

const select = (state, props) => {
  const { collectionId } = props;

  const claim = collectionId && selectClaimForId(state, collectionId);
  const uri = (claim && (claim.canonical_url || claim.permanent_url)) || null;

  return {
    collectionId,
    uri,
    claim,
    collection: selectCollectionForId(state, collectionId),
    collectionCount: selectCountForCollectionId(state, collectionId),
    claimIsPending: makeSelectClaimIsPending(uri)(state),
    collectionHasEdits: selectCollectionHasEditsForId(state, collectionId),
    publishedCollectionCount: selectMyPublishedCollectionCountForId(state, collectionId),
  };
};

const perform = {
  doCollectionDelete,
  doCollectionEdit,
  doOpenModal,
};

export default connect(select, perform)(CollectionHeader);
