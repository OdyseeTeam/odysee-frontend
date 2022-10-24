import { connect } from 'react-redux';

import { selectCollectionTitleForId, selectCollectionHasEditsForId } from 'redux/selectors/collections';

import CollectionHeader from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    collectionTitle: selectCollectionTitleForId(state, collectionId),
    collectionHasEdits: selectCollectionHasEditsForId(state, collectionId),
  };
};

export default connect(select)(CollectionHeader);
