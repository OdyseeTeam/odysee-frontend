import { connect } from 'react-redux';

import * as SETTINGS from 'constants/settings';

import { isStreamPlaceholderClaim, getChannelFromClaim, getClaimTitle, getChannelTitleFromClaim } from 'util/claim';

import { selectClientSetting } from 'redux/selectors/settings';
import { selectPlayingUri } from 'redux/selectors/content';
import {
  selectClaimForUri,
  selectPurchaseTagForUri,
  selectRentalTagForUri,
  selectProtectedContentTagForUri,
  selectContentTypeIsAudioForUri,
  selectThumbnailForUri,
} from 'redux/selectors/claims';
import { selectActiveChannelLivestreamForUri } from 'redux/selectors/livestream';
import { selectUser } from 'redux/selectors/user';
import { selectWindowPlayerObj } from 'redux/selectors/app';

import { doAnalyticsBuffer, doAnalyticsView, doSetWindowPlayerObj } from 'redux/actions/app';
import { doClaimEligiblePurchaseRewards } from 'redux/actions/rewards';
import { toggleVideoTheaterMode } from 'redux/actions/settings';
import { doToast } from 'redux/actions/notifications';

import VideoViewer from './view';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);

  const playingUri = selectPlayingUri(state);
  const isMarkdownOrComment = playingUri.source === 'markdown' || playingUri.source === 'comment';

  return {
    claimId: claim && claim.claim_id,
    claimValues: claim && claim.value,
    title: getClaimTitle(claim),
    channelTitle: getChannelTitleFromClaim(claim),
    userId: selectUser(state) && selectUser(state).id,
    activeLivestreamForChannel: selectActiveChannelLivestreamForUri(state, uri),
    defaultQuality: selectClientSetting(state, SETTINGS.DEFAULT_VIDEO_QUALITY),
    isPurchasableContent: Boolean(selectPurchaseTagForUri(state, uri)),
    isRentableContent: Boolean(selectRentalTagForUri(state, props.uri)),
    isProtectedContent: Boolean(selectProtectedContentTagForUri(state, uri)),
    isLivestreamClaim: isStreamPlaceholderClaim(claim),
    channelClaimId: getChannelFromClaim(claim),
    isAudio: selectContentTypeIsAudioForUri(state, uri),
    thumbnail: selectThumbnailForUri(state, uri),
    isMarkdownOrComment,
    windowPlayerObj: selectWindowPlayerObj(state),
  };
};

const perform = {
  doAnalyticsBuffer,
  doAnalyticsView,
  doClaimEligiblePurchaseRewards,
  doToast,
  doSetWindowPlayerObj,
  toggleVideoTheaterMode,
};

export default connect(select, perform)(VideoViewer);
