import { connect } from 'react-redux';
import { doMembershipMine } from 'redux/actions/memberships';

import MembershipRow from './view';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectClaimForId } from 'redux/selectors/claims';

const select = (state, props) => {
  const creatorChannelClaim = selectClaimForId(state, props.membershipSub.membership.channel_claim_id);
  return {
    activeChannelClaim: selectActiveChannelClaim(state),
    creatorChannelClaim,
  };
};

const perform = {
  doMembershipMine,
};

export default connect(select, perform)(MembershipRow);
