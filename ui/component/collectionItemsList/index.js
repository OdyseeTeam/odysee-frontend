import { connect } from 'react-redux';
import { doCollectionEdit } from 'redux/actions/collections';
import { selectUrlsForCollectionId } from 'redux/selectors/collections';

import CollectionItemsList from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    collectionUrls: selectUrlsForCollectionId(state, collectionId),
  };
};

const perform = {
  doCollectionEdit,
};

export default connect(select, perform)(CollectionItemsList);
