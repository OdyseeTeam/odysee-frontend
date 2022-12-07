import { connect } from 'react-redux';

import { selectChannelClaimIdForUri } from 'redux/selectors/claims';
import {
  selectActiveLivestreamForChannel,
  selectIsLivePollingForUri,
  selectLiveClaimReleaseStartingSoonForUri,
  selectLivestreamInfoAlreadyFetchedForCreatorId,
  selectSocketConnectedForUri,
} from 'redux/selectors/livestream';

import { doFetchChannelIsLiveForId, doSetIsLivePollingForChannelId } from 'redux/actions/livestream';

import withLiveStatus from './view';

const select = (state, props) => {
  const { uri } = props;

  const channelClaimId = selectChannelClaimIdForUri(state, uri);

  return {
    channelClaimId,
    activeLivestreamForChannel: selectActiveLivestreamForChannel(state, channelClaimId),
    alreadyLivePolling: selectIsLivePollingForUri(state, uri),
    socketConnected: selectSocketConnectedForUri(state, uri),
    fasterPoll: selectLiveClaimReleaseStartingSoonForUri(state, uri),
    alreadyDidInitialFetch: selectLivestreamInfoAlreadyFetchedForCreatorId(state, channelClaimId),
  };
};

const perform = {
  doFetchChannelIsLiveForId,
  doSetIsLivePollingForChannelId,
};

export default (Component) => connect(select, perform)(withLiveStatus(Component));
