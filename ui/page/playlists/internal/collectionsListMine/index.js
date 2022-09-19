import { connect } from 'react-redux';
import {
  selectMyPublicLocalCollections,
  selectMyUnpublishedCollections,
  selectMyEditedCollections,
  selectMyUpdatedCollections,
  selectSavedCollectionIds,
  selectSavedCollections,
  selectAreBuiltinCollectionsEmpty,
  selectHasCollections,
  selectFeaturedChannelsIds,
  selectIsFetchingMyCollectionClaims,
} from 'redux/selectors/collections';
import { doOpenModal } from 'redux/actions/app';
import { doResolveClaimIds } from 'redux/actions/claims';
import CollectionsListMine from './view';

const select = (state) => ({
  publishedCollections: selectMyPublicLocalCollections(state),
  unpublishedCollections: selectMyUnpublishedCollections(state),
  editedCollections: selectMyEditedCollections(state),
  updatedCollections: selectMyUpdatedCollections(state),
  savedCollectionIds: selectSavedCollectionIds(state),
  savedCollections: selectSavedCollections(state),
  featuredChannelsIds: selectFeaturedChannelsIds(state),
  isFetchingCollections: selectIsFetchingMyCollectionClaims(state),
  areBuiltinCollectionsEmpty: selectAreBuiltinCollectionsEmpty(state),
  hasCollections: selectHasCollections(state),
});

const perform = {
  doOpenModal,
  doResolveClaimIds,
};

export default connect(select, perform)(CollectionsListMine);
