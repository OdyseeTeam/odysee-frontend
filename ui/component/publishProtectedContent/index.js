import { connect } from 'react-redux';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { selectMembershipTiersForCreatorId } from 'redux/selectors/memberships';
import { selectPublishFormValue } from 'redux/selectors/publish';
import { doMembershipContentforStreamClaimId, doMembershipList } from 'redux/actions/memberships';
import PublishProtectedContent from './view';

const select = (state, props) => {
  const incognito = selectIncognito(state);
  const activeChannel = !incognito && selectActiveChannelClaim(state);

  return {
    activeChannel,
    incognito,
    myMembershipTiers: selectMembershipTiersForCreatorId(state, activeChannel?.claim_id),
    type: selectPublishFormValue(state, 'type'),
    liveCreateType: selectPublishFormValue(state, 'liveCreateType'),
    liveEditType: selectPublishFormValue(state, 'liveEditType'),
    memberRestrictionOn: selectPublishFormValue(state, 'memberRestrictionOn'),
    memberRestrictionTierIds: selectPublishFormValue(state, 'memberRestrictionTierIds'),
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
