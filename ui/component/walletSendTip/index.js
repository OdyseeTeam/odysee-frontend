import { connect } from 'react-redux';
import {
  selectTitleForUri,
  selectClaimForUri,
  selectClaimIsMineForUri,
  selectFetchingMyChannels,
} from 'redux/selectors/claims';
import { doHideModal } from 'redux/actions/app';
import { doSendTip } from 'redux/actions/wallet';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectBalance, selectIsSendingSupport } from 'redux/selectors/wallet';
import { withRouter } from 'react-router';
import * as SETTINGS from 'constants/settings';
import { getChannelIdFromClaim, getChannelNameFromClaim } from 'util/claim';
import WalletSendTip from './view';
import { selectAccountCheckIsFetchingForId, selectArweaveTipDataForId } from 'redux/selectors/stripe';
import { doArTip } from 'redux/actions/arwallet';
import { doToast } from 'redux/actions/notifications';
import { selectArweaveTippingErrorForId, selectArweaveTippingStartedForId } from 'redux/selectors/arwallet';
import { doTipAccountCheckForUri } from 'redux/actions/stripe';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri, false);
  const { claim_id: claimId, value_type: claimType } = claim || {};

  // setup variables for backend tip API
  const channelClaimId = getChannelIdFromClaim(claim);
  const tipChannelName = getChannelNameFromClaim(claim);

  const activeChannelClaim = selectActiveChannelClaim(state);
  const { name: activeChannelName, claim_id: activeChannelId } = activeChannelClaim || {};

  const tipData = selectArweaveTipDataForId(state, channelClaimId);
  const canReceiveTips = tipData?.status === 'active' && tipData?.default;

  return {
    activeChannelName,
    activeChannelId,
    balance: selectBalance(state),
    claimId,
    claimType,
    channelClaimId,
    tipChannelName,
    claimIsMine: selectClaimIsMineForUri(state, uri),
    fetchingChannels: selectFetchingMyChannels(state),
    incognito: selectIncognito(state),
    instantTipEnabled: selectClientSetting(state, SETTINGS.INSTANT_PURCHASE_ENABLED),
    instantTipMax: selectClientSetting(state, SETTINGS.INSTANT_PURCHASE_MAX),
    isPending: selectIsSendingSupport(state),
    title: selectTitleForUri(state, uri),
    canReceiveTips,
    arweaveTipData: selectArweaveTipDataForId(state, channelClaimId),
    isArweaveTipping: selectArweaveTippingStartedForId(state, claimId),
    arweaveTippingError: selectArweaveTippingErrorForId(state, claimId),
    checkingAccount: selectAccountCheckIsFetchingForId(state, claimId),
  };
};

const perform = {
  doHideModal,
  doSendTip,
  doArTip,
  doToast,
  doTipAccountCheckForUri,
};

export default withRouter(connect(select, perform)(WalletSendTip));
