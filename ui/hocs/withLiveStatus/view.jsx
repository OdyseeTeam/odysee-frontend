// @flow
import React from 'react';

import { LIVESTREAM_STATUS_CHECK_INTERVAL_SOON, LIVESTREAM_STATUS_CHECK_INTERVAL } from 'constants/livestream';

type Props = {
  uri?: string,
  forceRender?: boolean, // -- renders the wrapped component even if there is no active livestream for the channel
  // -- redux --
  fasterPoll?: boolean,
  channelClaimId: string,
  activeLivestreamForChannel: ?LivestreamActiveClaim,
  alreadyListeningForIsLive: boolean,
  doFetchChannelIsLiveForId: (channelClaimId: string) => void,
  doSetIsLivePollingForChannelId: (channelId: string, isPolling: boolean) => void,
};

/**
 * HigherOrderComponent to fetch a channel's live status, listen for polling updates, and only render the passed Component if
 * there is an active livestream for the given channel
 *
 * @param Component: FunctionalComponentParam
 * @returns {FunctionalComponent}
 */
const withLiveStatus = (Component: FunctionalComponentParam) => {
  const LiveStatusWrapper = (props: Props) => {
    const {
      uri,
      forceRender,
      // -- redux --
      fasterPoll,
      channelClaimId,
      activeLivestreamForChannel,
      alreadyListeningForIsLive,
      doFetchChannelIsLiveForId,
      doSetIsLivePollingForChannelId,
    } = props;

    const isPolling = React.useRef(false);

    // if already polling, or listening for is_live, but not from this component. Don't poll/call again
    // otherwise keep polling in this component
    const outsitePolling = alreadyListeningForIsLive && !isPolling.current;
    const claimUri = activeLivestreamForChannel && activeLivestreamForChannel.uri;

    // Find out current channels status + active live claim every 30 seconds
    React.useEffect(() => {
      let intervalId;

      if (channelClaimId && !outsitePolling) {
        const fetch = () => doFetchChannelIsLiveForId(channelClaimId);

        fetch();

        const interval = fasterPoll ? LIVESTREAM_STATUS_CHECK_INTERVAL_SOON : LIVESTREAM_STATUS_CHECK_INTERVAL;
        intervalId = setInterval(fetch, interval);

        doSetIsLivePollingForChannelId(channelClaimId, true);
        isPolling.current = true;
      }

      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }, [outsitePolling, channelClaimId, doFetchChannelIsLiveForId, doSetIsLivePollingForChannelId, fasterPoll]);

    React.useEffect(() => {
      return () => {
        if (isPolling.current) doSetIsLivePollingForChannelId(channelClaimId, false);
      };

      // eslint-disable-next-line react-hooks/exhaustive-deps -- only unmount
    }, []);

    if (forceRender || (claimUri && claimUri !== uri)) {
      return <Component {...props} claimUri={claimUri || uri} />;
    }

    return null;
  };

  return LiveStatusWrapper;
};

export default withLiveStatus;
