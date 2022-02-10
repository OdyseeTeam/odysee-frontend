import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { doToggleShuffleList } from 'redux/actions/content';
import { makeSelectEditedCollectionForId } from 'redux/selectors/collections';
import { selectListShuffle } from 'redux/selectors/content';
import CollectionMenuItems from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    editedCollection: makeSelectEditedCollectionForId(collectionId)(state),
    shuffleList: selectListShuffle(state),
  };
};

const perform = {
  doToggleShuffleList,
  doOpenModal,
};

export default connect(select, perform)(CollectionMenuItems);
