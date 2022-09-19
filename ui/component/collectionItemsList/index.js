import { connect } from 'react-redux';
import { doCollectionEdit, doFetchItemsInCollection } from 'redux/actions/collections';
import {
  selectUrlsForCollectionId,
  selectIsCollectionItemsFetchingForId,
  selectIsCollectionPrivateForId,
  selectCollectionForId,
  selectCollectionHasEditsForId,
} from 'redux/selectors/collections';

import CollectionItemsList from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    collectionUrls: selectUrlsForCollectionId(state, collectionId),
    collection: selectCollectionForId(state, collectionId),
    fetchingItems: selectIsCollectionItemsFetchingForId(state, collectionId),
    isPrivateCollection: selectIsCollectionPrivateForId(state, collectionId),
    isEditedCollection: selectCollectionHasEditsForId(state, collectionId),
  };
};

const perform = {
  doCollectionEdit,
  doFetchItemsInCollection,
};

export default connect(select, perform)(CollectionItemsList);
