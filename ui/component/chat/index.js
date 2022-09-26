import { connect } from 'react-redux';
import { MAX_LIVESTREAM_COMMENTS } from 'constants/livestream';
import { doResolveUris } from 'redux/actions/claims';
import { selectClaimForUri, selectedRestrictedCommentsChatTagForUri } from 'redux/selectors/claims';
import { doCommentList, doHyperChatList, setLivestreamChatMembersOnlyCreatorSetting } from 'redux/actions/comments';
import {
  selectTopLevelCommentsForUri,
  selectHyperChatsForUri,
  selectPinnedCommentsForUri,
} from 'redux/selectors/comments';
import {
  doFetchOdyseeMembershipForChannelIds,
  doFetchChannelMembershipsForChannelIds,
} from 'redux/actions/memberships';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { getChannelIdFromClaim } from 'util/claim';

import ChatLayout from './view';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri);

  const activeChannelClaim = selectActiveChannelClaim(state);
  const activeChannelId = activeChannelClaim?.claim_id;

  return {
    activeChannelClaim,
    activeChannelId,
    claimId: claim && claim.claim_id,
    comments: selectTopLevelCommentsForUri(state, uri, MAX_LIVESTREAM_COMMENTS),
    pinnedComments: selectPinnedCommentsForUri(state, uri),
    superChats: selectHyperChatsForUri(state, uri),
    channelId: getChannelIdFromClaim(claim),
    chatCommentsRestrictedToChannelMembers: Boolean(selectedRestrictedCommentsChatTagForUri(state, uri)),
  };
};

const perform = {
  doCommentList,
  doHyperChatList,
  doResolveUris,
  doFetchOdyseeMembershipForChannelIds,
  doFetchChannelMembershipsForChannelIds,
  setLivestreamChatMembersOnlyCreatorSetting,
};

export default connect(select, perform)(ChatLayout);
