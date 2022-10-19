import { connect } from 'react-redux';
import { selectUrlsForCollectionId, selectNameForCollectionId } from 'redux/selectors/collections';
import PlaylistSection from './view';

const select = (state, props) => {
  // const { search } = props.collectionId;

  return {
    collectionUrls: selectUrlsForCollectionId(state, props.collectionId),
    collectionName: selectNameForCollectionId(state, props.collectionId),
  };
};

export default connect(select)(PlaylistSection);
