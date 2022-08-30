import { connect } from 'react-redux';
import {
  selectStakedLevelForChannelUri,
  selectClaimForUri,
  selectClaimsByUri,
  selectTitleForUri,
  selectDateForUri,
} from 'redux/selectors/claims';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectOdyseeMembershipForChannelId, selectCreatorIdMembershipForChannelId } from 'redux/selectors/memberships';
import { getChannelIdFromClaim } from 'util/claim';

import ChatComment from './view';

const select = (state, props) => {
  const { uri, comment } = props;
  const { channel_url: authorUri, channel_id: channelId } = comment;
  const authorTitle = selectTitleForUri(state, authorUri);
  const channelAge = selectDateForUri(state, authorUri);

  const claim = selectClaimForUri(state, uri);

  return {
    claim,
    stakedLevel: selectStakedLevelForChannelUri(state, authorUri),
    claimsByUri: selectClaimsByUri(state),
    odyseeMembership: selectOdyseeMembershipForChannelId(state, channelId),
    creatorMembership: selectCreatorIdMembershipForChannelId(state, getChannelIdFromClaim(claim), channelId),
    activeChannelClaim: selectActiveChannelClaim(state),
    authorTitle,
    channelAge,
  };
};

const perform = {};

export default connect(select, perform)(ChatComment);
