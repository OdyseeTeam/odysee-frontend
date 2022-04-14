import { connect } from 'react-redux';
import { selectChannelNameForUri } from 'redux/selectors/claims';
import { selectMembershipMineStarted } from 'redux/selectors/memberships';
import { doMembershipBuy } from 'redux/actions/memberships';
import ConfirmationPage from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    channelName: selectChannelNameForUri(state, uri),
    fetchStarted: selectMembershipMineStarted(state),
  };
};

const perform = {
  doMembershipBuy,
};

export default connect(select, perform)(ConfirmationPage);
