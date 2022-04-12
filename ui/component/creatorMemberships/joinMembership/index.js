import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import { doToast } from 'redux/actions/notifications';
import { doMembershipBuy } from 'redux/actions/memberships';
import { withRouter } from 'react-router';
import { selectMembershipMineStarted } from 'redux/selectors/memberships';
import { selectCanReceiveFiatTipsById, selectHasSavedCard } from 'redux/selectors/stripe';
import { doTipAccountCheck, doAccountTipStatus } from 'redux/actions/stripe';
import WalletSendTip from './view';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const { claim_id: claimId } = claim || {};

  return {
    claim,
    fetchStarted: selectMembershipMineStarted(state),
    canReceiveFiatTips: selectCanReceiveFiatTipsById(state, claimId),
    hasSavedCard: selectHasSavedCard(state),
  };
};

const perform = {
  doToast,
  doMembershipBuy,
  doTipAccountCheck,
  doAccountTipStatus,
};

export default withRouter(connect(select, perform)(WalletSendTip));
