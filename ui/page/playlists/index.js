import { connect } from 'react-redux';

import {
  selectAreBuiltinCollectionsEmpty,
  selectHasCollections,
  selectIsFetchingMyCollections,
} from 'redux/selectors/collections';

import { doFetchCollectionListMine } from 'redux/actions/collections';
import { doOpenModal } from 'redux/actions/app';

import PlaylistsPage from './view';

const select = (state) => ({
  areBuiltinCollectionsEmpty: selectAreBuiltinCollectionsEmpty(state),
  hasCollections: selectHasCollections(state),
  isFetchingCollections: selectIsFetchingMyCollections(state),
});

const perform = {
  doFetchCollectionListMine,
  doOpenModal,
};

export default connect(select, perform)(PlaylistsPage);
