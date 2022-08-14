import { connect } from 'react-redux';
import {
  selectStakedLevelForChannelUri,
  makeSelectClaimForUri,
  selectThumbnailForUri,
  selectHasChannels,
  selectMyClaimIdsRaw,
  selectOdyseeMembershipForUri,
  selectMembershipForChannelId,
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
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectPlayingUri } from 'redux/selectors/content';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { selectActiveMembershipForChannelUri } from 'redux/selectors/memberships';
import Comment from './view';

const select = (state, props) => {
  const { comment, uri } = props;
  const { comment_id, channel_url, channel_id } = comment || {};

  const activeChannelClaim = selectActiveChannelClaim(state);
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;
  const reactionKey = activeChannelId ? `${comment_id}:${activeChannelId}` : comment_id;

  return {
    activeChannelClaim,
    activeChannelMembership: selectActiveMembershipForChannelUri(state, uri),
    claim: makeSelectClaimForUri(uri)(state),
    commenterMembership: channel_url && selectOdyseeMembershipForUri(state, channel_url),
    commentingEnabled: Boolean(selectUserVerifiedEmail(state)),
    fetchedReplies: selectRepliesForParentId(state, comment_id),
    hasChannels: selectHasChannels(state),
    linkedCommentAncestors: selectFetchedCommentAncestors(state),
    membership: channel_id && selectMembershipForChannelId(state, channel_id),
    myChannelIds: selectMyClaimIdsRaw(state),
    othersReacts: selectOthersReactsForComment(state, reactionKey),
    playingUri: selectPlayingUri(state),
    repliesFetching: selectIsFetchingCommentsForParentId(state, comment_id),
    stakedLevel: selectStakedLevelForChannelUri(state, channel_url),
    thumbnail: channel_url && selectThumbnailForUri(state, channel_url),
    totalReplyPages: makeSelectTotalReplyPagesForParentId(comment_id)(state),
  };
};

const perform = {
  doClearPlayingUri,
  doClearPlayingSource,
  updateComment: doCommentUpdate,
  fetchReplies: doCommentList,
  doToast,
};

export default connect(select, perform)(Comment);
