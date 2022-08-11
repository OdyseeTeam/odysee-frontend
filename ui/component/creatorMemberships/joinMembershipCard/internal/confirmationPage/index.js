import { connect } from 'react-redux';
import { selectChannelNameForUri } from 'redux/selectors/claims';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { doMembershipBuy } from 'redux/actions/memberships';
import { selectPurchaseIsPendingForMembershipId } from 'redux/selectors/memberships';
import { doToast } from 'redux/actions/notifications';

import ConfirmationPage from './view';

const select = (state, props) => {
  const { uri, selectedTier } = props;

  return {
    channelName: selectChannelNameForUri(state, uri),
    activeChannelClaim: selectActiveChannelClaim(state),
    purchasePending: selectPurchaseIsPendingForMembershipId(state, selectedTier.Membership.id),
  };
};

const perform = {
  doMembershipBuy,
  doToast,
};

export default connect(select, perform)(ConfirmationPage);
