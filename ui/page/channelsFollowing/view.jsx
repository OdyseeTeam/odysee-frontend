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
import useComponentDidMount from 'effects/use-component-did-mount';
import usePersistedState from 'effects/use-persisted-state';

type Props = {
  channelIds: Array<string>,
  tileLayout: boolean,
  activeLivestreamUris: ?Array<string>,
  doFetchAllActiveLivestreamsForQuery: () => void,
  fetchingActiveLivestreams: boolean,
  hideScheduledLivestreams: boolean,
};

function ChannelsFollowingPage(props: Props) {
  const {
    channelIds,
    tileLayout,
    activeLivestreamUris,
    doFetchAllActiveLivestreamsForQuery,
    fetchingActiveLivestreams,
    hideScheduledLivestreams,
  } = props;

  const hasSubscribedChannels = channelIds.length > 0;
  const [hideMembersOnly] = usePersistedState('channelPage-hideMembersOnly', false);

  useComponentDidMount(() => {
    doFetchAllActiveLivestreamsForQuery();
  });

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
              <h1 className="page__title">
                <Icon icon={ICONS.SUBSCRIBE} />
                <label>{__('Following')}</label>
              </h1>
            }
            hideMembersOnly={hideMembersOnly}
            defaultOrderBy={CS.ORDER_BY_NEW}
            channelIds={channelIds}
            meta={
              <>
                <Button
                  icon={ICONS.SEARCH}
                  button="alt"
                  label={__('Discover Channels')}
                  navigate={`/$/${PAGES.CHANNELS_FOLLOWING_DISCOVER}`}
                />
                <Button
                  icon={ICONS.SETTINGS}
                  button="alt"
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
