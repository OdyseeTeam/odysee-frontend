import { connect } from 'react-redux';
import {
  selectClaimForUri,
  selectClaimWasPurchasedForUri,
  selectRentalTagForUri,
  selectPurchaseTagForUri,
  selectIsFiatPaidForUri,
  selectIsFetchingPurchases,
  selectCostInfoForUri,
  selectFiatCurrencyForUri,
} from 'redux/selectors/claims';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import { selectCurrencyRate } from 'redux/selectors/stripe';
import FilePrice from './view';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const preferredCurrency = selectPreferredCurrency(state);
  const originalCurrency = selectFiatCurrencyForUri(state, props.uri);
  const canUsePreferredCurrency = Boolean(selectCurrencyRate(state, originalCurrency, preferredCurrency));
  const currency = canUsePreferredCurrency ? preferredCurrency : originalCurrency;

  return {
    claim,
    sdkPaid: selectClaimWasPurchasedForUri(state, props.uri),
    fiatPaid: selectIsFiatPaidForUri(state, props.uri),
    costInfo: selectCostInfoForUri(state, props.uri),
    rentalInfo: selectRentalTagForUri(state, props.uri),
    purchaseInfo: selectPurchaseTagForUri(state, props.uri),
    isFetchingPurchases: selectIsFetchingPurchases(state),
    currency,
    canUsePreferredCurrency,
  };
};

export default connect(select)(FilePrice);
