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
} from 'redux/selectors/memberships';

import { doOpenModal } from 'redux/actions/app';

import ProtectedContentOverlay from './view';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const claimId = claim && claim.claim_id;

  return {
    claimIsMine: selectClaimIsMine(state, claim),
    channelName: getChannelTitleFromClaim(claim),
    isProtected: Boolean(selectProtectedContentTagForUri(state, props.uri)),
    scheduledState: selectScheduledStateForUri(state, props.uri),
    userIsAMember: selectUserIsMemberOfProtectedContentForId(state, claimId),
    myMembership: selectMyProtectedContentMembershipForId(state, claimId),
    cheapestPlanPrice: selectPriceOfCheapestPlanForClaimId(state, claimId),
  };
};

const perform = {
  doOpenModal,
};

export default connect(select, perform)(ProtectedContentOverlay);
