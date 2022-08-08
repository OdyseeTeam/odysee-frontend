import { connect } from 'react-redux';
import {
  selectStakedLevelForChannelUri,
  selectClaimForUri,
  selectMyClaimIdsRaw,
  selectClaimsByUri,
  selectOdyseeMembershipForChannelId,
  selectMembershipForChannelId,
} from 'redux/selectors/claims';

import LivestreamComment from './view';

const select = (state, props) => {
  const { uri, comment } = props;
  const { channel_url: authorUri, channel_id: channelId } = comment;

  return {
    claim: selectClaimForUri(state, uri),
    stakedLevel: selectStakedLevelForChannelUri(state, authorUri),
    myChannelIds: selectMyClaimIdsRaw(state),
    claimsByUri: selectClaimsByUri(state),
    odyseeMembership: selectOdyseeMembershipForChannelId(state, channelId),
    membership: channelId && selectMembershipForChannelId(state, channelId),
  };
};

const perform = {};

export default connect(select, perform)(LivestreamComment);
