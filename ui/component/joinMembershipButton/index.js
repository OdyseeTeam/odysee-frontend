import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { doMembershipList } from 'redux/actions/memberships';
import {
  selectUserValidMembershipForChannelUri,
  selectCreatorHasMembershipsByUri,
  selectCreatorMembershipsFetchedByUri,
  selectMembershipTiersForCreatorId,
} from 'redux/selectors/memberships';
import { selectPermanentUrlForUri, selectIsClaimOdyseeChannelForUri } from 'redux/selectors/claims';
import { parseURI } from 'util/lbryURI';
import ShareButton from './view';

const select = (state, props) => {
  const { uri } = props;
  const permanentUrl = selectPermanentUrlForUri(state, uri);

  let channelClaimId;
  try {
    ({ channelClaimId } = parseURI(permanentUrl));
  } catch (error) {}

  return {
    permanentUrl,
    validUserMembershipForChannel: selectUserValidMembershipForChannelUri(state, uri),
    creatorHasMemberships: selectCreatorHasMembershipsByUri(state, uri),
    creatorMembershipsFetched: selectCreatorMembershipsFetchedByUri(state, uri),
    creatorTiers: channelClaimId && selectMembershipTiersForCreatorId(state, channelClaimId),
    isOdyseeChannel: selectIsClaimOdyseeChannelForUri(state, uri),
  };
};

const perform = {
  doOpenModal,
  doMembershipList,
};

export default connect(select, perform)(ShareButton);
