import { connect } from 'react-redux';
import MembershipTier from './view';
import {
  selectHasCanceledMembershipForMembershipId,
  selectHasMembershipForMembershipId,
  selectHasPendingMembershipForMembershipId,
} from 'redux/selectors/memberships';

const select = (state, props) => ({
  isActive: selectHasMembershipForMembershipId(
    state,
    props.membership.channel_claim_id,
    props.membership.membership_id
  ), // using props.membership
  isPending: selectHasPendingMembershipForMembershipId(
    state,
    props.membership.channel_claim_id,
    props.membership.membership_id
  ),
  isCanceled: selectHasCanceledMembershipForMembershipId(
    state,
    props.membership.channel_claim_id,
    props.membership.membership_id
  ),
});

export default connect(select)(MembershipTier);
