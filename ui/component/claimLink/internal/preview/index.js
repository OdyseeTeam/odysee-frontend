import { connect } from 'react-redux';

import { selectIsStreamPlaceholderForUri } from 'redux/selectors/claims';
import { selectPlayingUri, makeSelectFileRenderModeForUri } from 'redux/selectors/content';

import ClaimLinkPreview from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    playingUri: selectPlayingUri(state),
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    isLivestreamClaim: selectIsStreamPlaceholderForUri(state, uri),
  };
};

export default connect(select)(ClaimLinkPreview);
