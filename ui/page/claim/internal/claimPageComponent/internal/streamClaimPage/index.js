import { connect } from 'react-redux';
import { doSetContentHistoryItem, doSetPrimaryUri } from 'redux/actions/content';
import { withRouter } from 'react-router-dom';
import {
  selectClaimIsNsfwForUri,
  selectClaimForUri,
  selectClaimWasPurchasedForUri,
  selectPreorderTagForUri,
  selectPurchaseTagForUri,
  selectRentalTagForUri,
  selectProtectedContentTagForUri,
  selectIsStreamPlaceholderForUri,
  selectCostInfoForUri,
} from 'redux/selectors/claims';
import { makeSelectFileInfoForUri } from 'redux/selectors/file_info';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { selectCommentsListTitleForUri, selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { doToggleAppDrawer } from 'redux/actions/app';
import { getChannelIdFromClaim } from 'util/claim';
import { doFileGetForUri } from 'redux/actions/file';
import { doCheckIfPurchasedClaimId } from 'redux/actions/stripe';
import { doMembershipContentforStreamClaimId, doMembershipMine } from 'redux/actions/memberships';
import {
  selectMembershipMineFetched,
  selectNoRestrictionOrUserIsMemberForContentClaimId,
} from 'redux/selectors/memberships';

import StreamClaimPage from './view';

const select = (state, props) => {
  const { uri } = props;
  const { search } = location;

  const urlParams = new URLSearchParams(search);
  const claim = selectClaimForUri(state, uri);
  const channelId = getChannelIdFromClaim(claim);

  const claimId = claim.claim_id;

  return {
    commentSettingDisabled: selectCommentsDisabledSettingForChannelId(state, channelId),
    claimId,
    claimWasPurchased: selectClaimWasPurchasedForUri(state, uri),
    commentsListTitle: selectCommentsListTitleForUri(state, uri),
    costInfo: selectCostInfoForUri(state, uri),
    fileInfo: makeSelectFileInfoForUri(uri)(state),
    isMature: selectClaimIsNsfwForUri(state, uri),
    linkedCommentId: urlParams.get(LINKED_COMMENT_QUERY_PARAM),
    myMembershipsFetched: selectMembershipMineFetched(state),
    preorderTag: selectPreorderTagForUri(state, props.uri),
    purchaseTag: selectPurchaseTagForUri(state, props.uri),
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    rentalTag: selectRentalTagForUri(state, props.uri),
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
  doFileGetForUri,
  doCheckIfPurchasedClaimId,
  doMembershipContentforStreamClaimId,
  doMembershipMine,
};

export default withRouter(connect(select, perform)(StreamClaimPage));
