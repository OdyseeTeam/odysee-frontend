import { connect } from 'react-redux';
import { doMembershipMine } from 'redux/actions/memberships';
import { withRouter } from 'react-router';
import { selectMyActiveMembershipsForCreatorId, selectMyActiveMemberships, selectUserPurchasedMembershipForChannelUri } from 'redux/selectors/memberships';
import { selectChannelIdForUri } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';
import WalletSendTip from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    channelId: selectChannelIdForUri(state, uri),
    activeChannelMembership: selectMyActiveMembershipsForCreatorId(state, uri),
    purchasedChannelMembership: selectUserPurchasedMembershipForChannelUri(state, uri),
    myActiveMemberships: selectMyActiveMemberships(state) && Object.values(selectMyActiveMemberships(state)),
    // selectMembershipListByChannelName:
    //   activeMembershipName && selectMyActiveMembershipsForCreatorId(state, activeMembershipName.Membership.channel_name),
  };
};

const perform = {
  doMembershipMine,
  openModal: doOpenModal,
};

export default withRouter(connect(select, perform)(WalletSendTip));
