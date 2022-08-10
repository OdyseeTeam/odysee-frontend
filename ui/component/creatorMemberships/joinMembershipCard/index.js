import { connect } from 'react-redux';
import { selectChannelMembershipListByUri } from 'redux/selectors/memberships';
import { selectChannelNameForUri, selectChannelIdForUri } from 'redux/selectors/claims';
import { doMembershipList } from 'redux/actions/memberships';

import PreviewPage from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    creatorMemberships: selectChannelMembershipListByUri(state, uri),
    channelName: selectChannelNameForUri(state, uri),
    channelClaimId: selectChannelIdForUri(state, uri),
  };
};

const perform = {
  doMembershipList,
};

export default connect(select, perform)(PreviewPage);
