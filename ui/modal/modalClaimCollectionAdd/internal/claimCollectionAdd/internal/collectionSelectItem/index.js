import { connect } from 'react-redux';
import {
  selectCollectionForId,
  selectCollectionForIdHasClaimUrl,
  selectIsCollectionBuiltInForId
} from 'redux/selectors/collections';
import { makeSelectClaimIsPending } from 'redux/selectors/claims';
import { doPlaylistAddAndAllowPlaying } from 'redux/actions/content';
import CollectionSelectItem from './view';

const select = (state, props) => {
  const { collectionId, uri } = props;

  return {
    collection: selectCollectionForId(state, collectionId),
    collectionHasClaim: selectCollectionForIdHasClaimUrl(state, collectionId, uri),
    collectionPending: makeSelectClaimIsPending(collectionId)(state),
    isBuiltin: selectIsCollectionBuiltInForId(state, collectionId),
  };
};

const perform = {
  doPlaylistAddAndAllowPlaying,
};

export default connect(select, perform)(CollectionSelectItem);
