import { connect } from 'react-redux';
import { selectClaimUriForId } from 'redux/selectors/claims';
import { doFetchOdyseeMembershipForChannelIds } from 'redux/actions/memberships';

import ChannelListItem from './view';

const select = (state, props) => {
  const { channelId } = props;

  return {
    uri: selectClaimUriForId(state, channelId),
  };
};

const perform = {
  doFetchOdyseeMembershipForChannelIds,
};

export default connect(select, perform)(ChannelListItem);
