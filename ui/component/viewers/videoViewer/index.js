import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import { isStreamPlaceholderClaim } from 'util/claim';
import {
  selectNextUrlForCollectionAndUrl,
  selectPreviousUrlForCollectionAndUrl,
  selectIndexForUrlInCollection,
} from 'redux/selectors/collections';
import * as SETTINGS from 'constants/settings';
import { doChangeVolume, doChangeMute, doSetWindowPlayerObj } from 'redux/actions/app';
import { selectVolume, selectMute } from 'redux/selectors/app';
import { savePosition, clearPosition, doUriInitiatePlay, doSetContentHistoryItem } from 'redux/actions/content';
import { makeSelectIsPlayerFloating, selectContentPositionForUri, selectPlayingUri } from 'redux/selectors/content';
import { selectRecommendedContentForUri } from 'redux/selectors/search';
import VideoViewer from './view';
import { withRouter } from 'react-router';
import { selectClientSetting, selectHomepageData } from 'redux/selectors/settings';
import { toggleVideoTheaterMode, toggleAutoplayNext, doSetClientSetting } from 'redux/actions/settings';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { parseURI } from 'util/lbryURI';

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
  const playingUri = selectPlayingUri(state);
  const collectionId = playingUri.collection.collectionId;
  const isMarkdownOrComment = playingUri.source === 'markdown' || playingUri.source === 'comment';

  const nextPlaylistUri = collectionId && selectNextUrlForCollectionAndUrl(state, uri, collectionId);
  const previousPlaylistUri = collectionId && selectPreviousUrlForCollectionAndUrl(state, uri, collectionId);
  const recomendedContent = selectRecommendedContentForUri(state, uri);
  const nextRecommendedUri = recomendedContent && recomendedContent[0];

  return {
    position,
    collectionId,
    nextPlaylistUri,
    nextRecommendedUri,
    previousListUri: previousPlaylistUri,
    isMarkdownOrComment,
    autoplayIfEmbedded: Boolean(autoplay),
    autoplayNext: !isMarkdownOrComment && selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT),
    volume: selectVolume(state),
    muted: selectMute(state),
    videoPlaybackRate: selectClientSetting(state, SETTINGS.VIDEO_PLAYBACK_RATE),
    claim,
    homepageData: selectHomepageData(state),
    authenticated: selectUserVerifiedEmail(state),
    isFloating: makeSelectIsPlayerFloating(props.location)(state),
    videoTheaterMode: selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE),
    isLivestreamClaim: isStreamPlaceholderClaim(claim),
    currentPlaylistItemIndex: selectIndexForUrlInCollection(state, uri, collectionId),
  };
};

const perform = (dispatch) => ({
  changeVolume: (volume) => dispatch(doChangeVolume(volume)),
  savePosition: (uri, position) => dispatch(savePosition(uri, position)),
  clearPosition: (uri) => dispatch(clearPosition(uri)),
  changeMute: (muted) => dispatch(doChangeMute(muted)),
  toggleVideoTheaterMode: () => dispatch(toggleVideoTheaterMode()),
  toggleAutoplayNext: () => dispatch(toggleAutoplayNext()),
  setVideoPlaybackRate: (rate) => dispatch(doSetClientSetting(SETTINGS.VIDEO_PLAYBACK_RATE, rate)),
  doPlayUri: (params) => dispatch(doUriInitiatePlay(params, true, true)),
  doSetContentHistoryItem: (uri) => dispatch(doSetContentHistoryItem(uri)),
  doSetWindowPlayerObj: (player) => dispatch(doSetWindowPlayerObj(player)),
});

export default withRouter(connect(select, perform)(VideoViewer));
