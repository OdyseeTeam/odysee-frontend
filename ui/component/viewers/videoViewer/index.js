import { connect } from 'react-redux';
import {
  selectClaimForUri,
  selectThumbnailForUri,
  selectPurchaseTagForUri,
  selectPurchaseMadeForClaimId,
  selectRentalTagForUri,
  selectProtectedContentTagForUri,
  selectUnlistedContentTag,
} from 'redux/selectors/claims';
import { isStreamPlaceholderClaim, getChannelIdFromClaim } from 'util/claim';
import { selectActiveLivestreamForChannel } from 'redux/selectors/livestream';
import {
  selectNextUriForUriInPlayingCollectionForId,
  selectPreviousUriForUriInPlayingCollectionForId,
  selectIndexForUriInPlayingCollectionForId,
} from 'redux/selectors/collections';
import * as SETTINGS from 'constants/settings';
import { doChangeVolume, doChangeMute, doAnalyticsBuffer, doAnalyticsView } from 'redux/actions/app';
import { selectVolume, selectMute } from 'redux/selectors/app';
import { savePosition, clearPosition, doUriInitiatePlay, doSetContentHistoryItem } from 'redux/actions/content';
import { makeSelectIsPlayerFloating, selectContentPositionForUri, selectPlayingUri } from 'redux/selectors/content';
import { selectRecommendedContentForUri } from 'redux/selectors/search';
import VideoViewer from './view';
import { withRouter } from 'react-router';
import { doClaimEligiblePurchaseRewards } from 'redux/actions/rewards';
import { selectDaemonSettings, selectClientSetting, selectHomepageData } from 'redux/selectors/settings';
import { toggleVideoTheaterMode, toggleAutoplayNext, doSetClientSetting } from 'redux/actions/settings';
import { selectUserVerifiedEmail, selectUser } from 'redux/selectors/user';
import { parseURI } from 'util/lbryURI';
import { doToast } from 'redux/actions/notifications';
import { selectCostInfoForUri } from 'lbryinc';

const select = (state, props) => {
  const { search, pathname, hash } = props.location;
  const urlParams = new URLSearchParams(search);
  const autoplay = urlParams.get('autoplay');
  const uri = props.uri;

  const urlPath = `lbry://${(pathname + hash).slice(1)}`;
  let startTime;
  try {
    ({ startTime } = parseURI(urlPath));
  } catch (e) {}

  const claim = selectClaimForUri(state, uri);

  // TODO: eventually this should be received from DB and not local state (https://github.com/lbryio/lbry-desktop/issues/6796)
  const position =
    startTime || (urlParams.get('t') !== null ? urlParams.get('t') : selectContentPositionForUri(state, uri));
  const userId = selectUser(state) && selectUser(state).id;
  const internalFeature = selectUser(state) && selectUser(state).internal_feature;
  const playingUri = selectPlayingUri(state);
  const collectionId = playingUri.collection.collectionId;
  const isMarkdownOrComment = playingUri.source === 'markdown' || playingUri.source === 'comment';

  const nextPlaylistUri = collectionId && selectNextUriForUriInPlayingCollectionForId(state, collectionId, uri);
  const previousPlaylistUri = collectionId && selectPreviousUriForUriInPlayingCollectionForId(state, collectionId, uri);
  const recomendedContent = selectRecommendedContentForUri(state, uri);
  const nextRecommendedUri = recomendedContent && recomendedContent[0];

  return {
    activeLivestreamForChannel: selectActiveLivestreamForChannel(state, getChannelIdFromClaim(claim)),
    authenticated: selectUserVerifiedEmail(state),
    autoplayIfEmbedded: Boolean(autoplay),
    autoplayNext: !isMarkdownOrComment && selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT),
    claim,
    collectionId,
    currentPlaylistItemIndex: selectIndexForUriInPlayingCollectionForId(state, collectionId, uri),
    defaultQuality: selectClientSetting(state, SETTINGS.DEFAULT_VIDEO_QUALITY),
    homepageData: selectHomepageData(state),
    internalFeature,
    isFloating: makeSelectIsPlayerFloating(props.location)(state),
    isLivestreamClaim: isStreamPlaceholderClaim(claim),
    isMarkdownOrComment,
    isProtectedContent: Boolean(selectProtectedContentTagForUri(state, uri)),
    isPurchasableContent: Boolean(selectPurchaseTagForUri(state, props.uri)),
    isRentableContent: Boolean(selectRentalTagForUri(state, props.uri)),
    isUnlistedContent: Boolean(selectUnlistedContentTag(state, props.uri)),
    muted: selectMute(state),
    nextPlaylistUri,
    nextRecommendedUri,
    position,
    previousListUri: previousPlaylistUri,
    purchaseInfo: selectPurchaseTagForUri(state, props.uri),
    purchaseMadeForClaimId: selectPurchaseMadeForClaimId(state, claim.claim_id),
    rentalInfo: selectRentalTagForUri(state, props.uri),
    shareTelemetry: IS_WEB || selectDaemonSettings(state).share_usage_data,
    thumbnail: selectThumbnailForUri(state, uri),
    userId,
    videoPlaybackRate: selectClientSetting(state, SETTINGS.VIDEO_PLAYBACK_RATE),
    videoTheaterMode: selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE),
    volume: selectVolume(state),
    costInfo: selectCostInfoForUri(state, props.uri),
  };
};

const perform = (dispatch) => ({
  changeVolume: (volume) => dispatch(doChangeVolume(volume)),
  savePosition: (uri, position) => dispatch(savePosition(uri, position)),
  clearPosition: (uri) => dispatch(clearPosition(uri)),
  changeMute: (muted) => dispatch(doChangeMute(muted)),
  doAnalyticsBuffer: (uri, bufferData) => dispatch(doAnalyticsBuffer(uri, bufferData)),
  toggleVideoTheaterMode: () => dispatch(toggleVideoTheaterMode()),
  toggleAutoplayNext: () => dispatch(toggleAutoplayNext()),
  setVideoPlaybackRate: (rate) => dispatch(doSetClientSetting(SETTINGS.VIDEO_PLAYBACK_RATE, rate)),
  doPlayUri: (params) => dispatch(doUriInitiatePlay(params, true, true)),
  doAnalyticsView: (uri, timeToStart) => dispatch(doAnalyticsView(uri, timeToStart)),
  claimRewards: () => dispatch(doClaimEligiblePurchaseRewards()),
  doToast: (props) => dispatch(doToast(props)),
  doSetContentHistoryItem: (uri) => dispatch(doSetContentHistoryItem(uri)),
});

export default withRouter(connect(select, perform)(VideoViewer));
