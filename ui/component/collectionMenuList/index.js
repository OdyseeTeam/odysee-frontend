import { connect } from 'react-redux';
import {
  selectCollectionTitleForId,
  selectIsCollectionBuiltInForId,
  selectPublishedCollectionNotEditedForId,
  selectCollectionIsEmptyForId,
  selectCollectionIsMine,
} from 'redux/selectors/collections';
import { doOpenModal } from 'redux/actions/app';
import { doEnableCollectionShuffle } from 'redux/actions/content';
import CollectionMenuList from './view';

const select = (state, props) => {
  const collectionId = props.collectionId;

  return {
    collectionName: selectCollectionTitleForId(state, collectionId),
    isBuiltin: selectIsCollectionBuiltInForId(state, collectionId),
    publishedNotEdited: selectPublishedCollectionNotEditedForId(state, collectionId),
    collectionEmpty: selectCollectionIsEmptyForId(state, collectionId),
    isMyCollection: selectCollectionIsMine(state, collectionId),
  };
};

const perform = {
  doOpenModal,
  doEnableCollectionShuffle,
};

export default connect(select, perform)(CollectionMenuList);
