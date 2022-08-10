import { connect } from 'react-redux';
import {
  selectMyActiveMembershipsForCreatorUri,
  selectUserPurchasedMembershipForChannelUri,
} from 'redux/selectors/memberships';
import { selectChannelIdForUri } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';
import WalletSendTip from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    channelId: selectChannelIdForUri(state, uri),
    activeChannelMembership: selectMyActiveMembershipsForCreatorUri(state, uri),
    purchasedChannelMembership: selectUserPurchasedMembershipForChannelUri(state, uri),
  };
};

const perform = {
  doOpenModal,
};

export default connect(select, perform)(WalletSendTip);
