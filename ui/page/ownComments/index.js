import { connect } from 'react-redux';
import { doCommentListOwn, doCommentReset } from 'redux/actions/comments';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import {
  selectIsFetchingComments,
  selectCommentIdsForUri,
  selectProxiedCommentById,
  selectTotalCommentsCountForUri,
} from 'redux/selectors/comments';
import { selectClaimsById } from 'redux/selectors/claims';

import OwnComments from './view';

const select = (state) => {
  const activeChannelClaim = selectActiveChannelClaim(state);
  const uri = activeChannelClaim && activeChannelClaim.canonical_url;

  return {
    activeChannelClaim,
    commentByIdProxy: selectProxiedCommentById(state),
    allCommentIds: selectCommentIdsForUri(state, uri),
    totalComments: selectTotalCommentsCountForUri(state, uri),
    isFetchingComments: selectIsFetchingComments(state),
    claimsById: selectClaimsById(state),
  };
};

const perform = {
  doCommentReset,
  doCommentListOwn,
};

export default connect(select, perform)(OwnComments);
