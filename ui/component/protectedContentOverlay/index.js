import { connect } from 'react-redux';
import ProtectedContentOverlay from './view';
import { selectClaimForUri, selectClaimIsMine } from 'redux/selectors/claims';
import { selectProtectedContentMembershipsForClaimId, selectMyActiveMembershipIds } from 'redux/selectors/memberships';
import { doOpenModal } from 'redux/actions/app';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const claimId = claim && claim.claim_id;
  const channelId = claim && claim?.signing_channel?.claim_id;

  return {
    claimIsMine: selectClaimIsMine(state, claim),
    claim,
    protectedMembershipIds: selectProtectedContentMembershipsForClaimId(state, channelId, claimId),
    activeMembershipIds: selectMyActiveMembershipIds(state),
  };
};

const perform = (dispatch) => ({
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(ProtectedContentOverlay);
