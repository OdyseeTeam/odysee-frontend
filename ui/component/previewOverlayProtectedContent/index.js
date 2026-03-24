import { connect } from 'react-redux';
import { getChannelFromClaim } from 'util/claim';

import { selectClaimForUri, selectClaimIsMine, selectProtectedContentTagForUri } from 'redux/selectors/claims';
import {
  selectUserIsMemberOfProtectedContentForId,
  selectPriceOfCheapestPlanForClaimId,
  selectProtectedContentMembershipsForContentClaimId,
} from 'redux/selectors/memberships';

import { doMembershipList } from 'redux/actions/memberships';

import PreviewOverlayProtectedContent from './view';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri);
  const claimId = claim && claim.claim_id;
  const channel = getChannelFromClaim(claim);

  return {
    channel,
    claimIsMine: selectClaimIsMine(state, claim),
    protectedMembershipIds: claimId && selectProtectedContentMembershipsForContentClaimId(state, claimId),
    userIsAMember: selectUserIsMemberOfProtectedContentForId(state, claimId),
    cheapestPlanPrice: selectPriceOfCheapestPlanForClaimId(state, claimId),
    hasProtectedContentTag: Boolean(selectProtectedContentTagForUri(state, props.uri)),
  };
};

const perform = {
  doMembershipList,
};

export default connect(select, perform)(PreviewOverlayProtectedContent);
