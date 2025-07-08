import { connect } from 'react-redux';
import {
  selectPreorderTagForUri,
  selectPreorderContentClaimIdForUri,
  selectClaimForId,
  selectPurchaseTagForUri,
  selectRentalTagForUri,
  selectCostInfoForUri,
  selectCanReceiveTipsForUri,
} from 'redux/selectors/claims';
import PaidContentOvelay from './view';
import { doOpenModal } from 'redux/actions/app';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import { selectArweaveBalance, selectArweaveExchangeRates } from 'redux/selectors/arwallet';

const select = (state, props) => {
  const { uri } = props;

  const preorderContentClaimId = selectPreorderContentClaimIdForUri(state, uri);

  return {
    preferredCurrency: selectPreferredCurrency(state),
    preorderContentClaim: selectClaimForId(state, preorderContentClaimId),
    canReceiveTips: selectCanReceiveTipsForUri(state, uri),
    preorderTag: selectPreorderTagForUri(state, uri),
    purchaseTag: selectPurchaseTagForUri(state, uri),
    rentalTag: selectRentalTagForUri(state, uri),
    balance: selectArweaveBalance(state) || { ar: 0 },
    costInfo: selectCostInfoForUri(state, uri),
    exchangeRate: selectArweaveExchangeRates(state),
  };
};

const perform = {
  doOpenModal,
};

export default connect(select, perform)(PaidContentOvelay);
