import { connect } from 'react-redux';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import {
  selectProtectedContentMembershipsForClaimId,
  selectMembershipTiersForChannelId,
  selectMyMembershipTiersWithExclusiveContentPerk,
  selectMyMembershipTiersWithExclusiveLivestreamPerk,
  selectMyMembershipTiersWithMembersOnlyChatPerk,
} from 'redux/selectors/memberships';
import { doGetMembershipTiersForContentClaimId, doMembershipList } from 'redux/actions/memberships';
import PublishProtectedContent from './view';

const select = (state, props) => {
  const claim = props.claim;
  const { claim_id: claimId, signing_channel: channelClaim } = claim || {};
  const { claim_id: channelClaimId } = channelClaim || {};

  const activeChannel = selectActiveChannelClaim(state);

  return {
    activeChannel,
    protectedMembershipIds: selectProtectedContentMembershipsForClaimId(state, channelClaimId, claimId),
    myMembershipTiers: selectMembershipTiersForChannelId(state, activeChannel?.claim_id),
    myMembershipTiersWithExclusiveContentPerk: selectMyMembershipTiersWithExclusiveContentPerk(
      state,
      activeChannel?.claim_id
    ),
    myMembershipTiersWithExclusiveLivestreamPerk: selectMyMembershipTiersWithExclusiveLivestreamPerk(
      state,
      activeChannel?.claim_id
    ),
    myMembershipTiersWithMembersOnlyChatPerk: selectMyMembershipTiersWithMembersOnlyChatPerk(
      state,
      activeChannel?.claim_id
    ),
  };
};

const perform = (dispatch) => ({
  updatePublishForm: (value) => dispatch(doUpdatePublishForm(value)),
  getMembershipTiersForContentClaimId: (claimId) => dispatch(doGetMembershipTiersForContentClaimId(claimId)),
  getExistingTiers: (doMembershipListParams) => dispatch(doMembershipList(doMembershipListParams)),
});

export default connect(select, perform)(PublishProtectedContent);
