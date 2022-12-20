import { connect } from 'react-redux';

import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';

import { selectClaimIsNsfwForUri, selectClaimForUri } from 'redux/selectors/claims';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';

import MarkdownPostPage from './view';

const select = (state, props) => {
  const { uri } = props;
  const { search } = location;

  const urlParams = new URLSearchParams(search);
  const claim = selectClaimForUri(state, uri);

  const claimId = claim.claim_id;

  return {
    isMature: selectClaimIsNsfwForUri(state, uri),
    linkedCommentId: urlParams.get(LINKED_COMMENT_QUERY_PARAM),
    threadCommentId: urlParams.get(THREAD_COMMENT_QUERY_PARAM),
    contentUnlocked: claimId && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId),
  };
};

export default (connect(select)(MarkdownPostPage));
