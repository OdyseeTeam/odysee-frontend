import { connect } from 'react-redux';
import { doSetContentHistoryItem, doSetPrimaryUri } from 'redux/actions/content';
import {
  selectClaimIsNsfwForUri,
  selectClaimForUri,
  selectProtectedContentTagForUri,
  selectIsStreamPlaceholderForUri,
  selectCostInfoForUri,
} from 'redux/selectors/claims';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { selectCommentsListTitleForUri, selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { doToggleAppDrawer } from 'redux/actions/app';
import { getChannelIdFromClaim } from 'util/claim';

import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';

import StreamClaimPage from './view';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const channelId = getChannelIdFromClaim(claim);

  const claimId = claim.claim_id;

  return {
    commentsListTitle: selectCommentsListTitleForUri(state, uri),
    costInfo: selectCostInfoForUri(state, uri),
    isMature: selectClaimIsNsfwForUri(state, uri),
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    commentSettingDisabled: selectCommentsDisabledSettingForChannelId(state, channelId),
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

export default connect(select, perform)(StreamClaimPage);
