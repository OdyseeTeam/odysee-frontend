import { connect } from 'react-redux';
import { doMembershipMine, doMembershipDeleteData } from 'redux/actions/memberships';
import { withRouter } from 'react-router';
import { selectMembershipMineStarted, selectActiveMembershipForChannelUri } from 'redux/selectors/memberships';
import { doOpenModal } from 'redux/actions/app';
import WalletSendTip from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    fetchStarted: selectMembershipMineStarted(state),
    activeMembershipName: selectActiveMembershipForChannelUri(state, uri),
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
