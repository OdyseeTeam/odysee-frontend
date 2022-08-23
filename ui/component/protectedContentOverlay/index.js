import { connect } from 'react-redux';
import { selectClaimIsMine, selectClaimForUri } from 'redux/selectors/claims';
import ProtectedContentOverlay from './view';
import { selectProtectedContentMembershipsForClaimId } from 'redux/selectors/memberships';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const claimId = claim && claim.claim_id;
  const channelId = claim && claim?.signing_channel?.claim_id;

  return {
    claim,
    protectedMembershipIds: selectProtectedContentMembershipsForClaimId(state, channelId, claimId),
  };
};

export default connect(select, null)(ProtectedContentOverlay);
