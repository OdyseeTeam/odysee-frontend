import { connect } from 'react-redux';
import {
  selectStakedLevelForChannelUri,
  selectClaimForUri,
  selectMyClaimIdsRaw,
  selectClaimsByUri,
  selectOdyseeMembershipForChannelId,
  selectTitleForUri,
} from 'redux/selectors/claims';

import ChatComment from './view';

const select = (state, props) => {
  const { uri, comment } = props;
  const { channel_url: authorUri, channel_id: channelId } = comment;
  const authorTitle = selectTitleForUri(state, authorUri);

  return {
    claim: selectClaimForUri(state, uri),
    stakedLevel: selectStakedLevelForChannelUri(state, authorUri),
    myChannelIds: selectMyClaimIdsRaw(state),
    claimsByUri: selectClaimsByUri(state),
    odyseeMembership: selectOdyseeMembershipForChannelId(state, channelId),
    authorTitle,
  };
};

const perform = {};

export default connect(select, perform)(ChatComment);
