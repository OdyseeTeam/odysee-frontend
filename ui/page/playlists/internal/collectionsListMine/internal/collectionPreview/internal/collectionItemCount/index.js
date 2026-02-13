import { connect } from 'react-redux';
import * as COLLECTIONS_CONSTS from 'constants/collections';

import { selectCountForCollectionId, selectCountForCollectionIdNonDeleted } from 'redux/selectors/collections';

import CollectionItemCount from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    collectionCount:
      collectionId === COLLECTIONS_CONSTS.WATCH_LATER_ID
        ? selectCountForCollectionIdNonDeleted(state, collectionId)
        : selectCountForCollectionId(state, collectionId),
  };
};

export default connect(select)(CollectionItemCount);
