import { connect } from 'react-redux';

import { selectAreBuiltinCollectionsEmpty, selectHasCollections } from 'redux/selectors/collections';
import { doOpenModal } from 'redux/actions/app';

import PlaylistsPage from './view';

const select = (state) => ({
  areBuiltinCollectionsEmpty: selectAreBuiltinCollectionsEmpty(state),
  hasCollections: selectHasCollections(state),
});

const perform = {
  doOpenModal,
};

export default connect(select, perform)(PlaylistsPage);
