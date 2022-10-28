import { connect } from 'react-redux';
import {
  selectIsFetchingMyCollections,
  selectMyPublishedCollections,
  selectMyUnpublishedCollections,
  selectMyEditedCollections,
  selectMyUpdatedCollections,
  selectSavedCollectionIds,
  selectSavedCollections,
  selectHasCollections,
  selectCollectionsById,
} from 'redux/selectors/collections';
import { doResolveClaimIds } from 'redux/actions/claims';
import { doFetchCollectionListMine } from 'redux/actions/collections';

import CollectionsListMine from './view';

const select = (state) => ({
  publishedCollections: selectMyPublishedCollections(state),
  unpublishedCollections: selectMyUnpublishedCollections(state),
  editedCollections: selectMyEditedCollections(state),
  updatedCollections: selectMyUpdatedCollections(state),
  savedCollectionIds: selectSavedCollectionIds(state),
  savedCollections: selectSavedCollections(state),
  isFetchingCollections: selectIsFetchingMyCollections(state),
  hasCollections: selectHasCollections(state),
  collectionsById: selectCollectionsById(state),
});

const perform = {
  doResolveClaimIds,
  doFetchCollectionListMine,
};

export default connect(select, perform)(CollectionsListMine);
