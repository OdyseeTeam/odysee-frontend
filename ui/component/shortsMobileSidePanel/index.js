import { connect } from 'react-redux';
import MobilePanel from './view';
import { selectMyReactionForUri, selectLikeCountForUri, selectDislikeCountForUri } from 'redux/selectors/reactions';
import { doFetchReactions, doReactionLike, doReactionDislike } from 'redux/actions/reactions';
import { selectClaimForUri, selectIsStreamPlaceholderForUri, selectIsUriUnlisted } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri);
  const { claim_id: claimId } = claim || {};

  return {
    claimId,
    myReaction: selectMyReactionForUri(state, uri),
    likeCount: selectLikeCountForUri(state, uri),
    dislikeCount: selectDislikeCountForUri(state, uri),
    isLivestreamClaim: selectIsStreamPlaceholderForUri(state, uri),
    isUnlisted: selectIsUriUnlisted(state, uri),
    webShareable: true,
    collectionId: props.collectionId,
  };
};

const perform = {
  doFetchReactions,
  doReactionLike,
  doReactionDislike,
  doOpenModal,
};

export default connect(select, perform)(MobilePanel);
