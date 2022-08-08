import { connect } from 'react-redux';
import { MAX_LIVESTREAM_COMMENTS } from 'constants/livestream';
import { doResolveUris } from 'redux/actions/claims';
import { selectClaimForUri, selectClaimsByUri } from 'redux/selectors/claims';
import { doCommentList, doSuperChatList } from 'redux/actions/comments';
import {
  selectTopLevelCommentsForUri,
  selectSuperChatsForUri,
  selectPinnedCommentsForUri,
} from 'redux/selectors/comments';
import { selectThemePath } from 'redux/selectors/settings';
import { doFetchOdyseeMembershipsById, doFetchChannelMembershipsByIds } from 'redux/actions/memberships';
import LivestreamChatLayout from './view';
import { getChannelIdFromClaim } from 'util/claim';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri);

  return {
    claimId: claim && claim.claim_id,
    comments: selectTopLevelCommentsForUri(state, uri, MAX_LIVESTREAM_COMMENTS),
    pinnedComments: selectPinnedCommentsForUri(state, uri),
    superChats: selectSuperChatsForUri(state, uri),
    theme: selectThemePath(state),
    claimsByUri: selectClaimsByUri(state),
    channelId: getChannelIdFromClaim(claim),
  };
};

const perform = {
  doCommentList,
  doSuperChatList,
  doResolveUris,
  doFetchOdyseeMembershipsById,
  doFetchChannelMembershipsByIds,
};

export default connect(select, perform)(LivestreamChatLayout);
