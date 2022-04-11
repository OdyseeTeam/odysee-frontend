import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import { doToast } from 'redux/actions/notifications';
import { doMembershipBuy } from 'redux/actions/memberships';
import { withRouter } from 'react-router';
import { selectMembershipMineStarted } from 'redux/selectors/memberships';
import WalletSendTip from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    claim: selectClaimForUri(state, uri),
    fetchStarted: selectMembershipMineStarted(state),
  };
};

const perform = {
  doToast,
  doMembershipBuy,
};

export default withRouter(connect(select, perform)(WalletSendTip));
