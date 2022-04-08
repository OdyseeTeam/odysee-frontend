import { connect } from 'react-redux';
import { doMembershipMine, doMembershipDeleteData } from 'redux/actions/memberships';
import { withRouter } from 'react-router';
import { selectMembershipMineStarted, selectMembershipForChannelUri } from 'redux/selectors/memberships';
import WalletSendTip from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    fetchStarted: selectMembershipMineStarted(state),
    channelMembership: selectMembershipForChannelUri(state, uri),
  };
};

const perform = {
  doMembershipMine,
  doMembershipDeleteData,
};

export default withRouter(connect(select, perform)(WalletSendTip));
