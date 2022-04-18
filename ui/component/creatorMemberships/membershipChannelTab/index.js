import { connect } from 'react-redux';
import { doMembershipMine, doMembershipDeleteData } from 'redux/actions/memberships';
import { withRouter } from 'react-router';
import { selectActiveMembershipForChannelUri, selectMyActiveMemberships } from 'redux/selectors/memberships';
import { selectChannelIdForUri } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';
import WalletSendTip from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    channelId: selectChannelIdForUri(state, uri),
    activeChannelMembership: selectActiveMembershipForChannelUri(state, uri),
    myActiveMemberships: selectMyActiveMemberships(state),
    // selectMembershipListByChannelName:
    //   activeMembershipName && selectActiveMembershipForChannelUri(state, activeMembershipName.Membership.channel_name),
  };
};

const perform = {
  doMembershipMine,
  doMembershipDeleteData,
  openModal: doOpenModal,
};

export default withRouter(connect(select, perform)(WalletSendTip));
