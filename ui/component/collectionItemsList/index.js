import { connect } from 'react-redux';
import { doCollectionEdit } from 'redux/actions/collections';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { selectUrlsForCollectionId, selectUrlsForCollectionIdNonDeleted } from 'redux/selectors/collections';

import CollectionItemsList from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    collectionUrls:
      collectionId === COLLECTIONS_CONSTS.WATCH_LATER_ID
        ? selectUrlsForCollectionIdNonDeleted(state, collectionId)
        : selectUrlsForCollectionId(state, collectionId),
  };
};

const perform = {
  doCollectionEdit,
};

export default connect(select, perform)(CollectionItemsList);
