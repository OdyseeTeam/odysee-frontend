import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doMembershipBuy } from 'redux/actions/memberships';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectMyChannelClaims } from 'redux/selectors/claims';
import { selectPurchaseIsPendingForMembershipId } from 'redux/selectors/memberships';
import { doToast } from 'redux/actions/notifications';

import ConfirmOdyseeMembershipPurchase from './view';

const select = (state, props) => {
  const { membership } = props;

  return {
    activeChannelClaim: selectActiveChannelClaim(state),
    channels: selectMyChannelClaims(state),
    incognito: selectIncognito(state),
    purchasePending: selectPurchaseIsPendingForMembershipId(state, membership.membership_id),
  };
};

const perform = {
  doHideModal,
  doMembershipBuy,
  doToast,
};

export default connect(select, perform)(ConfirmOdyseeMembershipPurchase);
