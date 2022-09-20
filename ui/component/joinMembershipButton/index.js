import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { doMembershipList } from 'redux/actions/memberships';
import {
  selectUserValidMembershipForChannelUri,
  selectCreatorHasMembershipsByUri,
  selectCreatorMembershipsFetchedByUri,
  selectMembershipTiersForChannelId,
} from 'redux/selectors/memberships';
import { selectPermanentUrlForUri } from 'redux/selectors/claims';
import { parseURI } from 'util/lbryURI';
import ShareButton from './view';

const select = (state, props) => {
  const { uri } = props;
  const permanentUrl = selectPermanentUrlForUri(state, uri);
  const { channelClaimId } = parseURI(permanentUrl || '');

  return {
    permanentUrl,
    validUserMembershipForChannel: selectUserValidMembershipForChannelUri(state, uri),
    creatorHasMemberships: selectCreatorHasMembershipsByUri(state, uri),
    creatorMembershipsFetched: selectCreatorMembershipsFetchedByUri(state, uri),
    creatorTiers: selectMembershipTiersForChannelId(state, channelClaimId),
  };
};

const perform = {
  doOpenModal,
  doMembershipList,
};

export default connect(select, perform)(ShareButton);
