import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import { doToast } from 'redux/actions/notifications';
import { doMembershipBuy } from 'redux/actions/memberships';
import { withRouter } from 'react-router';
import { selectMembershipMineStarted } from 'redux/selectors/memberships';
import { selectChannelCanReceiveFiatTipsByUri, selectHasSavedCard } from 'redux/selectors/stripe';
import { doTipAccountCheck, doGetCustomerStatus } from 'redux/actions/stripe';
import WalletSendTip from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    claim: selectClaimForUri(state, uri),
    fetchStarted: selectMembershipMineStarted(state),
    canReceiveFiatTips: selectChannelCanReceiveFiatTipsByUri(state, uri),
    hasSavedCard: selectHasSavedCard(state),
  };
};

const perform = {
  doToast,
  doMembershipBuy,
  doTipAccountCheck,
  doGetCustomerStatus,
};

export default withRouter(connect(select, perform)(WalletSendTip));
