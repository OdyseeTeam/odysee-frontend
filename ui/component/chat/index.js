import { connect } from 'react-redux';
import { MAX_LIVESTREAM_COMMENTS } from 'constants/livestream';
import { doResolveUris } from 'redux/actions/claims';
import { selectClaimForUri, selectMyChannelClaims } from 'redux/selectors/claims';
import { doCommentList, doCommentListForId, doHyperChatList, doHyperChatListForId } from 'redux/actions/comments';
import {
  selectCommentsById,
  selectTopLevelCommentsForUri,
  selectHyperChatsForUri,
  selectPinnedCommentsForUri,
  selectLivestreamChatMembersOnlyForChannelId,
} from 'redux/selectors/comments';
import {
  doFetchOdyseeMembershipForChannelIds,
  doFetchChannelMembershipsForChannelIds,
  doListAllMyMembershipTiers,
} from 'redux/actions/memberships';
import {
  selectNoRestrictionOrUserIsMemberForContentClaimId,
  selectNoRestrictionOrUserCanChatForCreatorId,
  selectUserIsMemberOfMembersOnlyChatForCreatorId,
} from 'redux/selectors/memberships';
import { getChannelIdFromClaim, getChannelTitleFromClaim } from 'util/claim';

import ChatLayout from './view';

const select = (state, props) => {
  const { uri, claimIdOverride, channelIdOverride, channelTitleOverride, contentUnlockedOverride } = props;

  if (claimIdOverride) {
    const commentsState = state.comments || {};
    const commentById = selectCommentsById(state) || {};
    const topLevelById = commentsState.topLevelCommentsById || {};
    const pinnedById = commentsState.pinnedCommentsById || {};
    const topLevelIds = topLevelById[claimIdOverride] || [];
    const pinnedIds = pinnedById[claimIdOverride] || [];
    const channelId = channelIdOverride || undefined;

    return {
      claimId: claimIdOverride,
      comments: topLevelIds.map((cid) => commentById[cid]).filter(Boolean),
      pinnedComments: pinnedIds.map((cid) => commentById[cid]).filter(Boolean),
      superChats: selectHyperChatsForUri(state, uri),
      channelId,
      channelTitle: channelTitleOverride || __('YouTube'),
      myChannelClaims: selectMyChannelClaims(state),
      contentUnlocked: contentUnlockedOverride !== undefined ? contentUnlockedOverride : true,
      isLivestreamChatMembersOnly: channelId ? selectLivestreamChatMembersOnlyForChannelId(state, channelId) : false,
      userHasMembersOnlyChatPerk: channelId ? selectUserIsMemberOfMembersOnlyChatForCreatorId(state, channelId) : false,
      chatUnlocked: channelId ? selectNoRestrictionOrUserCanChatForCreatorId(state, channelId) : true,
      claimIdOverride,
    };
  }

  const claim = selectClaimForUri(state, uri);
  const claimId = claim && claim.claim_id;
  const channelId = getChannelIdFromClaim(claim);

  return {
    claimId,
    comments: selectTopLevelCommentsForUri(state, uri, MAX_LIVESTREAM_COMMENTS),
    pinnedComments: selectPinnedCommentsForUri(state, uri),
    superChats: selectHyperChatsForUri(state, uri),
    channelId,
    channelTitle: getChannelTitleFromClaim(claim),
    myChannelClaims: selectMyChannelClaims(state),
    contentUnlocked: claimId && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId),
    isLivestreamChatMembersOnly: selectLivestreamChatMembersOnlyForChannelId(state, channelId),
    userHasMembersOnlyChatPerk: selectUserIsMemberOfMembersOnlyChatForCreatorId(state, channelId),
    chatUnlocked: channelId && selectNoRestrictionOrUserCanChatForCreatorId(state, channelId),
    claimIdOverride,
  };
};

const perform = (dispatch, ownProps) => ({
  doCommentList: (uri, parentId, page, pageSize, sortBy, isLivestream) =>
    dispatch(
      ownProps.claimIdOverride
        ? doCommentListForId(ownProps.claimIdOverride, parentId, page, pageSize, sortBy)
        : doCommentList(uri, parentId, page, pageSize, sortBy, isLivestream)
    ),
  doHyperChatList: (uri) =>
    dispatch(ownProps.claimIdOverride ? doHyperChatListForId(ownProps.claimIdOverride, uri) : doHyperChatList(uri)),
  doResolveUris: (uris, cache) => dispatch(doResolveUris(uris, cache)),
  doFetchOdyseeMembershipForChannelIds: (claimIds) => dispatch(doFetchOdyseeMembershipForChannelIds(claimIds)),
  doFetchChannelMembershipsForChannelIds: (channelId, claimIds) =>
    dispatch(doFetchChannelMembershipsForChannelIds(channelId, claimIds)),
  doListAllMyMembershipTiers: () => dispatch(doListAllMyMembershipTiers()),
});

export default connect(select, perform)(ChatLayout);
