import { connect } from 'react-redux';

import { withRouter } from 'react-router-dom';
import CollectionPage from './view';
import {
  selectTitleForUri,
  selectClaimIsMine,
  makeSelectClaimIsPending,
  makeSelectClaimForClaimId,
  makeSelectChannelForClaimUri,
} from 'redux/selectors/claims';

import {
  selectCollectionForId,
  selectUrlsForCollectionId,
  selectIsResolvingCollectionForId,
  selectCollectionIsMine,
  selectCountForCollectionId,
  selectEditedCollectionForId,
  selectBrokenUrlsForCollectionId,
} from 'redux/selectors/collections';

import { getThumbnailFromClaim } from 'util/claim';
import { doFetchItemsInCollection, doCollectionDelete, doCollectionEdit } from 'redux/actions/collections';
import { selectUser } from 'redux/selectors/user';

const select = (state, props) => {
  const { match } = props;
  const { params } = match;
  const { collectionId } = params;

  const claim = collectionId && makeSelectClaimForClaimId(collectionId)(state);
  const uri = (claim && (claim.canonical_url || claim.permanent_url)) || null;

  return {
    collectionId,
    claim,
    collection: selectCollectionForId(state, collectionId),
    collectionUrls: selectUrlsForCollectionId(state, collectionId),
    brokenUrls: selectBrokenUrlsForCollectionId(state, collectionId),
    collectionCount: selectCountForCollectionId(state, collectionId),
    isResolvingCollection: selectIsResolvingCollectionForId(state, collectionId),
    title: selectTitleForUri(state, uri),
    thumbnail: getThumbnailFromClaim(claim),
    isMyClaim: selectClaimIsMine(state, claim), // or collection is mine?
    isMyCollection: selectCollectionIsMine(state, collectionId),
    claimIsPending: makeSelectClaimIsPending(uri)(state),
    collectionHasEdits: Boolean(selectEditedCollectionForId(state, collectionId)),
    uri,
    user: selectUser(state),
    channel: uri && makeSelectChannelForClaimUri(uri)(state),
  };
};

const perform = (dispatch) => ({
  fetchCollectionItems: (claimId, cb) => dispatch(doFetchItemsInCollection({ collectionId: claimId }, cb)), // if this collection is not resolved, resolve it
  deleteCollection: (id, colKey) => dispatch(doCollectionDelete(id, colKey)),
  editCollection: (id, params) => dispatch(doCollectionEdit(id, params)),
});

export default withRouter(connect(select, perform)(CollectionPage));
