import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { doMembershipList } from 'redux/actions/memberships';
import {
  selectActiveMembershipNameForChannelUri,
  selectCreatorHasMembershipsById,
  selectCreatorMembershipsFetchedById,
} from 'redux/selectors/memberships';
import { parseURI } from 'util/lbryURI';
import ShareButton from './view';

const select = (state, props) => {
  const { uri, permanentUrl } = props;

  const { channelClaimId } = parseURI(permanentUrl);

  return {
    activeChannelMembershipName: selectActiveMembershipNameForChannelUri(state, uri),
    creatorHasMemberships: selectCreatorHasMembershipsById(state, channelClaimId),
    creatorMembershipsFetched: selectCreatorMembershipsFetchedById(state, channelClaimId),
  };
};

const perform = {
  doOpenModal,
  doMembershipList,
};

export default connect(select, perform)(ShareButton);
