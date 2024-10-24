import { connect } from 'react-redux';
import {
  selectClaimForUri,
  selectPreorderTagForUri,
  selectPurchaseTagForUri,
  selectRentalTagForUri,
  selectCostInfoForUri,
  selectClaimIsMine,
  selectClaimWasPurchasedForUri,
  selectIsFiatRequiredForUri,
  selectIsFetchingPurchases,
  selectSdkFeePendingForUri,
  selectPendingPurchaseForUri,
  selectFiatCurrencyForUri,
} from 'redux/selectors/claims';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { doPlayUri } from 'redux/actions/content';
import { doHideModal } from 'redux/actions/app';
import { doCheckIfPurchasedClaimId } from 'redux/actions/stripe';
import { doPurchaseClaimForUri } from 'redux/actions/wallet';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import { selectCurrencyRate } from 'redux/selectors/stripe';
import { withRouter } from 'react-router';
import PreorderAndPurchaseContent from './view';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri, false);
  const { claim_id: claimId, value_type: claimType } = claim || {};

  const preferredCurrency = selectPreferredCurrency(state);
  const originalCurrency = selectFiatCurrencyForUri(state, props.uri);
  const canUsePreferredCurrency = Boolean(selectCurrencyRate(state, originalCurrency, preferredCurrency));
  const currency = canUsePreferredCurrency ? preferredCurrency : originalCurrency;

  return {
    claimId,
    claimType,
    currency,
    canUsePreferredCurrency,
    preorderTag: selectPreorderTagForUri(state, uri),
    purchaseTag: selectPurchaseTagForUri(state, uri),
    rentalTag: selectRentalTagForUri(state, uri),
    costInfo: selectCostInfoForUri(state, uri),
    claimIsMine: selectClaimIsMine(state, claim),
    sdkPaid: selectClaimWasPurchasedForUri(state, uri),
    fiatRequired: selectIsFiatRequiredForUri(state, uri),
    isFetchingPurchases: selectIsFetchingPurchases(state),
    isAuthenticated: selectUserVerifiedEmail(state),
    pendingSdkPayment: selectSdkFeePendingForUri(state, uri),
    pendingPurchase: selectPendingPurchaseForUri(state, uri),
  };
};

const perform = {
  doHideModal,
  doPurchaseClaimForUri,
  doCheckIfPurchasedClaimId,
  doPlayUri,
};

export default withRouter(connect(select, perform)(PreorderAndPurchaseContent));
