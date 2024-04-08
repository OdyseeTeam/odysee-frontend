import { connect } from 'react-redux';
import CommentReactions from './view';
import { selectClaimIsMine, selectClaimForUri, makeSelectTagInClaimOrChannelForUri } from 'redux/selectors/claims';
import { doResolveUri } from 'redux/actions/claims';
import { doToast } from 'redux/actions/notifications';
import { selectMyReactsForComment, selectOthersReactsForComment } from 'redux/selectors/comments';
import { doCommentReact } from 'redux/actions/comments';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { DISABLE_REACTIONS_ALL_TAG, DISABLE_SLIMES_ALL_TAG } from 'constants/tags';

const select = (state, props) => {
  const activeChannelClaim = selectActiveChannelClaim(state);
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;
  const reactionKey = activeChannelId ? `${props.commentId}:${activeChannelId}` : props.commentId;
  const claim = selectClaimForUri(state, props.uri);

  return {
    claim,
    disableReactions: makeSelectTagInClaimOrChannelForUri(props.uri, DISABLE_REACTIONS_ALL_TAG)(state),
    disableSlimes: makeSelectTagInClaimOrChannelForUri(props.uri, DISABLE_SLIMES_ALL_TAG)(state),
    claimIsMine: selectClaimIsMine(state, claim),
    myReacts: selectMyReactsForComment(state, reactionKey),
    othersReacts: selectOthersReactsForComment(state, reactionKey),
    activeChannelId,
  };
};

const perform = (dispatch) => ({
  resolve: (uri) => dispatch(doResolveUri(uri)),
  react: (commentId, type) => dispatch(doCommentReact(commentId, type)),
  doToast: (params) => dispatch(doToast(params)),
});

export default connect(select, perform)(CommentReactions);
