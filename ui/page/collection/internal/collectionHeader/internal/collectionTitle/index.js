import { connect } from 'react-redux';

import { selectTitleForCollectionId, selectCollectionHasEditsForId } from 'redux/selectors/collections';

import CollectionHeader from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    collectionName: selectTitleForCollectionId(state, collectionId),
    collectionHasEdits: selectCollectionHasEditsForId(state, collectionId),
  };
};

export default connect(select)(CollectionHeader);
