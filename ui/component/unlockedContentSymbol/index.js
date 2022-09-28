import { connect } from 'react-redux';
import UnlockedContentSymbol from './view';
import { selectClaimForUri, selectClaimIsMine, selectProtectedContentTagForUri } from 'redux/selectors/claims';
import {
  selectProtectedContentMembershipsForClaimId,
  selectMyValidMembershipIds,
  selectMembershipTiersForChannelId,
} from 'redux/selectors/memberships';
import { doOpenModal } from 'redux/actions/app';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const claimId = claim && claim.claim_id;
  const channelId = claim && claim?.signing_channel?.claim_id;

  return {
    claimIsMine: selectClaimIsMine(state, claim),
    claim,
    protectedMembershipIds: selectProtectedContentMembershipsForClaimId(state, channelId, claimId),
    validMembershipIds: selectMyValidMembershipIds(state),
    isProtected: Boolean(selectProtectedContentTagForUri(state, props.uri)),
    channelMemberships: selectMembershipTiersForChannelId(state, channelId),
  };
};

const perform = (dispatch) => ({
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(UnlockedContentSymbol);
