import { connect } from 'react-redux';
import { getChannelTitleFromClaim } from 'util/claim';

import {
  selectClaimForUri,
  selectClaimIsMine,
  selectProtectedContentTagForUri,
  selectScheduledStateForUri,
} from 'redux/selectors/claims';
import {
  selectMyProtectedContentMembershipForId,
  selectUserIsMemberOfProtectedContentForId,
  selectPriceOfCheapestPlanForClaimId,
  selectCheapestProtectedContentMembershipForId,
} from 'redux/selectors/memberships';

import { doOpenModal } from 'redux/actions/app';

import ProtectedContentOverlay from './view';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const claimId = claim && claim.claim_id;
  const cheapestPlan = selectCheapestProtectedContentMembershipForId(state, claimId);
  const joinEnabled = cheapestPlan && cheapestPlan.prices.some((p) => p.address);
  return {
    claimIsMine: selectClaimIsMine(state, claim),
    channelName: getChannelTitleFromClaim(claim),
    isProtected: Boolean(selectProtectedContentTagForUri(state, props.uri)),
    scheduledState: selectScheduledStateForUri(state, props.uri),
    userIsAMember: selectUserIsMemberOfProtectedContentForId(state, claimId),
    myMembership: selectMyProtectedContentMembershipForId(state, claimId),
    cheapestPlanPrice: selectPriceOfCheapestPlanForClaimId(state, claimId),
    joinEnabled,
  };
};

const perform = {
  doOpenModal,
};

export default connect(select, perform)(ProtectedContentOverlay);
