import { connect } from 'react-redux';
import { selectChannelNameForUri } from 'redux/selectors/claims';
import { selectMembershipMineStarted } from 'redux/selectors/memberships';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { doMembershipBuy, doMembershipMine } from 'redux/actions/memberships';
import ConfirmationPage from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    channelName: selectChannelNameForUri(state, uri),
    fetchStarted: selectMembershipMineStarted(state),
    activeChannelClaim: selectActiveChannelClaim(state),
  };
};

const perform = {
  doMembershipBuy,
  doMembershipMine,
};

export default connect(select, perform)(ConfirmationPage);
