import { connect } from 'react-redux';
import {
  selectStakedLevelForChannelUri,
  selectClaimForUri,
  selectThumbnailForUri,
  selectHasChannels,
  selectMyClaimIdsRaw,
} from 'redux/selectors/claims';
import { doCommentUpdate, doCommentList } from 'redux/actions/comments';
import { selectChannelIsMuted } from 'redux/selectors/blocked';
import { doToast } from 'redux/actions/notifications';
import { doClearPlayingUri } from 'redux/actions/content';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import {
  selectLinkedCommentAncestors,
  selectOthersReactsForComment,
  makeSelectTotalReplyPagesForParentId,
} from 'redux/selectors/comments';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectPlayingUri } from 'redux/selectors/content';
import Comment from './view';

const select = (state, props) => {
  const { comment, uri } = props;
  const { comment_id: commentId, author_uri: authorUri } = comment || {};

  const activeChannelClaim = selectActiveChannelClaim(state);
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;
  const reactionKey = activeChannelId ? `${commentId}:${activeChannelId}` : commentId;

  return {
    myChannelIds: selectMyClaimIdsRaw(state),
    claim: selectClaimForUri(state, uri),
    thumbnail: authorUri && selectThumbnailForUri(state, authorUri),
    channelIsBlocked: authorUri && selectChannelIsMuted(state, authorUri),
    commentingEnabled: IS_WEB ? Boolean(selectUserVerifiedEmail(state)) : true,
    othersReacts: selectOthersReactsForComment(state, reactionKey),
    activeChannelClaim,
    hasChannels: selectHasChannels(state),
    playingUri: selectPlayingUri(state),
    stakedLevel: selectStakedLevelForChannelUri(state, authorUri),
    linkedCommentAncestors: selectLinkedCommentAncestors(state),
    totalReplyPages: makeSelectTotalReplyPagesForParentId(commentId)(state),
  };
};

const perform = {
  clearPlayingUri: doClearPlayingUri,
  updateComment: doCommentUpdate,
  fetchReplies: doCommentList,
  doToast,
};

export default connect(select, perform)(Comment);
