import { connect } from 'react-redux';
import { selectClaimForUri, selectTitleForUri } from 'redux/selectors/claims';
import { selectCollectionForId, selectCollectionForIdHasClaimUrl } from 'redux/selectors/collections';
import * as SETTINGS from 'constants/settings';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import {
  selectIsPlayerFloating,
  selectPrimaryUri,
  selectPlayingUri,
  makeSelectFileRenderModeForUri,
  selectAutoplayCountdownUri,
  selectCanViewFileForUri,
} from 'redux/selectors/content';
import { selectClientSetting } from 'redux/selectors/settings';
import { doClearQueueList } from 'redux/actions/collections';
import {
  doClearPlayingUri,
  doClearPlayingSource,
  doSetShowAutoplayCountdownForUri,
  doSetPlayingUri,
} from 'redux/actions/content';
import { doFetchRecommendedContent } from 'redux/actions/search';
import { selectHasAppDrawerOpen, selectMainPlayerDimensions } from 'redux/selectors/app';
import { selectIsActiveLivestreamForUri, selectSocketConnectionForId } from 'redux/selectors/livestream';
import { doCommentSocketConnect, doCommentSocketDisconnect } from 'redux/actions/websocket';
import { getVideoClaimAspectRatio, isClaimShort } from 'util/claim';
import { doOpenModal } from 'redux/actions/app';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
import VideoRenderFloating from './view';
import { selectShortsSidePanelOpen, selectShortsPlaylist } from '../../redux/selectors/shorts';

const select = (state, props) => {
  const search = state.router?.location?.search || '';
  const urlParams = new URLSearchParams(search);
  const collectionSidebarId = urlParams.get(COLLECTIONS_CONSTS.COLLECTION_ID);
  const isFloating = selectIsPlayerFloating(state);
  const autoplayCountdownUri = selectAutoplayCountdownUri(state);
  const playingUri = selectPlayingUri(state);
  const {
    collection: { collectionId },
  } = playingUri;
  // -- The autoplayCountdownUri will only be used to render the floating player components
  // i.e. display title, playlist, etc
  const uri = (!playingUri.sourceId && playingUri.uri) || autoplayCountdownUri;
  const claim = uri && selectClaimForUri(state, uri);
  const { claim_id: claimId, signing_channel: channelClaim, permanent_url } = claim || {};
  const { canonical_url: channelUrl } = channelClaim || {};
  const playingFromQueue = playingUri.source === COLLECTIONS_CONSTS.QUEUE_ID;
  const isInlinePlayer = Boolean(playingUri.source) && !isFloating;
  const shortsPlaylist = selectShortsPlaylist(state);
  return {
    claimId,
    channelUrl,
    channelTitle: channelUrl ? selectTitleForUri(state, channelUrl) || channelClaim?.name : channelClaim?.name,
    uri,
    playingUri,
    shortsPlaylist,
    autoPlayNextShort: selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT_SHORTS),
    primaryUri: selectPrimaryUri(state),
    title: selectTitleForUri(state, uri),
    isFloating,
    floatingPlayerEnabled: playingFromQueue || isInlinePlayer || selectClientSetting(state, SETTINGS.FLOATING_PLAYER),
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    videoTheaterMode: selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE),
    collectionId,
    collectionSidebarId,
    playingCollection: selectCollectionForId(state, collectionId),
    isCurrentClaimLive: selectIsActiveLivestreamForUri(state, uri),
    videoAspectRatio: getVideoClaimAspectRatio(claim),
    socketConnection: selectSocketConnectionForId(state, claimId),
    appDrawerOpen: selectHasAppDrawerOpen(state),
    hasClaimInQueue:
      permanent_url && selectCollectionForIdHasClaimUrl(state, COLLECTIONS_CONSTS.QUEUE_ID, permanent_url),
    mainPlayerDimensions: selectMainPlayerDimensions(state),
    contentUnlocked: claimId && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId),
    isAutoplayCountdown: !playingUri.uri && autoplayCountdownUri,
    autoplayCountdownUri,
    canViewFile: selectCanViewFileForUri(state, uri),
    sidePanelOpen: selectShortsSidePanelOpen(state),
    isClaimShort: typeof playingUri.isShort === 'boolean' ? playingUri.isShort : isClaimShort(claim),
    disableShortsView: !!collectionSidebarId || selectClientSetting(state, SETTINGS.DISABLE_SHORTS_VIEW),
  };
};

const perform = {
  doFetchRecommendedContent,
  doSetShowAutoplayCountdownForUri,
  doCommentSocketConnect,
  doCommentSocketDisconnect,
  doClearPlayingUri,
  doClearQueueList,
  doOpenModal,
  doClearPlayingSource,
  doSetPlayingUri,
};
export default connect(select, perform)(VideoRenderFloating);
