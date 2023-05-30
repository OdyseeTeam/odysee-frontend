// @flow
import type { Props } from './view';
import CommentsList from './view';
import { connect } from 'react-redux';
import {
  selectClaimForUri,
  selectClaimIsMine,
  selectScheduledStateForUri,
  selectProtectedContentTagForUri,
} from 'redux/selectors/claims';
import {
  selectTopLevelCommentsForUri,
  selectTopLevelTotalPagesForUri,
  selectIsFetchingComments,
  selectIsFetchingTopLevelComments,
  selectTotalCommentsCountForUri,
  selectCommentsEnabledSettingForChannelId,
  selectPinnedCommentsForUri,
  selectCommentForCommentId,
  selectCommentAncestorsForId,
} from 'redux/selectors/comments';
import { doCommentReset, doCommentList, doCommentById } from 'redux/actions/comments';
import { doPopOutInlinePlayer } from 'redux/actions/content';
import { getChannelIdFromClaim } from 'util/claim';
import {
  doFetchOdyseeMembershipForChannelIds,
  doFetchChannelMembershipsForChannelIds,
} from 'redux/actions/memberships';
import { selectUserHasValidMembershipForCreatorId } from 'redux/selectors/memberships';

const select = (state, props) => {
  const { uri, threadCommentId, linkedCommentId } = props;

  const claim = selectClaimForUri(state, uri);
  const channelId = getChannelIdFromClaim(claim);

  const threadComment = selectCommentForCommentId(state, threadCommentId);

  return {
    channelId,
    chatCommentsRestrictedToChannelMembers: Boolean(selectProtectedContentTagForUri(state, uri)),
    claimId: claim && claim.claim_id,
    claimIsMine: selectClaimIsMine(state, claim),
    // $FlowFixMe
    isAChannelMember: selectUserHasValidMembershipForCreatorId(state, channelId),
    isFetchingComments: selectIsFetchingComments(state),
    isFetchingTopLevelComments: selectIsFetchingTopLevelComments(state),
    linkedCommentAncestors: selectCommentAncestorsForId(state, linkedCommentId),
    // $FlowFixMe
    commentsEnabledSetting: selectCommentsEnabledSettingForChannelId(state, channelId),
    pinnedComments: selectPinnedCommentsForUri(state, uri),
    threadComment,
    threadCommentAncestors: selectCommentAncestorsForId(state, threadCommentId),
    topLevelComments: selectTopLevelCommentsForUri(state, uri),
    topLevelTotalPages: selectTopLevelTotalPagesForUri(state, uri),
    totalComments: selectTotalCommentsCountForUri(state, uri),
    scheduledState: selectScheduledStateForUri(state, uri),
  };
};

const perform = {
  fetchTopLevelComments: doCommentList,
  fetchComment: doCommentById,
  resetComments: doCommentReset,
  doFetchOdyseeMembershipForChannelIds,
  doFetchChannelMembershipsForChannelIds,
  doPopOutInlinePlayer,
};

export default connect<_, Props, _, _, _, _>(select, perform)(CommentsList);
