import { connect } from 'react-redux';
import { makeSelectPublishFormValue } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import {
  selectClaimForUri,
} from 'redux/selectors/claims';
import { selectProtectedContentMembershipsForClaimId } from 'redux/selectors/memberships';
import PublishProtectedContent from './view';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const { claim_id: claimId, signing_channel: channelClaim } = claim || {};
  const { claim_id: channelClaimId } = channelClaim || {};

  return {
    activeChannel: selectActiveChannelClaim(state),
    protectedMembershipIds: selectProtectedContentMembershipsForClaimId(state, channelClaimId, claimId),
  };
};

const perform = (dispatch) => ({
  updatePublishForm: (value) => dispatch(doUpdatePublishForm(value)),

});

export default connect(select, perform)(PublishProtectedContent);
