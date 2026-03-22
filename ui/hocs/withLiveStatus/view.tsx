import React from 'react';
import { LIVESTREAM_STATUS_CHECK_INTERVAL_SOON, LIVESTREAM_STATUS_CHECK_INTERVAL } from 'constants/livestream';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectChannelClaimIdForUri } from 'redux/selectors/claims';
import {
  selectActiveLivestreamForChannel,
  selectIsLivePollingForUri,
  selectLiveClaimReleaseStartingSoonForUri,
  selectLivestreamInfoAlreadyFetchedForCreatorId,
  selectSocketConnectedForUri,
} from 'redux/selectors/livestream';
import { doFetchChannelIsLiveForId, doSetIsLivePollingForChannelId } from 'redux/actions/livestream';

type Props = {
  uri?: string;
  forceRender?: string;
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
    const { uri, forceRender } = props;
    const dispatch = useAppDispatch();
    const channelClaimId = useAppSelector((state) => selectChannelClaimIdForUri(state, uri));
    const activeLivestreamForChannel = useAppSelector((state) =>
      selectActiveLivestreamForChannel(state, channelClaimId)
    );
    const alreadyLivePolling = useAppSelector((state) => selectIsLivePollingForUri(state, uri));
    const socketConnected = useAppSelector((state) => selectSocketConnectedForUri(state, uri));
    const fasterPoll = useAppSelector((state) => selectLiveClaimReleaseStartingSoonForUri(state, uri));
    const alreadyDidInitialFetch = useAppSelector((state) =>
      selectLivestreamInfoAlreadyFetchedForCreatorId(state, channelClaimId)
    );

    const isPolling = React.useRef(false);
    // if already polling, or listening for is_live, but not from this component. Don't poll/call again
    // otherwise keep polling in this component
    const outsitePolling = alreadyLivePolling && !isPolling.current;
    const claimUri = activeLivestreamForChannel && activeLivestreamForChannel.uri;
    // Find out current channels status + active live claim every 30 seconds
    React.useEffect(() => {
      if (socketConnected) return;
      let intervalId;

      if (channelClaimId && !outsitePolling) {
        const fetch = () => dispatch(doFetchChannelIsLiveForId(channelClaimId));

        if (!alreadyDidInitialFetch) fetch();
        const interval = fasterPoll ? LIVESTREAM_STATUS_CHECK_INTERVAL_SOON : LIVESTREAM_STATUS_CHECK_INTERVAL;
        intervalId = setInterval(fetch, interval);
        dispatch(doSetIsLivePollingForChannelId(channelClaimId, true));
        isPolling.current = true;
      }

      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }, [outsitePolling, channelClaimId, dispatch, fasterPoll, alreadyDidInitialFetch, socketConnected]);
    React.useEffect(() => {
      return () => {
        if (isPolling.current) dispatch(doSetIsLivePollingForChannelId(channelClaimId, false));
      }; // eslint-disable-next-line react-hooks/exhaustive-deps -- only unmount
    }, []);

    if (forceRender || (claimUri && claimUri !== uri)) {
      return (
        <Component
          {...props}
          channelClaimId={channelClaimId}
          activeLivestreamForChannel={activeLivestreamForChannel}
          alreadyLivePolling={alreadyLivePolling}
          socketConnected={socketConnected}
          fasterPoll={fasterPoll}
          alreadyDidInitialFetch={alreadyDidInitialFetch}
          claimUri={claimUri || uri}
        />
      );
    }

    return null;
  };

  return LiveStatusWrapper;
};

export default withLiveStatus;
