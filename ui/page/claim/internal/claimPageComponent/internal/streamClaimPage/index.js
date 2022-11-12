import { connect } from 'react-redux';
import { doSetContentHistoryItem, doSetPrimaryUri } from 'redux/actions/content';
import { withRouter } from 'react-router-dom';
import {
  selectClaimIsNsfwForUri,
  selectClaimForUri,
  selectProtectedContentTagForUri,
  selectIsStreamPlaceholderForUri,
  selectCostInfoForUri,
} from 'redux/selectors/claims';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { selectCommentsListTitleForUri, selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { doToggleAppDrawer } from 'redux/actions/app';
import { getChannelIdFromClaim } from 'util/claim';

import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';

import StreamClaimPage from './view';

const select = (state, props) => {
  const { uri } = props;
  const { search } = location;

  const urlParams = new URLSearchParams(search);
  const claim = selectClaimForUri(state, uri);
  const channelId = getChannelIdFromClaim(claim);

  const claimId = claim.claim_id;

  return {
    commentsListTitle: selectCommentsListTitleForUri(state, uri),
    costInfo: selectCostInfoForUri(state, uri),
    isMature: selectClaimIsNsfwForUri(state, uri),
    linkedCommentId: urlParams.get(LINKED_COMMENT_QUERY_PARAM),
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    commentSettingDisabled: selectCommentsDisabledSettingForChannelId(state, channelId),
    threadCommentId: urlParams.get(THREAD_COMMENT_QUERY_PARAM),
    isProtectedContent: Boolean(selectProtectedContentTagForUri(state, uri)),
    contentUnlocked: claimId && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId),
    isLivestream: selectIsStreamPlaceholderForUri(state, uri),
  };
};

const perform = {
  doSetContentHistoryItem,
  doSetPrimaryUri,
  doToggleAppDrawer,
};

export default withRouter(connect(select, perform)(StreamClaimPage));
