import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { doMembershipList } from 'redux/actions/memberships';
import {
  selectUserValidMembershipForChannelUri,
  selectCreatorHasMembershipsByUri,
  selectMembershipTiersForCreatorId,
  selectMembershipTiersForChannelUri,
} from 'redux/selectors/memberships';
import { selectPermanentUrlForUri, selectIsClaimOdyseeChannelForUri } from 'redux/selectors/claims';
import { parseURI } from 'util/lbryURI';
import ShareButton from './view';

const select = (state, props) => {
  const { uri } = props;

  let channelName, channelClaimId;
  try {
    const permanentUrl = selectPermanentUrlForUri(state, uri);
    ({ channelName, channelClaimId } = parseURI(permanentUrl));
  } catch (error) {}

  return {
    validUserMembershipForChannel: selectUserValidMembershipForChannelUri(state, uri), // filtered mine[0]
    creatorHasMemberships: selectCreatorHasMembershipsByUri(state, uri),
    creatorMembershipsFetched: selectMembershipTiersForChannelUri(state, uri),
    creatorTiers: channelClaimId && selectMembershipTiersForCreatorId(state, channelClaimId), //
    isOdyseeChannel: selectIsClaimOdyseeChannelForUri(state, uri),
    channelName,
    channelClaimId,
  };
};

const perform = {
  doOpenModal,
  doMembershipList,
};

export default connect(select, perform)(ShareButton);
