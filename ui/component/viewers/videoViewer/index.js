import { connect } from 'react-redux';
import {
  selectClaimForUri,
  selectThumbnailForUri,
  selectPurchaseTagForUri,
  selectPurchaseMadeForClaimId,
  selectRentalTagForUri,
  selectProtectedContentTagForUri,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { isStreamPlaceholderClaim, getChannelIdFromClaim } from 'util/claim';
import { selectActiveLivestreamForChannel } from 'redux/selectors/livestream';
import { selectNextUriForUriInPlayingCollectionForId } from 'redux/selectors/collections';
import * as SETTINGS from 'constants/settings';
import * as TAGS from 'constants/tags';
import {
  doChangeVolume,
  doChangeMute,
  doAnalyticsBuffer,
  doAnalyticsViewForUri,
  doSetVideoSourceLoaded,
} from 'redux/actions/app';
import { selectVolume, selectMute } from 'redux/selectors/app';
import {
  savePosition,
  clearPosition,
  doPlayNextUri,
  doSetContentHistoryItem,
  doSetShowAutoplayCountdownForUri,
} from 'redux/actions/content';
import { selectContentPositionForUri, selectPlayingUri, selectIsPlayerFloating } from 'redux/selectors/content';
import VideoViewer from './view';
// withRouter removed in React Router v7 — use location from view.tsx instead
import { doClaimEligiblePurchaseRewards } from 'redux/actions/rewards';
import { selectDaemonSettings, selectClientSetting, selectHomepageData } from 'redux/selectors/settings';
import { toggleVideoTheaterMode, toggleAutoplayNext, doSetClientSetting } from 'redux/actions/settings';
import { selectUserVerifiedEmail, selectUser } from 'redux/selectors/user';
import { selectRecommendedContentForUri } from 'redux/selectors/search';
import { parseURI } from 'util/lbryURI';
import { doToast } from 'redux/actions/notifications';

import withPlaybackUris from 'hocs/withPlaybackUris';

const select = (state, props) => {
  const uri = props.uri;
  const claim = selectClaimForUri(state, uri);
  const position = selectContentPositionForUri(state, uri);
  const userId = selectUser(state) && selectUser(state).id;
  const internalFeature = selectUser(state) && selectUser(state).internal_feature;
  const playingUri = selectPlayingUri(state);
  const collectionId = playingUri.collection.collectionId;
  const isMarkdownOrComment = playingUri.source === 'markdown' || playingUri.source === 'comment';

  const nextPlaylistUri = collectionId && selectNextUriForUriInPlayingCollectionForId(state, collectionId, uri);

  return {
    position,
    userId,
    internalFeature,
    collectionId,
    nextPlaylistUri,
    isMarkdownOrComment,
    autoplayIfEmbedded: false, // TODO: derive from URL params in view.tsx
    autoplayNext: !isMarkdownOrComment && selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT),
    volume: selectVolume(state),
    muted: selectMute(state),
    videoPlaybackRate: selectClientSetting(state, SETTINGS.VIDEO_PLAYBACK_RATE),
    thumbnail: selectThumbnailForUri(state, uri),
    claim,
    homepageData: selectHomepageData(state) || {},
    authenticated: selectUserVerifiedEmail(state),
    shareTelemetry: true, // Always true for web
    videoTheaterMode: selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE),
    activeLivestreamForChannel: selectActiveLivestreamForChannel(state, getChannelIdFromClaim(claim)),
    isLivestreamClaim: isStreamPlaceholderClaim(claim),
    defaultQuality: selectClientSetting(state, SETTINGS.DEFAULT_VIDEO_QUALITY),
    isPurchasableContent: Boolean(selectPurchaseTagForUri(state, props.uri)),
    isRentableContent: Boolean(selectRentalTagForUri(state, props.uri)),
    purchaseMadeForClaimId: claim ? selectPurchaseMadeForClaimId(state, claim.claim_id) : undefined,
    isProtectedContent: Boolean(selectProtectedContentTagForUri(state, uri)),
    isDownloadDisabled: makeSelectTagInClaimOrChannelForUri(uri, TAGS.DISABLE_DOWNLOAD_BUTTON_TAG)(state),
    recomendedContent: selectRecommendedContentForUri(state, props.uri),
    autoPlayNextShort: selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT_SHORTS),
    isFloating: selectIsPlayerFloating(state),
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
  doPlayNextUri: (params) => dispatch(doPlayNextUri(params)),
  doAnalyticsViewForUri: (uri) => dispatch(doAnalyticsViewForUri(uri)),
  claimRewards: () => dispatch(doClaimEligiblePurchaseRewards()),
  doToast: (props) => dispatch(doToast(props)),
  doSetContentHistoryItem: (uri) => dispatch(doSetContentHistoryItem(uri)),
  doSetShowAutoplayCountdownForUri: (params) => dispatch(doSetShowAutoplayCountdownForUri(params)),
  doSetVideoSourceLoaded: (uri) => dispatch(doSetVideoSourceLoaded(uri)),
});

export default withPlaybackUris(connect(select, perform)(VideoViewer));
