import { connect } from 'react-redux';
import { selectClaimBidAmountForId, selectClaimNameForId } from 'redux/selectors/claims';
import { selectClaimIdsForCollectionId, selectCollectionForId } from 'redux/selectors/collections';
import { doCollectionPublish } from 'redux/actions/collections';
import { selectBalance } from 'redux/selectors/wallet';
import { selectCollectionClaimUploadParamsForId } from 'redux/selectors/publish';
import { selectActiveChannelClaim } from 'redux/selectors/app';

import CollectionForm from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    claimName: selectClaimNameForId(state, collectionId),
    amount: selectClaimBidAmountForId(state, collectionId),
    balance: selectBalance(state),
    collection: selectCollectionForId(state, collectionId),
    collectionClaimIds: selectClaimIdsForCollectionId(state, collectionId),
    collectionParams: selectCollectionClaimUploadParamsForId(state, collectionId),
    activeChannelClaim: selectActiveChannelClaim(state),
  };
};

const perform = {
  doCollectionPublish,
};

export default connect(select, perform)(CollectionForm);
