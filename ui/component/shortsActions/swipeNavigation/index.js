import { connect } from 'react-redux';
import withStreamClaimRender from 'hocs/withStreamClaimRender';
import SwipeNavigationPortal from './view';
import { selectClaimForUri, selectIsStreamPlaceholderForUri, selectIsUriUnlisted } from 'redux/selectors/claims';
import { selectMyReactionForUri, selectLikeCountForUri, selectDislikeCountForUri } from 'redux/selectors/reactions';
import { doFetchReactions, doReactionLike, doReactionDislike } from 'redux/actions/reactions';
import { doOpenModal } from 'redux/actions/app';

const select = (state, ownProps) => {
  const { uri } = ownProps;
  const claim = ownProps?.uri ? selectClaimForUri(state, ownProps.uri) : null;
  const channel = claim?.signing_channel || null;
  const { claim_id: claimId } = claim || {};

  return {
    channelName: channel?.name || '',
    channelUri: channel?.canonical_url || channel?.permanent_url || '',
    hasChannel: !!channel,
    hasPlaylist: false,
    claimId,
    myReaction: uri ? selectMyReactionForUri(state, uri) : null,
    likeCount: uri ? selectLikeCountForUri(state, uri) : 0,
    dislikeCount: uri ? selectDislikeCountForUri(state, uri) : 0,
    isLivestreamClaim: uri ? selectIsStreamPlaceholderForUri(state, uri) : false,
    isUnlisted: uri ? selectIsUriUnlisted(state, uri) : false,
    webShareable: true,
  };
};

const perform = {
  doFetchReactions,
  doReactionLike,
  doReactionDislike,
  doOpenModal,
};

export default connect(select, perform)(withStreamClaimRender(SwipeNavigationPortal));
