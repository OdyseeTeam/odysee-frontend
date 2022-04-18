import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { doMembershipList } from 'redux/actions/memberships';
import {
  selectActiveMembershipNameForChannelUri,
  selectCreatorHasMembershipsByUri,
  selectCreatorMembershipsFetchedByUri,
} from 'redux/selectors/memberships';
import { selectPermanentUrlForUri } from 'redux/selectors/claims';
import ShareButton from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    permanentUrl: selectPermanentUrlForUri(state, uri),
    activeChannelMembershipName: selectActiveMembershipNameForChannelUri(state, uri),
    creatorHasMemberships: selectCreatorHasMembershipsByUri(state, uri),
    creatorMembershipsFetched: selectCreatorMembershipsFetchedByUri(state, uri),
  };
};

const perform = {
  doOpenModal,
  doMembershipList,
};

export default connect(select, perform)(ShareButton);
