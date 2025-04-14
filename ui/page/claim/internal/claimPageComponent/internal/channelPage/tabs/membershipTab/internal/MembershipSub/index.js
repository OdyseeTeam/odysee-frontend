import { connect } from 'react-redux';
import { selectIndexForCreatorMembership } from 'redux/selectors/memberships';
import { selectChannelClaimIdForUri } from 'redux/selectors/claims';
import { doOpenCancelationModalForMembership } from 'redux/actions/memberships';
import { push } from 'connected-react-router';
import MembershipSub from './view';

const select = (state, props) => {
  const { uri, membershipSub } = props;

  const channelClaimId = selectChannelClaimIdForUri(state, uri);
  // select membership for creator and membershipid
  const membershipId = membershipSub ? membershipSub.membership.id : undefined;
  const membershipIndex = selectIndexForCreatorMembership(state, channelClaimId, membershipId);

  return {
    membershipId: membershipId,
    membershipSub,
    membershipIndex: membershipIndex,
  };
};

const perform = (dispatch) => ({
  doOpenCancelationModalForMembership: (membership) => dispatch(doOpenCancelationModalForMembership(membership)),
  navigate: (path) => dispatch(push(path)),
});

export default connect(select, perform)(MembershipSub);
