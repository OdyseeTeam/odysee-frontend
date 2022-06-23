import { connect } from 'react-redux';
import PlaylistCard from './view';
import { selectClaimForUri } from 'redux/selectors/claims';
import {
  selectUrlsForCollectionId,
  selectNameForCollectionId,
  selectCollectionIsMine,
  selectIsCollectionPrivateForId,
  selectPublishedCollectionChannelNameForId,
  selectIndexForUrlInCollection,
  selectCollectionLengthForId,
  selectCollectionIsEmptyForId,
  selectCollectionForId,
} from 'redux/selectors/collections';
import { selectPlayingUri } from 'redux/selectors/content';
import { doCollectionEdit } from 'redux/actions/collections';

const select = (state, props) => {
  const { id: collectionId } = props;

  const {
    uri: playingUri,
    collection: { collectionId: playingCollectionId },
  } = selectPlayingUri(state);

  const { permanent_url: playingItemUrl } =
    collectionId === playingCollectionId ? selectClaimForUri(state, playingUri) || {} : {};
  const playingItemIndex = selectIndexForUrlInCollection(state, playingItemUrl, playingCollectionId, true);

  return {
    playingItemUrl,
    collectionUrls: selectUrlsForCollectionId(state, collectionId),
    collectionName: selectNameForCollectionId(state, collectionId),
    isMyCollection: selectCollectionIsMine(state, collectionId),
    isPrivateCollection: selectIsCollectionPrivateForId(state, collectionId),
    publishedCollectionName: selectPublishedCollectionChannelNameForId(state, collectionId),
    playingItemIndex: playingItemIndex !== null ? playingItemIndex + 1 : 0,
    collectionLength: selectCollectionLengthForId(state, collectionId),
    collectionEmpty: selectCollectionIsEmptyForId(state, collectionId),
    hasCollectionById: collectionId && Boolean(selectCollectionForId(state, collectionId)),
  };
};

const perform = {
  doCollectionEdit,
};

export default connect(select, perform)(PlaylistCard);
