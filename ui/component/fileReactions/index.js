import { connect } from 'react-redux';
import {
  selectMyReactionForUri,
  selectLikeCountForUri,
  selectDislikeCountForUri,
  selectMyReactionForClaimId,
  selectLikeCountForClaimId,
  selectDislikeCountForClaimId,
} from 'redux/selectors/reactions';
import {
  doFetchReactions,
  doReactionLike,
  doReactionDislike,
  doReactionLikeForId,
  doReactionDislikeForId,
} from 'redux/actions/reactions';
import FileReactions from './view';
import {
  selectClaimForUri,
  selectIsStreamPlaceholderForUri,
  selectClaimIsMine,
  selectScheduledStateForUri,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { DISABLE_SLIMES_VIDEO_TAG, DISABLE_SLIMES_ALL_TAG } from 'constants/tags';

const select = (state, props) => {
  const { uri, claimIdOverride } = props;

  const claim = selectClaimForUri(state, uri);
  const { claim_id: claimIdFromUri } = claim || {};
  const claimId = claimIdOverride || claimIdFromUri;

  const fromOverride = Boolean(claimIdOverride);

  return {
    myReaction: fromOverride ? selectMyReactionForClaimId(state, claimId) : selectMyReactionForUri(state, uri),
    likeCount: fromOverride ? selectLikeCountForClaimId(state, claimId) : selectLikeCountForUri(state, uri),
    dislikeCount: fromOverride ? selectDislikeCountForClaimId(state, claimId) : selectDislikeCountForUri(state, uri),
    isLivestreamClaim: fromOverride ? false : selectIsStreamPlaceholderForUri(state, uri),
    claimId,
    claimIsMine: fromOverride ? false : selectClaimIsMine(state, claim),
    scheduledState: fromOverride ? undefined : selectScheduledStateForUri(state, uri),
    disableSlimes: fromOverride
      ? false
      : makeSelectTagInClaimOrChannelForUri(uri, DISABLE_SLIMES_ALL_TAG)(state) ||
        makeSelectTagInClaimOrChannelForUri(uri, DISABLE_SLIMES_VIDEO_TAG)(state),
  };
};

const perform = (dispatch, ownProps) => ({
  doFetchReactions: (claimId) => dispatch(doFetchReactions(ownProps.claimIdOverride || claimId)),
  doReactionLike: (uri) =>
    ownProps.claimIdOverride ? dispatch(doReactionLikeForId(ownProps.claimIdOverride)) : dispatch(doReactionLike(uri)),
  doReactionDislike: (uri) =>
    ownProps.claimIdOverride
      ? dispatch(doReactionDislikeForId(ownProps.claimIdOverride))
      : dispatch(doReactionDislike(uri)),
});

export default connect(select, perform)(FileReactions);
