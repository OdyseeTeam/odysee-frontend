import { connect } from 'react-redux';

import { selectIsStreamPlaceholderForUri } from 'redux/selectors/claims';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { selectShowScheduledLiveInfoForUri, selectLiveClaimReleaseStartingSoonForUri } from 'redux/selectors/livestream';

import withResolvedClaimRender from 'hocs/withResolvedClaimRender';

import EmbedClaimComponent from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    isLivestreamClaim: selectIsStreamPlaceholderForUri(state, uri),
    showScheduledInfo: selectShowScheduledLiveInfoForUri(state, uri),
    liveClaimStartingSoon: selectLiveClaimReleaseStartingSoonForUri(state, uri),
  };
};

export default withResolvedClaimRender(connect(select)(EmbedClaimComponent));
