import { connect } from 'react-redux';
import PreviewOverlayProtectedContent from './view';
import { selectClaimForUri, selectClaimIsMine } from 'redux/selectors/claims';
import { selectProtectedContentMembershipsForClaimId, selectMyValidMembershipIds } from 'redux/selectors/memberships';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const claimId = claim && claim.claim_id;
  const channelId = claim && claim?.signing_channel?.claim_id;

  return {
    claimIsMine: selectClaimIsMine(state, claim),
    claim,
    protectedMembershipIds: selectProtectedContentMembershipsForClaimId(state, channelId, claimId),
    validMembershipIds: selectMyValidMembershipIds(state),
  };
};

export default connect(select, null)(PreviewOverlayProtectedContent);
