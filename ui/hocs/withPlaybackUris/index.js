import { connect } from 'react-redux';

import * as SETTINGS from 'constants/settings';

import { selectIsStreamPlaceholderForUri } from 'redux/selectors/claims';
import {
  selectNextUriForUriInPlayingCollectionForId,
  selectPreviousUriForUriInPlayingCollectionForId,
  selectIndexForUriInPlayingCollectionForId,
} from 'redux/selectors/collections';
import { selectPlayingCollectionId } from 'redux/selectors/content';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectNextRecommendedContentForUri } from 'redux/selectors/search';

import { doClearPlayingUri, doClearPlayingSource } from 'redux/actions/content';
import { doFetchRecommendedContent } from 'redux/actions/search';
import { doCommentSocketConnect, doCommentSocketDisconnect } from 'redux/actions/websocket';
import { doClearQueueList } from 'redux/actions/collections';
import { doOpenModal } from 'redux/actions/app';

import withPlaybackUris from './view';

const select = (state, props) => {
  const { uri } = props;
  const playingCollectionId = selectPlayingCollectionId(state);

  return {
    nextPlaylistUri:
      playingCollectionId && selectNextUriForUriInPlayingCollectionForId(state, playingCollectionId, uri),
    previousListUri:
      playingCollectionId && selectPreviousUriForUriInPlayingCollectionForId(state, playingCollectionId, uri),
    autoplayNext: selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT),
    nextRecommendedUri: selectNextRecommendedContentForUri(state, uri),
    currentPlaylistItemIndex:
      playingCollectionId && selectIndexForUriInPlayingCollectionForId(state, playingCollectionId, uri),
    isLivestreamClaim: selectIsStreamPlaceholderForUri(state, uri),
  };
};

const perform = {
  doFetchRecommendedContent,
  doCommentSocketConnect,
  doCommentSocketDisconnect,
  doClearPlayingUri,
  doClearQueueList,
  doOpenModal,
  doClearPlayingSource,
};

export default (Component) => connect(select, perform)(withPlaybackUris(Component));
