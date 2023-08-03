import { connect } from 'react-redux';
import {
  selectPreorderTagForUri,
  selectPreorderContentClaimIdForUri,
  selectClaimForId,
  selectPurchaseTagForUri,
  selectRentalTagForUri,
  selectCostInfoForUri,
} from 'redux/selectors/claims';
import PaidContentOvelay from './view';
import { doOpenModal } from 'redux/actions/app';
import { selectPreferredCurrency } from 'redux/selectors/settings';

const select = (state, props) => {
  const { uri } = props;

  const preorderContentClaimId = selectPreorderContentClaimIdForUri(state, uri);

  return {
    preferredCurrency: selectPreferredCurrency(state),
    preorderContentClaim: selectClaimForId(state, preorderContentClaimId),
    preorderTag: selectPreorderTagForUri(state, uri),
    purchaseTag: selectPurchaseTagForUri(state, uri),
    rentalTag: selectRentalTagForUri(state, uri),
    costInfo: selectCostInfoForUri(state, uri),
  };
};

const perform = {
  doOpenModal,
};

export default connect(select, perform)(PaidContentOvelay);
