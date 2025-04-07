import { connect } from 'react-redux';
import MembershipTier from './view';
import { selectHasMembershipForMembershipId } from 'redux/selectors/memberships';

const select = (state, props) => ({
  hasMembership: selectHasMembershipForMembershipId(
    state,
    props.membership.channel_claim_id,
    props.membership.membership_id
  ), // using props.membership
});

export default connect(select)(MembershipTier);
