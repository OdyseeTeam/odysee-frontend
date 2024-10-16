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
import { selectCurrencyRate } from 'redux/selectors/stripe';

const select = (state, props) => {
  const { uri } = props;

  const preorderContentClaimId = selectPreorderContentClaimIdForUri(state, uri);
  const preferredCurrency = selectPreferredCurrency(state);
  const estimatedRate = selectCurrencyRate(state, 'USD', preferredCurrency);
  const purchaseTag = selectPurchaseTagForUri(state, uri);

  const preferredCurrencyPriceEstimate = (estimatedRate * purchaseTag).toFixed(2);

  return {
    preferredCurrency,
    preorderContentClaim: selectClaimForId(state, preorderContentClaimId),
    preorderTag: selectPreorderTagForUri(state, uri),
    purchaseTag,
    rentalTag: selectRentalTagForUri(state, uri),
    costInfo: selectCostInfoForUri(state, uri),
    preferredCurrencyPriceEstimate,
  };
};

const perform = {
  doOpenModal,
};

export default connect(select, perform)(PaidContentOvelay);
