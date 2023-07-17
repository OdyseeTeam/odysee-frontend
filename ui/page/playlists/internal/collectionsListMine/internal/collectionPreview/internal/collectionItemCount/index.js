import { connect } from 'react-redux';

import { selectCountForCollectionId } from 'redux/selectors/collections';

import CollectionItemCount from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    collectionCount: selectCountForCollectionId(state, collectionId),
  };
};

export default connect(select)(CollectionItemCount);
