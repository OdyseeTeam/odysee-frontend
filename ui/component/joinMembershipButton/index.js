import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { doMembershipList } from 'redux/actions/memberships';
import {
  selectUserValidMembershipForChannelUri,
  selectCreatorHasMembershipsByUri,
  selectMembershipTiersForCreatorId,
  selectArEnabledMembershipTiersForChannelUri,
} from 'redux/selectors/memberships';
import {
  selectIsClaimOdyseeChannelForUri,
  selectChannelForClaimUri,
  selectChannelClaimIdForUri,
  selectClaimForUri,
} from 'redux/selectors/claims';
import ShareButton from './view';

const select = (state, props) => {
  const { uri } = props;

  const channelClaim = selectClaimForUri(state, uri);
  const channelUri = selectChannelForClaimUri(state, uri);
  const channelId = selectChannelClaimIdForUri(state, uri);

  const channelClaimId = channelClaim?.claim_id;

  return {
    validUserMembershipForChannel: selectUserValidMembershipForChannelUri(state, uri), // filtered mine[0]
    creatorHasMemberships: selectCreatorHasMembershipsByUri(state, uri),
    creatorMembershipsFetched: selectArEnabledMembershipTiersForChannelUri(state, uri),
    creatorTiers: channelId && selectMembershipTiersForCreatorId(state, channelId || channelClaimId), //
    isOdyseeChannel: selectIsClaimOdyseeChannelForUri(state, uri),
    channelName: channelClaim?.name,
    channelClaimId: channelClaim?.claim_id,
    channelUri,
    channelId,
  };
};

const perform = {
  doOpenModal,
  doMembershipList,
};

export default connect(select, perform)(ShareButton);
