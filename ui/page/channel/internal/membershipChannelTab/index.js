import { connect } from 'react-redux';
import {
  selectActiveMembershipForChannelUri,
  selectUserPurchasedMembershipForChannelUri,
} from 'redux/selectors/memberships';
import { selectChannelIdForUri } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';
import WalletSendTip from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    channelId: selectChannelIdForUri(state, uri),
    activeChannelMembership: selectActiveMembershipForChannelUri(state, uri),
    purchasedChannelMembership: selectUserPurchasedMembershipForChannelUri(state, uri),
  };
};

const perform = {
  doOpenModal,
};

export default connect(select, perform)(WalletSendTip);
