import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { selectBankAccountConfirmed } from 'redux/selectors/stripe';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { doMembershipList, doGetMembershipPerks, doMembershipAddTier } from 'redux/actions/memberships';

import MembershipsPage from './view';

const select = (state) => ({
  bankAccountConfirmed: selectBankAccountConfirmed(state),
  activeChannel: selectActiveChannelClaim(state),
});

const perform = {
  doOpenModal,
  doMembershipList,
  doGetMembershipPerks,
  doMembershipAddTier,
};

export default connect(select, perform)(MembershipsPage);
