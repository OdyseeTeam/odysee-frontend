import { connect } from 'react-redux';

import { selectClaimBidAmountForId } from 'redux/selectors/claims';
import { selectBalance } from 'redux/selectors/wallet';

import CollectionPublishAdditionalOptions from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    amount: selectClaimBidAmountForId(state, collectionId),
    balance: selectBalance(state),
  };
};

export default connect(select)(CollectionPublishAdditionalOptions);
