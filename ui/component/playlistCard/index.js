import { connect } from 'react-redux';
import PlaylistCard from './view';
import { selectClaimForUri, selectChannelNameForId } from 'redux/selectors/claims';
import {
  selectUrlsForCollectionId,
  selectCollectionTitleForId,
  selectCollectionIsMine,
  selectHasPrivateCollectionForId,
  selectIndexForUrlInCollectionForId,
  selectCollectionLengthForId,
  selectCollectionIsEmptyForId,
  selectCollectionForId,
  selectCollectionSavedForId,
} from 'redux/selectors/collections';
import { selectPlayingUri } from 'redux/selectors/content';
import { doCollectionEdit, doClearQueueList, doToggleCollectionSavedForId } from 'redux/actions/collections';
import { doClearPlayingCollection } from 'redux/actions/content';
import { doOpenModal } from 'redux/actions/app';

const select = (state, props) => {
  const { id: collectionId } = props;

  const {
    uri: playingUri,
    collection: { collectionId: playingCollectionId },
  } = selectPlayingUri(state);

  const playingCurrentPlaylist = collectionId === playingCollectionId;
  const { permanent_url: playingItemUrl } = playingCurrentPlaylist ? selectClaimForUri(state, playingUri) || {} : {};

  return {
    playingItemUrl,
    playingCurrentPlaylist,
    collectionUrls: selectUrlsForCollectionId(state, collectionId),
    collectionName: selectCollectionTitleForId(state, collectionId),
    isMyCollection: selectCollectionIsMine(state, collectionId),
    isPrivateCollection: selectHasPrivateCollectionForId(state, collectionId),
    publishedCollectionName: selectChannelNameForId(state, collectionId),
    playingItemIndex: selectIndexForUrlInCollectionForId(state, playingCollectionId, playingItemUrl),
    collectionLength: selectCollectionLengthForId(state, collectionId),
    collectionEmpty: selectCollectionIsEmptyForId(state, collectionId),
    hasCollectionById: collectionId && Boolean(selectCollectionForId(state, collectionId)),
    playingCollectionId,
    collectionSavedForId: selectCollectionSavedForId(state, collectionId),
  };
};

const perform = {
  doCollectionEdit,
  doClearPlayingCollection,
  doClearQueueList,
  doOpenModal,
  doToggleCollectionSavedForId,
};

export default connect(select, perform)(PlaylistCard);
