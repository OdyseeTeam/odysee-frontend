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
} from 'redux/selectors/claims';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { doPlayUri } from 'redux/actions/content';
import { doHideModal } from 'redux/actions/app';
import { doCheckIfPurchasedClaimId } from 'redux/actions/stripe';
import { doPurchaseClaimForUri } from 'redux/actions/wallet';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import { selectArweaveTipDataForId } from 'redux/selectors/stripe';
import { getChannelIdFromClaim } from 'util/claim';
import PreorderAndPurchaseContent from './view';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri, false);
  const { claim_id: claimId, value_type: claimType } = claim || {};

  const channelClaimId = getChannelIdFromClaim(claim);
  const tipData = selectArweaveTipDataForId(state, channelClaimId);
  const canReceiveTips = tipData?.status === 'active' && tipData?.default;

  return {
    claimId,
    claimType,
    canReceiveTips,
    preferredCurrency: selectPreferredCurrency(state),
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
