// @flow
import React from 'react';
import Page from 'component/page';
import { getLivestreamUris } from 'util/livestream';
import ScheduledStreams from 'component/scheduledStreams';
import { splitBySeparator } from 'util/lbryURI';

type Props = {
  authenticated: boolean,
  subscribedChannels: Array<Subscription>,
  activeLivestreams: any,
  doFetchActiveLivestreams: () => void,
  fetchingActiveLivestreams: boolean,
};

export default function CalendarPage(props: Props) {
  const {
    authenticated,
    subscribedChannels,
    activeLivestreams,
    // doFetchActiveLivestreams,
    fetchingActiveLivestreams,
  } = props;

  const channelIds = subscribedChannels.map((sub) => splitBySeparator(sub.uri)[1]);

  return (
    <Page className="notification-page">
      <h1 className="post__title">Placeholder</h1>
      <p>Yeah, it's just a placeholder.</p>
      <img src="https://c.tenor.com/GM2NnQyP96cAAAAd/the-office-crying.gif" />
      {!fetchingActiveLivestreams && (
        <>
          {authenticated && channelIds.length > 0 && (
            <ScheduledStreams
              channelIds={channelIds}
              tileLayout
              liveUris={getLivestreamUris(activeLivestreams, channelIds)}
              limitClaimsPerChannel={2}
            />
          )}
        </>
      )}
    </Page>
  );
}
