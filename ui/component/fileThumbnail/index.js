import { connect } from 'react-redux';
import { doResolveUri } from 'redux/actions/claims';
import { selectHasResolvedClaimForUri, selectThumbnailForUri } from 'redux/selectors/claims';
import CardMedia from './view';

const select = (state, props) => {
  const { uri, secondaryUri } = props;

  return {
    hasResolvedClaim: uri ? selectHasResolvedClaimForUri(state, uri) : undefined,
    thumbnailFromClaim: selectThumbnailForUri(state, uri),
    thumbnailFromSecondaryClaim: selectThumbnailForUri(state, secondaryUri, true),
  };
};

const perform = {
  doResolveUri,
};

export default connect(select, perform)(CardMedia);
