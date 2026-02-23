import { connect } from 'react-redux';

import {
  selectHasClaimForId,
  selectClaimBidAmountForId,
  selectClaimIsPendingForId,
  selectClaimUriForId,
  selectClaimsById,
} from 'redux/selectors/claims';
import { selectBalance } from 'redux/selectors/wallet';
import { selectCollectionClaimUploadParamsForId } from 'redux/selectors/publish';
import {
  selectCollectionHasEditsForId,
  selectHasUnavailableClaimIdsForCollectionId,
  selectCollectionHasUnsavedEditsForId,
} from 'redux/selectors/collections';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectSettingsByChannelId } from 'redux/selectors/comments';

import {
  doCollectionPublish,
  doCollectionEdit,
  doClearEditsForCollectionId,
  doRemoveFromUnsavedChangesCollectionsForCollectionId,
} from 'redux/actions/collections';
import { doFetchCreatorSettings, doUpdateCreatorSettings } from 'redux/actions/comments';
import { doOpenModal } from 'redux/actions/app';

import CollectionPublishForm from './view';

const select = (state, props) => {
  const { collectionId } = props;
  const collectionParams = selectCollectionClaimUploadParamsForId(state, collectionId);

  return {
    uri: selectClaimUriForId(state, collectionId),
    hasClaim: selectHasClaimForId(state, collectionId),
    amount: selectClaimBidAmountForId(state, collectionId),
    isClaimPending: selectClaimIsPendingForId(state, collectionId),
    balance: selectBalance(state),
    collectionParams,
    activeChannelClaim: selectActiveChannelClaim(state),
    claimsById: selectClaimsById(state),
    settingsByChannelId: selectSettingsByChannelId(state),
    collectionHasEdits: selectCollectionHasEditsForId(state, collectionId),
    collectionHasUnSavedEdits: selectCollectionHasUnsavedEditsForId(state, collectionId),
    hasUnavailableClaims: selectHasUnavailableClaimIdsForCollectionId(state, collectionId),
  };
};

const perform = {
  doCollectionPublish,
  doCollectionEdit,
  doClearEditsForCollectionId,
  doOpenModal,
  doRemoveFromUnsavedChangesCollectionsForCollectionId,
  doFetchCreatorSettings,
  doUpdateCreatorSettings,
};

export default connect(select, perform)(CollectionPublishForm);
