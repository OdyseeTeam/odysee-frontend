// @flow
import type { Props } from './view';
import CommentsList from './view';
import { connect } from 'react-redux';
import {
  selectClaimForUri,
  selectClaimIsMine,
  selectFetchingMyChannels,
  selectScheduledStateForUri,
  selectProtectedContentTagForUri,
} from 'redux/selectors/claims';
import {
  selectCommentsById,
  selectTopLevelCommentsForUri,
  selectTopLevelTotalPagesForUri,
  selectIsFetchingComments,
  selectIsFetchingTopLevelComments,
  selectIsFetchingReacts,
  selectTotalCommentsCountForUri,
  selectOthersReacts,
  selectMyReacts,
  selectCommentIdsForUri,
  selectCommentsEnabledSettingForChannelId,
  selectPinnedCommentsForUri,
  selectCommentForCommentId,
  selectCommentAncestorsForId,
} from 'redux/selectors/comments';
import {
  doCommentReset,
  doCommentList,
  doCommentListForId,
  doCommentById,
  doCommentReactList,
} from 'redux/actions/comments';
import { doPopOutInlinePlayer } from 'redux/actions/content';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { getChannelIdFromClaim } from 'util/claim';
import {
  doFetchOdyseeMembershipForChannelIds,
  doFetchChannelMembershipsForChannelIds,
} from 'redux/actions/memberships';
import { selectUserHasValidMembershipForCreatorId } from 'redux/selectors/memberships';

const select = (state, props) => {
  const { uri, threadCommentId, linkedCommentId, claimIdOverride } = props;

  const activeChannelClaim = selectActiveChannelClaim(state);
  const threadComment = selectCommentForCommentId(state, threadCommentId);
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;

  if (claimIdOverride) {
    const commentsState = state.comments || {};
    const commentById = selectCommentsById(state) || {};
    const topLevelById = commentsState.topLevelCommentsById || {};
    const pinnedById = commentsState.pinnedCommentsById || {};

    const topLevelIds = topLevelById[claimIdOverride] || [];
    const pinnedIds = pinnedById[claimIdOverride] || [];

    return {
      activeChannelId,
      allCommentIds: (commentsState.byId && commentsState.byId[claimIdOverride]) || [],
      channelId: undefined,
      chatCommentsRestrictedToChannelMembers: false,
      claimId: claimIdOverride,
      claimIsMine: false,
      fetchingChannels: selectFetchingMyChannels(state),
      // $FlowFixMe
      isAChannelMember: false,
      isFetchingComments: selectIsFetchingComments(state),
      isFetchingReacts: selectIsFetchingReacts(state),
      isFetchingTopLevelComments: selectIsFetchingTopLevelComments(state),
      linkedCommentAncestors: selectCommentAncestorsForId(state, linkedCommentId),
      commentsEnabledSetting: true,
      myReactsByCommentId: selectMyReacts(state),
      othersReactsById: selectOthersReacts(state),
      pinnedComments: pinnedIds.map((cid) => commentById[cid]).filter(Boolean),
      threadComment,
      threadCommentAncestors: selectCommentAncestorsForId(state, threadCommentId),
      topLevelComments: topLevelIds.map((cid) => commentById[cid]).filter(Boolean),
      topLevelTotalPages:
        (commentsState.topLevelTotalPagesById && commentsState.topLevelTotalPagesById[claimIdOverride]) || 0,
      totalComments:
        (commentsState.topLevelTotalCommentsById && commentsState.topLevelTotalCommentsById[claimIdOverride]) ||
        (commentsState.totalCommentsById && commentsState.totalCommentsById[claimIdOverride]) ||
        0,
      scheduledState: undefined,
    };
  }

  const claim = selectClaimForUri(state, uri);
  const channelId = getChannelIdFromClaim(claim);

  return {
    activeChannelId,
    allCommentIds: selectCommentIdsForUri(state, uri),
    channelId,
    chatCommentsRestrictedToChannelMembers: Boolean(selectProtectedContentTagForUri(state, uri)),
    claimId: claim && claim.claim_id,
    claimIsMine: selectClaimIsMine(state, claim),
    fetchingChannels: selectFetchingMyChannels(state),
    // $FlowFixMe
    isAChannelMember: selectUserHasValidMembershipForCreatorId(state, channelId),
    isFetchingComments: selectIsFetchingComments(state),
    isFetchingReacts: selectIsFetchingReacts(state),
    isFetchingTopLevelComments: selectIsFetchingTopLevelComments(state),
    linkedCommentAncestors: selectCommentAncestorsForId(state, linkedCommentId),
    // $FlowFixMe
    commentsEnabledSetting: selectCommentsEnabledSettingForChannelId(state, channelId),
    myReactsByCommentId: selectMyReacts(state),
    othersReactsById: selectOthersReacts(state),
    pinnedComments: selectPinnedCommentsForUri(state, uri),
    threadComment,
    threadCommentAncestors: selectCommentAncestorsForId(state, threadCommentId),
    topLevelComments: selectTopLevelCommentsForUri(state, uri),
    topLevelTotalPages: selectTopLevelTotalPagesForUri(state, uri),
    totalComments: selectTotalCommentsCountForUri(state, uri),
    scheduledState: selectScheduledStateForUri(state, uri),
  };
};

const perform = (dispatch, ownProps: Props) => ({
  fetchTopLevelComments: (uri, parentId, page, pageSize, sortBy, isLivestream) =>
    dispatch(
      ownProps.claimIdOverride
        ? doCommentListForId(ownProps.claimIdOverride, parentId, page, pageSize, sortBy)
        : doCommentList(uri, parentId, page, pageSize, sortBy, isLivestream)
    ),
  fetchComment: (commentId) => dispatch(doCommentById(commentId)),
  fetchReacts: (commentIds) => dispatch(doCommentReactList(commentIds)),
  resetComments: (claimId) => dispatch(doCommentReset(claimId)),
  doFetchOdyseeMembershipForChannelIds: (claimIds) => dispatch(doFetchOdyseeMembershipForChannelIds(claimIds)),
  doFetchChannelMembershipsForChannelIds: (channelId, claimIds) =>
    dispatch(doFetchChannelMembershipsForChannelIds(channelId, claimIds)),
  doPopOutInlinePlayer: (param) => dispatch(doPopOutInlinePlayer(param)),
});

export default connect<_, Props, _, _, _, _>(select, perform)(CommentsList);
