import { connect } from 'react-redux';

import { selectActiveChannelClaim } from 'redux/selectors/app';
import {
  selectMySupportersList,
  selectMembershipTiersForCreatorId,
  selectIncomingPaymentsBySubscriber,
} from 'redux/selectors/memberships';
import { doResolveClaimIds } from 'redux/actions/claims';

import SupportersTab from './view';

const select = (state) => {
  const activeChannelClaim = selectActiveChannelClaim(state);

  return {
    channelMembershipTiers: activeChannelClaim && selectMembershipTiersForCreatorId(state, activeChannelClaim.claim_id),
    supportersList: selectMySupportersList(state),
    paymentsBySubscriber: selectIncomingPaymentsBySubscriber(state),
  };
};

const perform = {
  doResolveClaimIds,
};

export default connect(select, perform)(SupportersTab);
