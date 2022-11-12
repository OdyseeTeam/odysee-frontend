import { connect } from 'react-redux';

import { selectChannelClaimIdForUri, selectIsStreamPlaceholderForUri } from 'redux/selectors/claims';
import { doFetchChannelLiveStatus } from 'redux/actions/livestream';

import withStreamClaimRender from 'hocs/withStreamClaimRender';

import VideoClaimInitiator from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    channelClaimId: selectChannelClaimIdForUri(state, uri),
    isLivestreamClaim: selectIsStreamPlaceholderForUri(state, uri),
  };
};

const perform = {
  doFetchChannelLiveStatus,
};

export default withStreamClaimRender(connect(select, perform)(VideoClaimInitiator));
