import { connect } from 'react-redux';
import { withRouter } from 'react-router';
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
  selectCanReceiveTipsForUri,
} from 'redux/selectors/claims';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { doPlayUri } from 'redux/actions/content';
import { doHideModal } from 'redux/actions/app';
import { doCheckIfPurchasedClaimId } from 'redux/actions/stripe';
import { doPurchaseClaimForUri } from 'redux/actions/wallet';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import PreorderAndPurchaseContent from './view';
import { selectArweaveBalance, selectArweaveExchangeRates } from 'redux/selectors/arwallet';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri, false);
  const { claim_id: claimId, value_type: claimType } = claim || {};

  const costInfo = selectCostInfoForUri(state, uri);
  const purchaseTag = selectPurchaseTagForUri(state, uri);

  return {
    claimId,
    claimType,
    canReceiveTips: selectCanReceiveTipsForUri(state, uri),
    preferredCurrency: selectPreferredCurrency(state),
    preorderTag: selectPreorderTagForUri(state, uri),
    purchaseTag,
    rentalTag: selectRentalTagForUri(state, uri),
    costInfo,
    claimIsMine: selectClaimIsMine(state, claim),
    sdkPaid: selectClaimWasPurchasedForUri(state, uri),
    fiatRequired: selectIsFiatRequiredForUri(state, uri),
    isFetchingPurchases: selectIsFetchingPurchases(state),
    isAuthenticated: selectUserVerifiedEmail(state),
    pendingSdkPayment: costInfo?.feeCurrency === 'LBC' ? selectSdkFeePendingForUri(state, uri) : undefined,
    pendingPurchase: selectPendingPurchaseForUri(state, uri),
    balance: selectArweaveBalance(state) || { ar: 0 },
    exchangeRate: selectArweaveExchangeRates(state),
  };
};

const perform = {
  doHideModal,
  doPurchaseClaimForUri,
  doCheckIfPurchasedClaimId,
  doPlayUri,
};

export default withRouter(connect(select, perform)(PreorderAndPurchaseContent));
