import { connect } from 'react-redux';
import {
  selectMyPublishedCollections,
  selectMyUnpublishedCollections,
  selectMyEditedCollections,
  selectMyUpdatedCollections,
  selectSavedCollectionIds,
  selectSavedCollections,
  selectHasCollections,
  selectFeaturedChannelsIds,
  selectCollectionsById,
} from 'redux/selectors/collections';
import { selectIsFetchingMyCollections } from 'redux/selectors/claims';
import { doFetchItemsInCollections } from 'redux/actions/collections';
import CollectionsListMine from './view';

const select = (state) => ({
  publishedCollections: selectMyPublishedCollections(state),
  unpublishedCollections: selectMyUnpublishedCollections(state),
  editedCollections: selectMyEditedCollections(state),
  updatedCollections: selectMyUpdatedCollections(state),
  savedCollectionIds: selectSavedCollectionIds(state),
  savedCollections: selectSavedCollections(state),
  featuredChannelsIds: selectFeaturedChannelsIds(state),
  isFetchingCollections: selectIsFetchingMyCollections(state),
  hasCollections: selectHasCollections(state),
  collectionsById: selectCollectionsById(state),
});

const perform = {
  doFetchItemsInCollections,
};

export default connect(select, perform)(CollectionsListMine);
