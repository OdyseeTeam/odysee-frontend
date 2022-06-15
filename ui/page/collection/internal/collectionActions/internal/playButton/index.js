import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectUrlsForCollectionId } from 'redux/selectors/collections';
import ShuffleButton from './view';

const select = (state, props) => {
  const { collectionId } = props;

  const collectionUrls = selectUrlsForCollectionId(state, collectionId);

  let firstItem;
  if (collectionUrls) {
    // this will help play the first valid claim in a list
    // in case the first urls have been deleted
    collectionUrls.map((url) => {
      const claim = selectClaimForUri(state, url);
      if (firstItem === undefined && claim) {
        firstItem = claim.permanent_url;
      }
    });
  }

  return {
    uri: firstItem,
  };
};

export default connect(select)(ShuffleButton);
