import { connect } from 'react-redux';
import { selectChannelNameForUri } from 'redux/selectors/claims';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { doMembershipBuy } from 'redux/actions/memberships';
import { doToast } from 'redux/actions/notifications';

import ConfirmationPage from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    channelName: selectChannelNameForUri(state, uri),
    activeChannelClaim: selectActiveChannelClaim(state),
  };
};

const perform = {
  doMembershipBuy,
  doToast,
};

export default connect(select, perform)(ConfirmationPage);
