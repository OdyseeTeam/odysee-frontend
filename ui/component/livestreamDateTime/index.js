import { connect } from 'react-redux';

import {
  selectMomentReleaseTimeForUri,
  selectChannelClaimIdForUri,
  selectClaimReleaseInFutureForUri,
} from 'redux/selectors/claims';
import {
  selectActiveLivestreamForChannel,
  selectClaimIsActiveChannelLivestreamForUri,
  selectLivestreamInfoAlreadyFetchedForCreatorId,
} from 'redux/selectors/livestream';

import { doFetchChannelIsLiveForId } from 'redux/actions/livestream';

import LivestreamDateTime from './view';

const select = (state, props) => {
  const { uri } = props;

  const channelClaimId = selectChannelClaimIdForUri(state, uri);

  return {
    channelClaimId,
    releaseTime: selectMomentReleaseTimeForUri(state, uri),
    activeLivestream: selectActiveLivestreamForChannel(state, channelClaimId),
    isCurrentClaimLive: selectClaimIsActiveChannelLivestreamForUri(state, uri),
    releaseInFuture: selectClaimReleaseInFutureForUri(state, uri),
    alreadyFetched: selectLivestreamInfoAlreadyFetchedForCreatorId(state, channelClaimId),
  };
};

const perform = {
  doFetchChannelIsLiveForId,
};

export default connect(select, perform)(LivestreamDateTime);
