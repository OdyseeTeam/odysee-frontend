import { connect } from 'react-redux';

import { selectMomentReleaseTimeForUri, selectChannelClaimIdForUri } from 'redux/selectors/claims';
import {
  selectActiveLivestreamForChannel,
  selectClaimIsActiveChannelLivestreamForUri,
} from 'redux/selectors/livestream';

import withLiveStatus from 'hocs/withLiveStatus';

import LivestreamDateTime from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    releaseTime: selectMomentReleaseTimeForUri(state, uri),
    activeLivestream: selectActiveLivestreamForChannel(state, selectChannelClaimIdForUri(state, uri)),
    isCurrentClaimLive: selectClaimIsActiveChannelLivestreamForUri(state, uri),
  };
};

export default withLiveStatus(connect(select)(LivestreamDateTime));
