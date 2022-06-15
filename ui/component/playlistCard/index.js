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
} from 'redux/selectors/collections';
import { selectPlayingUri } from 'redux/selectors/content';
import { doCollectionEdit } from 'redux/actions/collections';

const select = (state, props) => {
  const { id: collectionId } = props;

  const { uri: playingUri } = selectPlayingUri(state);
  const { permanent_url: url } = selectClaimForUri(state, playingUri) || {};

  const playingItemIndex = selectIndexForUrlInCollection(state, url, collectionId, true);

  return {
    url,
    collectionUrls: selectUrlsForCollectionId(state, collectionId),
    collectionName: selectNameForCollectionId(state, collectionId),
    isMyCollection: selectCollectionIsMine(state, collectionId),
    isPrivateCollection: selectIsCollectionPrivateForId(state, collectionId),
    publishedCollectionName: selectPublishedCollectionChannelNameForId(state, collectionId),
    playingItemIndex: playingItemIndex !== null ? playingItemIndex + 1 : 0,
    collectionLength: selectCollectionLengthForId(state, collectionId),
  };
};

const perform = {
  doCollectionEdit,
};

export default connect(select, perform)(PlaylistCard);
