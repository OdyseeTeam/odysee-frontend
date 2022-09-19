import { connect } from 'react-redux';
import { selectHasResolvedClaimForUri, selectThumbnailForUri } from 'redux/selectors/claims';
import CardMedia from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    hasResolvedClaim: uri ? selectHasResolvedClaimForUri(state, uri) : undefined,
    thumbnailFromClaim: selectThumbnailForUri(state, uri),
  };
};

export default connect(select)(CardMedia);
