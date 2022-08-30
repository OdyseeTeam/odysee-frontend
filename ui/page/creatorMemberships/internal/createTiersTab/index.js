import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { selectAccountChargesEnabled } from 'redux/selectors/stripe';
import { selectMyMembershipTiers, selectMembershipTiersForChannelId } from 'redux/selectors/memberships';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import {
  doMembershipList,
  doGetMembershipPerks,
  doMembershipAddTier,
  doDeactivateMembershipForId,
} from 'redux/actions/memberships';
import { doToast } from 'redux/actions/notifications';

import MembershipsPage from './view';

const select = (state) => {
  const activeChannel = selectActiveChannelClaim(state);

  return {
    bankAccountConfirmed: selectAccountChargesEnabled(state),
    activeChannel,
    membershipPerks: selectMyMembershipTiers(state),
    creatorMemberships: selectMembershipTiersForChannelId(state, activeChannel?.claim_id),
  };
};

const perform = {
  doOpenModal,
  doMembershipList,
  doGetMembershipPerks,
  doMembershipAddTier,
  doDeactivateMembershipForId,
  doToast,
};

export default connect(select, perform)(MembershipsPage);
