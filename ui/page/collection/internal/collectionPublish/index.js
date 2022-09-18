import { connect } from 'react-redux';
import {
  selectClaimBidAmountForId,
  selectClaimNameForId,
  selectUpdatingCollection,
  selectCreatingCollection,
} from 'redux/selectors/claims';
import { selectClaimIdsForCollectionId, selectCollectionForId } from 'redux/selectors/collections';
import { doCollectionPublish, doCollectionPublishUpdate } from 'redux/actions/claims';
import { selectBalance } from 'redux/selectors/wallet';
import { selectCollectionClaimUploadParamsForId } from 'redux/selectors/publish';
import { selectActiveChannelClaim } from 'redux/selectors/app';

import CollectionForm from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    claimName: selectClaimNameForId(state, collectionId),
    amount: selectClaimBidAmountForId(state, collectionId),
    updatingCollection: selectUpdatingCollection(state),
    creatingCollection: selectCreatingCollection(state),
    balance: selectBalance(state),
    collection: selectCollectionForId(state, collectionId),
    collectionClaimIds: selectClaimIdsForCollectionId(state, collectionId),
    collectionParams: selectCollectionClaimUploadParamsForId(state, collectionId),
    activeChannelClaim: selectActiveChannelClaim(state),
  };
};

const perform = {
  doCollectionPublishUpdate,
  doCollectionPublish,
};

export default connect(select, perform)(CollectionForm);
