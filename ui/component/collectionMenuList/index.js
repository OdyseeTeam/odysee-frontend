import { connect } from 'react-redux';
import {
  selectCollectionTitleForId,
  selectIsCollectionBuiltInForId,
  selectPublishedCollectionNotEditedForId,
  selectCollectionIsEmptyForId,
  selectCollectionIsMine,
} from 'redux/selectors/collections';
import { doOpenModal } from 'redux/actions/app';
import { selectListShuffleForId } from 'redux/selectors/content';
import { doToggleShuffleList } from 'redux/actions/content';
import CollectionMenuList from './view';

const select = (state, props) => {
  const collectionId = props.collectionId;
  const shuffleList = selectListShuffleForId(state, collectionId);
  const playNextUri = shuffleList && shuffleList.newUrls[0];

  return {
    collectionName: selectCollectionTitleForId(state, collectionId),
    playNextUri,
    isBuiltin: selectIsCollectionBuiltInForId(state, collectionId),
    publishedNotEdited: selectPublishedCollectionNotEditedForId(state, collectionId),
    collectionEmpty: selectCollectionIsEmptyForId(state, collectionId),
    isMyCollection: selectCollectionIsMine(state, collectionId),
  };
};

const perform = (dispatch) => ({
  doOpenModal: (modal, props) => dispatch(doOpenModal(modal, props)),
  doToggleShuffleList: (params) => dispatch(doToggleShuffleList(params)),
});

export default connect(select, perform)(CollectionMenuList);
