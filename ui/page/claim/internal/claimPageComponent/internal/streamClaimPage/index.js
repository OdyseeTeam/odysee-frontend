import { connect } from 'react-redux';
import { doSetContentHistoryItem, doSetPrimaryUri } from 'redux/actions/content';
import { withRouter } from 'react-router-dom';
import {
  selectClaimIsNsfwForUri,
  selectClaimForUri,
  selectProtectedContentTagForUri,
  selectIsStreamPlaceholderForUri,
  selectCostInfoForUri,
  selectThumbnailForUri,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { selectIsClaimBlackListedForUri } from 'lbryinc';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { selectCommentsListTitleForUri, selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { doToggleAppDrawer } from 'redux/actions/app';
import { getChannelIdFromClaim } from 'util/claim';

import * as TAGS from 'constants/tags';

import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';

import StreamClaimPage from './view';

const select = (state, props) => {
  const { uri } = props;
  const { search } = location;

  const urlParams = new URLSearchParams(search);
  const claim = selectClaimForUri(state, uri);
  const channelId = getChannelIdFromClaim(claim);

  const claimId = claim.claim_id;

  const commentSettingDisabled = selectCommentsDisabledSettingForChannelId(state, channelId);

  return {
    commentsListTitle: selectCommentsListTitleForUri(state, uri),
    costInfo: selectCostInfoForUri(state, uri),
    thumbnail: selectThumbnailForUri(state, props.uri),
    isMature: selectClaimIsNsfwForUri(state, uri),
    linkedCommentId: urlParams.get(LINKED_COMMENT_QUERY_PARAM),
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    commentsDisabled:
      commentSettingDisabled || makeSelectTagInClaimOrChannelForUri(uri, TAGS.DISABLE_COMMENTS_TAG)(state),
    threadCommentId: urlParams.get(THREAD_COMMENT_QUERY_PARAM),
    isProtectedContent: Boolean(selectProtectedContentTagForUri(state, uri)),
    contentUnlocked: claimId && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId),
    isLivestream: selectIsStreamPlaceholderForUri(state, uri),
    isClaimBlackListed: selectIsClaimBlackListedForUri(state, uri),
  };
};

const perform = {
  doSetContentHistoryItem,
  doSetPrimaryUri,
  doToggleAppDrawer,
};

export default withRouter(connect(select, perform)(StreamClaimPage));
