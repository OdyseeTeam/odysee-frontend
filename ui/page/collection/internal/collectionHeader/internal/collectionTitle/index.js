import { connect } from 'react-redux';

import {
  selectCollectionTitleForId,
  selectCollectionHasEditsForId,
  selectCollectionIsMine,
  selectCollectionTypeForId,
} from 'redux/selectors/collections';

import CollectionHeader from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    collectionTitle: selectCollectionTitleForId(state, collectionId),
    collectionHasEdits: selectCollectionHasEditsForId(state, collectionId),
    isMyCollection: selectCollectionIsMine(state, collectionId),
    collectionType: selectCollectionTypeForId(state, collectionId),
  };
};

export default connect(select)(CollectionHeader);
