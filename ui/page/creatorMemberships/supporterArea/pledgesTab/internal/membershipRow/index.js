import { connect } from 'react-redux';
import { doMembershipList, doMembershipMine } from 'redux/actions/memberships';

import MembershipRow from './view';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectClaimForId } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';
import { selectIndexForCreatorMembership, selectMembershipTiersForChannelUri } from 'redux/selectors/memberships';
import { buildURI } from 'util/lbryURI';

const select = (state, props) => {
  const creatorChannelClaim = selectClaimForId(state, props.membershipSub.membership.channel_claim_id);
  const { membershipSub } = props;

  const creatorChannelUri = creatorChannelClaim
    ? ''
    : buildURI({ channelName: creatorChannelClaim?.name, channelClaimId: creatorChannelClaim?.claim_id });

  // select membership for creator and membershipid
  const membershipId = membershipSub ? membershipSub.membership.id : undefined;
  const index = selectIndexForCreatorMembership(state, creatorChannelClaim?.claim_id, membershipId);

  return {
    activeChannelClaim: selectActiveChannelClaim(state),
    creatorChannelClaim,
    membershipIndex: index,
    creatorChannelUri,
    creatorMemberships: selectMembershipTiersForChannelUri(state, creatorChannelUri),
  };
};

const perform = {
  doMembershipMine,
  doOpenModal,
  doMembershipList,
};

export default connect(select, perform)(MembershipRow);
