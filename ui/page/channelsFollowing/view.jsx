// @flow
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import * as CS from 'constants/claim_search';
import { SIMPLE_SITE } from 'config';
import React from 'react';
import ChannelsFollowingDiscoverPage from 'page/channelsFollowingDiscover';
import LivestreamSection from 'page/discover/internal/livestreamSection';
import ClaimListDiscover from 'component/claimListDiscover';
import Page from 'component/page';
import Button from 'component/button';
import Icon from 'component/common/icon';
import { tagSearchCsOptionsHook } from 'util/search';
import ScheduledStreams from 'component/scheduledStreams';
import usePersistedState from 'effects/use-persisted-state';

type Props = {
  subscribedChannels: Array<Subscription>,
  channelIds: Array<string>,
  tileLayout: boolean,
  activeLivestreamUris: ?Array<string>,
  doFetchAllActiveLivestreamsForQuery: () => void,
  fetchingActiveLivestreams: boolean,
  hideScheduledLivestreams: boolean,
};

function ChannelsFollowingPage(props: Props) {
  const {
    subscribedChannels,
    channelIds,
    tileLayout,
    activeLivestreamUris,
    doFetchAllActiveLivestreamsForQuery,
    fetchingActiveLivestreams,
    hideScheduledLivestreams,
  } = props;

  const hasSubscribedChannels = subscribedChannels.length > 0;
  const [hideMembersOnly] = usePersistedState('channelPage-hideMembersOnly', false);

  React.useEffect(() => {
    doFetchAllActiveLivestreamsForQuery();
  }, []);

  return !hasSubscribedChannels ? (
    <ChannelsFollowingDiscoverPage />
  ) : (
    <Page noFooter fullWidthPage={tileLayout} className="main__channelsFollowing">
      {!fetchingActiveLivestreams && (
        <>
          {!hideScheduledLivestreams && (
            <ScheduledStreams
              channelIds={channelIds}
              tileLayout={tileLayout}
              liveUris={activeLivestreamUris}
              limitClaimsPerChannel={2}
            />
          )}

          <ClaimListDiscover
            streamType={SIMPLE_SITE ? CS.CONTENT_ALL : undefined}
            tileLayout={tileLayout}
            headerLabel={
              <>
                <span className="icon__wrapper">
                  <Icon icon={ICONS.SUBSCRIBE} size={10} />
                </span>
                <label>{__('Following')}</label>
              </>
            }
            hideMembersOnly={hideMembersOnly}
            defaultOrderBy={CS.ORDER_BY_NEW}
            channelIds={channelIds}
            meta={
              <>
                <Button
                  icon={ICONS.SEARCH}
                  button="secondary"
                  label={__('Discover Channels')}
                  navigate={`/$/${PAGES.CHANNELS_FOLLOWING_DISCOVER}`}
                />
                <Button
                  icon={ICONS.SETTINGS}
                  button="secondary"
                  label={__('Manage')}
                  navigate={`/$/${PAGES.CHANNELS_FOLLOWING_MANAGE}`}
                />
              </>
            }
            subSection={<LivestreamSection tileLayout={tileLayout} channelIds={channelIds} />}
            hasSource
            csOptionsHook={tagSearchCsOptionsHook}
          />
        </>
      )}
    </Page>
  );
}

export default ChannelsFollowingPage;
