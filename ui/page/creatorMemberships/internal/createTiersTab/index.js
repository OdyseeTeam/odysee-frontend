import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { selectBankAccountConfirmed } from 'redux/selectors/stripe';
import { selectMyMembershipTiers, selectMembershipTiersForChannelId } from 'redux/selectors/memberships';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { doMembershipList, doGetMembershipPerks, doMembershipAddTier } from 'redux/actions/memberships';

import MembershipsPage from './view';

const select = (state) => {
  const activeChannel = selectActiveChannelClaim(state);

  return {
    bankAccountConfirmed: selectBankAccountConfirmed(state),
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
};

export default connect(select, perform)(MembershipsPage);
