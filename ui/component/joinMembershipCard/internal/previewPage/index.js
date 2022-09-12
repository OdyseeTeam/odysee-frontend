import { connect } from 'react-redux';
import { selectCanReceiveFiatTipsForUri } from 'redux/selectors/stripe';
import { selectMembershipTiersForChannelUri, selectMembershipTiersForChannelId } from 'redux/selectors/memberships';
import { doTipAccountCheckForUri } from 'redux/actions/stripe';
import { selectIsChannelMineForClaimId, selectClaimForUri } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';
import PreviewPage from './view';
import { getChannelNameFromClaim } from 'util/claim';

const select = (state, props) => {
  const { uri } = props;
  const { claim_id: claimId } = selectClaimForUri(state, props.uri) || {};
  const claim = selectClaimForUri(state, props.uri);

  const channelTitle = getChannelNameFromClaim(claim);

  let channelUri = null;
  if (claim) {
    channelUri = claim.canonical_url;
  }

  return {
    canReceiveFiatTips: selectCanReceiveFiatTipsForUri(state, uri),
    creatorMemberships: selectMembershipTiersForChannelUri(state, uri),
    membershipTiers: selectMembershipTiersForChannelId(state, claimId),
    channelIsMine: selectIsChannelMineForClaimId(state, claimId),
    channelTitle,
    channelUri,
    channelId: claimId,
  };
};

const perform = (dispatch) => ({
  doTipAccountCheckForUri,
  doOpenModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(PreviewPage);
