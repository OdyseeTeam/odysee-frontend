import { connect } from 'react-redux';
import { doSetContentHistoryItem, doSetPrimaryUri, clearPosition } from 'redux/actions/content';
import { withRouter } from 'react-router-dom';
import {
  selectClaimIsNsfwForUri,
  makeSelectTagInClaimOrChannelForUri,
  selectIsStreamPlaceholderForUri,
  selectClaimForUri,
  selectClaimWasPurchasedForUri,
  selectPurchaseTagForUri,
  selectPreorderTagForUri,
  selectRentalTagForUri,
} from 'redux/selectors/claims';
import { makeSelectFileInfoForUri } from 'redux/selectors/file_info';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import * as SETTINGS from 'constants/settings';
import { selectCostInfoForUri, doFetchCostInfoForUri } from 'lbryinc';
import { selectShowMatureContent, selectClientSetting } from 'redux/selectors/settings';
import {
  makeSelectFileRenderModeForUri,
  selectContentPositionForUri,
  selectPlayingCollectionId,
  selectIsUriCurrentlyPlaying,
} from 'redux/selectors/content';
import { selectCommentsListTitleForUri, selectSettingsByChannelId } from 'redux/selectors/comments';
import { DISABLE_COMMENTS_TAG } from 'constants/tags';
import { doToggleAppDrawer, doSetMainPlayerDimension } from 'redux/actions/app';
import { getChannelIdFromClaim } from 'util/claim';
import { doFileGet } from 'redux/actions/file';
import { doCheckIfPurchasedClaimId } from 'redux/actions/stripe';

import FilePage from './view';
import { doGetMembershipTiersForContentClaimId, doMembershipMine } from 'redux/actions/memberships';
import { selectMembershipMineData } from 'redux/selectors/memberships';

const select = (state, props) => {
  const { uri } = props;
  const { search } = location;

  const urlParams = new URLSearchParams(search);
  const playingCollectionId = selectPlayingCollectionId(state);
  const claim = selectClaimForUri(state, uri);

  return {
    audioVideoDuration: claim?.value?.video?.duration || claim?.value?.audio?.duration,
    channelId: getChannelIdFromClaim(claim),
    claimId: claim.claim_id,
    claimWasPurchased: selectClaimWasPurchasedForUri(state, uri),
    commentsListTitle: selectCommentsListTitleForUri(state, uri),
    contentCommentsDisabled: makeSelectTagInClaimOrChannelForUri(uri, DISABLE_COMMENTS_TAG)(state),
    costInfo: selectCostInfoForUri(state, uri),
    fileInfo: makeSelectFileInfoForUri(uri)(state),
    isLivestream: selectIsStreamPlaceholderForUri(state, uri),
    isMature: selectClaimIsNsfwForUri(state, uri),
    isUriPlaying: selectIsUriCurrentlyPlaying(state, uri),
    linkedCommentId: urlParams.get(LINKED_COMMENT_QUERY_PARAM),
    myActiveMemberships: selectMembershipMineData(state),
    obscureNsfw: !selectShowMatureContent(state),
    playingCollectionId,
    position: selectContentPositionForUri(state, uri),
    preorderTag: selectPreorderTagForUri(state, props.uri),
    purchaseTag: selectPurchaseTagForUri(state, props.uri),
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    rentalTag: selectRentalTagForUri(state, props.uri),
    settingsByChannelId: selectSettingsByChannelId(state),
    threadCommentId: urlParams.get(THREAD_COMMENT_QUERY_PARAM),
    videoTheaterMode: selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE),
  };
};

const perform = {
  doFetchCostInfoForUri,
  doSetContentHistoryItem,
  doSetPrimaryUri,
  clearPosition,
  doToggleAppDrawer,
  doFileGet,
  doSetMainPlayerDimension,
  doCheckIfPurchasedClaimId,
  doGetMembershipTiersForContentClaimId,
  doMembershipMine,
};

export default withRouter(connect(select, perform)(FilePage));
