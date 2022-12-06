import { connect } from 'react-redux';

import { selectChannelClaimIdForUri } from 'redux/selectors/claims';
import {
  selectActiveLivestreamForChannel,
  selectIsListeningForIsLiveForUri,
  selectLiveClaimReleaseStartingSoonForUri,
} from 'redux/selectors/livestream';

import { doFetchChannelIsLiveForId, doSetIsLivePollingForChannelId } from 'redux/actions/livestream';

import withLiveStatus from './view';

const select = (state, props) => {
  const { uri } = props;

  const channelClaimId = selectChannelClaimIdForUri(state, uri);

  return {
    channelClaimId,
    activeLivestreamForChannel: selectActiveLivestreamForChannel(state, channelClaimId),
    alreadyListeningForIsLive: selectIsListeningForIsLiveForUri(state, uri),
    fasterPoll: selectLiveClaimReleaseStartingSoonForUri(state, uri),
  };
};

const perform = {
  doFetchChannelIsLiveForId,
  doSetIsLivePollingForChannelId,
};

export default (Component) => connect(select, perform)(withLiveStatus(Component));
