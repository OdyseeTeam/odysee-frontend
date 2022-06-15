import { connect } from 'react-redux';
import {
  selectNameForCollectionId,
  selectIsCollectionBuiltInForId,
  selectPublishedCollectionNotEditedForId,
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
    collectionName: selectNameForCollectionId(state, props.collectionId),
    playNextUri,
    isBuiltin: selectIsCollectionBuiltInForId(state, props.collectionId),
    publishedNotEdited: selectPublishedCollectionNotEditedForId(state, props.collectionId),
  };
};

const perform = (dispatch) => ({
  doOpenModal: (modal, props) => dispatch(doOpenModal(modal, props)),
  doToggleShuffleList: (params) => dispatch(doToggleShuffleList(params)),
});

export default connect(select, perform)(CollectionMenuList);
