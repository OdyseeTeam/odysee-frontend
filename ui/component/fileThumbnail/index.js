import { connect } from 'react-redux';
import { selectHasResolvedClaimForUri, selectThumbnailForId, selectThumbnailForUri } from 'redux/selectors/claims';
import CardMedia from './view';

const select = (state, props) => {
  const { uri, id } = props;

  return {
    hasResolvedClaim: uri ? selectHasResolvedClaimForUri(state, uri) : undefined,
    thumbnailFromClaim: (id && selectThumbnailForId(state, id)) || (uri && selectThumbnailForUri(state, uri)),
  };
};

export default connect(select)(CardMedia);
