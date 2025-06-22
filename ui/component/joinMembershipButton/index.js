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
  selectPermanentUrlForUri,
  selectIsClaimOdyseeChannelForUri,
  selectChannelForClaimUri, selectChannelClaimIdForUri,
} from 'redux/selectors/claims';
import { parseURI } from 'util/lbryURI';
import ShareButton from './view';
import { selectArweaveTipDataForId } from '../../redux/selectors/stripe';

const select = (state, props) => {
  const { uri } = props;

  const channelUri = selectChannelForClaimUri(state, uri);
  const channelId = selectChannelClaimIdForUri(state, uri);
  let channelName, channelClaimId;
  try {
    const permanentUrl = selectPermanentUrlForUri(state, channelUri);
    ({ channelName, channelClaimId } = parseURI(permanentUrl));
  } catch (error) {}

  return {
    validUserMembershipForChannel: selectUserValidMembershipForChannelUri(state, uri), // filtered mine[0]
    creatorHasMemberships: selectCreatorHasMembershipsByUri(state, uri),
    creatorMembershipsFetched: selectArEnabledMembershipTiersForChannelUri(state, uri),
    creatorTiers: channelId && selectMembershipTiersForCreatorId(state, channelId || channelClaimId), //
    isOdyseeChannel: selectIsClaimOdyseeChannelForUri(state, uri),
    tipsEnabled: selectArweaveTipDataForId(state, channelClaimId),
    channelName,
    channelClaimId,
    channelUri,
  };
};

const perform = {
  doOpenModal,
  doMembershipList,
};

export default connect(select, perform)(ShareButton);
