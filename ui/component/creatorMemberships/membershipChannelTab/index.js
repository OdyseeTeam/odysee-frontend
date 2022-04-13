import { connect } from 'react-redux';
import { doMembershipMine, doMembershipDeleteData } from 'redux/actions/memberships';
import { withRouter } from 'react-router';
import { selectActiveMembershipForChannelUri } from 'redux/selectors/memberships';
import { selectChannelIdForUri } from 'redux/selectors/claims';
import WalletSendTip from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    channelId: selectChannelIdForUri(state, uri),
    activeMembershipName: selectActiveMembershipForChannelUri(state, uri),
    // selectMembershipListByChannelName:
    //   activeMembershipName && selectActiveMembershipForChannelUri(state, activeMembershipName.Membership.channel_name),
  };
};

const perform = {
  doMembershipMine,
  doMembershipDeleteData,
};

export default withRouter(connect(select, perform)(WalletSendTip));
