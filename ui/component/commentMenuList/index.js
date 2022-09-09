import { connect } from 'react-redux';
import { doChannelMute } from 'redux/actions/blocked';
import { doCommentPin, doCommentModAddDelegate } from 'redux/actions/comments';
import { doOpenModal, doSetActiveChannel } from 'redux/actions/app';
import { doClearPlayingUri } from 'redux/actions/content';
import { doToast } from 'redux/actions/notifications';
import { selectClaimIsMine, selectClaimForUri, selectTitleForUri } from 'redux/selectors/claims';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectModerationDelegatorsById } from 'redux/selectors/comments';
import { selectPlayingUri } from 'redux/selectors/content';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import CommentMenuList from './view';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const authorClaim = selectClaimForUri(state, props.authorUri);
  const authorCanonicalUri = (authorClaim && authorClaim.canonical_url) || '';
  const authorId = (authorClaim && authorClaim.claim_id) || '';

  return {
    claim,
    claimIsMine: selectClaimIsMine(state, claim),
    isAuthenticated: selectUserVerifiedEmail(state),
    activeChannelClaim: selectActiveChannelClaim(state),
    channelIsMine: selectClaimIsMine(state, authorClaim),
    playingUri: selectPlayingUri(state),
    moderationDelegatorsById: selectModerationDelegatorsById(state),
    authorTitle: selectTitleForUri(state, props.authorUri),
    authorCanonicalUri,
    authorId,
  };
};

const perform = (dispatch) => ({
  doToast: (props) => dispatch(doToast(props)),
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
  clearPlayingUri: () => dispatch(doClearPlayingUri()),
  muteChannel: (channelUri) => dispatch(doChannelMute(channelUri)),
  pinComment: (commentId, claimId, remove) => dispatch(doCommentPin(commentId, claimId, remove)),
  commentModAddDelegate: (modChanId, modChanName, creatorChannelClaim) =>
    dispatch(doCommentModAddDelegate(modChanId, modChanName, creatorChannelClaim, true)),
  doSetActiveChannel: (authorId) => dispatch(doSetActiveChannel(authorId)),
});

export default connect(select, perform)(CommentMenuList);
