import { connect } from 'react-redux';
import { selectThumbnailForId } from 'redux/selectors/claims';
import { selectUrlsForCollectionId } from 'redux/selectors/collections';
import CollectionPreviewOverlay from './view';

const select = (state, props) => {
  const { collectionId } = props;

  return {
    collectionItemUrls: selectUrlsForCollectionId(state, collectionId, 3),
    collectionThumbnail: selectThumbnailForId(state, collectionId),
  };
};

export default connect(select)(CollectionPreviewOverlay);
