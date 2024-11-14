import { connect } from 'react-redux';
import {
  selectPreorderTagForUri,
  selectPreorderContentClaimIdForUri,
  selectClaimForId,
  selectPurchaseTagForUri,
  selectRentalTagForUri,
  selectCostInfoForUri,
  selectFiatCurrencyForUri,
} from 'redux/selectors/claims';
import PaidContentOvelay from './view';
import { doOpenModal } from 'redux/actions/app';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import { selectCurrencyRate } from 'redux/selectors/stripe';

const select = (state, props) => {
  const { uri } = props;
  const preorderContentClaimId = selectPreorderContentClaimIdForUri(state, uri);

  const preferredCurrency = selectPreferredCurrency(state);
  const originalCurrency = selectFiatCurrencyForUri(state, props.uri);
  const canUsePreferredCurrency = Boolean(selectCurrencyRate(state, originalCurrency, preferredCurrency));
  const currency = canUsePreferredCurrency ? preferredCurrency : originalCurrency;

  return {
    currency,
    canUsePreferredCurrency,
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
