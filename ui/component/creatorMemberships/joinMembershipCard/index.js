import { connect } from 'react-redux';
import { selectChannelNameForUri } from 'redux/selectors/claims';
import { doToast } from 'redux/actions/notifications';
import { doMembershipBuy } from 'redux/actions/memberships';
import { withRouter } from 'react-router';
import { selectMembershipMineStarted } from 'redux/selectors/memberships';
import { selectChannelCanReceiveFiatTipsByUri, selectHasSavedCard } from 'redux/selectors/stripe';
import { doTipAccountCheckForUri, doGetCustomerStatus } from 'redux/actions/stripe';
import WalletSendTip from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    channelName: selectChannelNameForUri(state, uri),
    fetchStarted: selectMembershipMineStarted(state),
    canReceiveFiatTips: selectChannelCanReceiveFiatTipsByUri(state, uri),
    hasSavedCard: selectHasSavedCard(state),
  };
};

const perform = {
  doToast,
  doMembershipBuy,
  doTipAccountCheckForUri,
  doGetCustomerStatus,
};

export default withRouter(connect(select, perform)(WalletSendTip));
