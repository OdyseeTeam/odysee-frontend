import { connect } from 'react-redux';

import {
  selectHasClaimForId,
  selectClaimBidAmountForId,
  selectClaimIsPendingForId,
  selectClaimUriForId,
} from 'redux/selectors/claims';
import { selectBalance } from 'redux/selectors/wallet';
import { selectCollectionClaimUploadParamsForId } from 'redux/selectors/publish';
import {
  selectCollectionHasEditsForId,
  selectHasUnavailableClaimIdsForCollectionId,
} from 'redux/selectors/collections';
import { selectActiveChannelClaim } from 'redux/selectors/app';

import { doCollectionPublish, doCollectionEdit, doClearEditsForCollectionId } from 'redux/actions/collections';
import { doOpenModal } from 'redux/actions/app';

import CollectionPublishForm from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    uri: selectClaimUriForId(state, collectionId),
    hasClaim: selectHasClaimForId(state, collectionId),
    amount: selectClaimBidAmountForId(state, collectionId),
    isClaimPending: selectClaimIsPendingForId(state, collectionId),
    balance: selectBalance(state),
    collectionParams: selectCollectionClaimUploadParamsForId(state, collectionId),
    activeChannelClaim: selectActiveChannelClaim(state),
    collectionHasEdits: selectCollectionHasEditsForId(state, collectionId),
    hasUnavailableClaims: selectHasUnavailableClaimIdsForCollectionId(state, collectionId),
  };
};

const perform = {
  doCollectionPublish,
  doCollectionEdit,
  doClearEditsForCollectionId,
  doOpenModal,
};

export default connect(select, perform)(CollectionPublishForm);
