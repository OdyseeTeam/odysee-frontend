import { connect } from 'react-redux';
import PreviewOverlayProtectedContent from './view';
import { selectClaimForUri, selectClaimIsMine } from 'redux/selectors/claims';
import {
  selectUserIsMemberOfProtectedContentForId,
  selectPriceOfCheapestPlanForClaimId,
  selectProtectedContentMembershipsForClaimId,
} from 'redux/selectors/memberships';
import { getChannelIdFromClaim } from 'util/claim';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri);
  const claimId = claim && claim.claim_id;
  const channelId = getChannelIdFromClaim(claim);

  return {
    claimIsMine: selectClaimIsMine(state, claim),
    protectedMembershipIds: selectProtectedContentMembershipsForClaimId(state, channelId, claimId),
    userIsAMember: selectUserIsMemberOfProtectedContentForId(state, claimId),
    cheapestPlanPrice: selectPriceOfCheapestPlanForClaimId(state, claimId),
  };
};

export default connect(select)(PreviewOverlayProtectedContent);
