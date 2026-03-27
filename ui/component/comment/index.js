// @flow
import type { Props } from './view';
import CommentView from './view';
import { connect } from 'react-redux';
import {
  selectStakedLevelForChannelUri,
  selectClaimForUri,
  selectHasChannels,
  selectMyClaimIdsRaw,
  selectTitleForUri,
  selectDateForUri,
} from 'redux/selectors/claims';
import { doCommentUpdate, doCommentList } from 'redux/actions/comments';
import { doToast } from 'redux/actions/notifications';
import { doClearPlayingUri, doClearPlayingSource } from 'redux/actions/content';
import {
  selectFetchedCommentAncestors,
  selectOthersReactsForComment,
  makeSelectTotalReplyPagesForParentId,
  selectIsFetchingCommentsForParentId,
  selectRepliesForParentId,
} from 'redux/selectors/comments';
import { selectMembershipForCreatorOnlyIdAndChannelId, selectUserOdyseeMembership } from 'redux/selectors/memberships';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectPlayingUri } from 'redux/selectors/content';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { getChannelIdFromClaim } from 'util/claim';

const select = (state, props) => {
  const { comment, uri } = props;
  const { comment_id, channel_url, channel_id } = comment || {};

  const activeChannelClaim = selectActiveChannelClaim(state);
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;
  const reactionKey = activeChannelId ? `${comment_id}:${activeChannelId}` : comment_id;

  const claim = selectClaimForUri(state, uri);
  const creatorId = getChannelIdFromClaim(claim);
  const channelAge = selectDateForUri(state, channel_url);

  return {
    myChannelIds: selectMyClaimIdsRaw(state),
    claim,
    commentingEnabled: Boolean(selectUserVerifiedEmail(state)),
    othersReacts: selectOthersReactsForComment(state, reactionKey),
    hasChannels: selectHasChannels(state),
    playingUri: selectPlayingUri(state),
    stakedLevel: selectStakedLevelForChannelUri(state, channel_url),
    isCommenterChannelDeleted: selectClaimForUri(state, channel_url) === null,
    linkedCommentAncestors: selectFetchedCommentAncestors(state),
    totalReplyPages: makeSelectTotalReplyPagesForParentId(comment_id)(state),
    odyseeMembership: selectUserOdyseeMembership(state, channel_id) || '',
    creatorMembership: selectMembershipForCreatorOnlyIdAndChannelId(state, creatorId || '', channel_id) || '',
    repliesFetching: selectIsFetchingCommentsForParentId(state, comment_id),
    fetchedReplies: selectRepliesForParentId(state, comment_id),
    authorTitle: channel_url ? selectTitleForUri(state, channel_url) : null,
    channelAge,
  };
};

const perform = {
  doClearPlayingUri,
  doClearPlayingSource,
  updateComment: doCommentUpdate,
  fetchReplies: doCommentList,
  doToast,
};

export default connect<_, Props, _, _, _, _>(select, perform)(CommentView);
