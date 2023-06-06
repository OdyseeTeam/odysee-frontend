import { connect } from 'react-redux';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import {
  selectProtectedContentMembershipsForClaimId,
  selectMembershipTiersForCreatorId,
} from 'redux/selectors/memberships';
import { selectIsStillEditing, selectPublishFormValue } from 'redux/selectors/publish';
import { doMembershipContentforStreamClaimId, doMembershipList } from 'redux/actions/memberships';
import PublishProtectedContent from './view';

const select = (state, props) => {
  const claim = props.claim;
  const { claim_id: claimId, signing_channel: channelClaim } = claim || {};
  const { claim_id: channelClaimId } = channelClaim || {};

  const incognito = selectIncognito(state);
  const activeChannel = !incognito && selectActiveChannelClaim(state);

  return {
    activeChannel,
    incognito,
    protectedMembershipIds: selectProtectedContentMembershipsForClaimId(state, channelClaimId, claimId),
    myMembershipTiers: selectMembershipTiersForCreatorId(state, activeChannel?.claim_id),
    isStillEditing: selectIsStillEditing(state),
    type: selectPublishFormValue(state, 'type'),
    liveCreateType: selectPublishFormValue(state, 'liveCreateType'),
    liveEditType: selectPublishFormValue(state, 'liveEditType'),
    paywall: selectPublishFormValue(state, 'paywall'),
    visibility: selectPublishFormValue(state, 'visibility'),
  };
};

const perform = (dispatch) => ({
  updatePublishForm: (value) => dispatch(doUpdatePublishForm(value)),
  getMembershipTiersForContentClaimId: (claimId) => dispatch(doMembershipContentforStreamClaimId(claimId)),
  getExistingTiers: (doMembershipListParams) => dispatch(doMembershipList(doMembershipListParams)),
});

export default connect(select, perform)(PublishProtectedContent);
