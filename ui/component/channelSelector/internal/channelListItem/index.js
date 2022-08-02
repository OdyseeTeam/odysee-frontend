import { connect } from 'react-redux';
import { selectClaimIdForUri } from 'redux/selectors/claims';
import { doFetchOdyseeMembershipForChannelIds } from 'redux/actions/memberships';

import ChannelListItem from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    claimId: selectClaimIdForUri(state, uri),
  };
};

const perform = {
  doFetchOdyseeMembershipForChannelIds,
};

export default connect(select, perform)(ChannelListItem);
