import { connect } from 'react-redux';
import {
  selectTitleForCollectionId,
  selectIsCollectionBuiltInForId,
  selectIsMyPublicCollectionNotEditedForId,
  selectCollectionIsEmptyForId,
  selectCollectionIsMineForId,
} from 'redux/selectors/collections';
import { doOpenModal } from 'redux/actions/app';
import { doToggleShuffleList } from 'redux/actions/content';
import CollectionMenuList from './view';

const select = (state, props) => {
  const collectionId = props.collectionId;

  return {
    collectionName: selectTitleForCollectionId(state, collectionId),
    isBuiltin: selectIsCollectionBuiltInForId(state, collectionId),
    publishedNotEdited: selectIsMyPublicCollectionNotEditedForId(state, collectionId),
    collectionEmpty: selectCollectionIsEmptyForId(state, collectionId),
    isMyCollection: selectCollectionIsMineForId(state, collectionId),
  };
};

const perform = (dispatch) => ({
  doOpenModal: (modal, props) => dispatch(doOpenModal(modal, props)),
  doToggleShuffleList: (params) => dispatch(doToggleShuffleList(params)),
});

export default connect(select, perform)(CollectionMenuList);
