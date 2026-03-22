import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import * as CS from 'constants/claim_search';
import * as SETTINGS from 'constants/settings';
import { SIMPLE_SITE } from 'config';
import React from 'react';
import ChannelsFollowingDiscoverPage from 'page/channelsFollowingDiscover';
import LivestreamSection from 'page/discover/internal/livestreamSection';
import ClaimListDiscover from 'component/claimListDiscover';
import Page from 'component/page';
import Button from 'component/button';
import Icon from 'component/common/icon';
import { filterActiveLivestreamUris } from 'util/livestream';
import { tagSearchCsOptionsHook } from 'util/search';
import UpcomingClaims from 'component/upcomingClaims';
import useComponentDidMount from 'effects/use-component-did-mount';
import usePersistedState from 'effects/use-persisted-state';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectIsFetchingActiveLivestreams,
  selectActiveLivestreamByCreatorId,
  selectViewersById,
} from 'redux/selectors/livestream';
import { selectSubscriptionIds } from 'redux/selectors/subscriptions';
import { selectClientSetting } from 'redux/selectors/settings';
import { doFetchAllActiveLivestreamsForQuery as doFetchAllActiveLivestreamsForQueryAction } from 'redux/actions/livestream';

function ChannelsFollowingPage() {
  const dispatch = useAppDispatch();
  const channelIds = useAppSelector(selectSubscriptionIds);
  const tileLayout = useAppSelector((state) => selectClientSetting(state, SETTINGS.TILE_LAYOUT));
  const fetchingActiveLivestreams = useAppSelector(selectIsFetchingActiveLivestreams);
  const al = useAppSelector(selectActiveLivestreamByCreatorId);
  const lv = useAppSelector(selectViewersById);
  const hasSubscribedChannels = channelIds.length > 0;
  const [hideMembersOnly] = usePersistedState('channelPage-hideMembersOnly', false);
  const activeLivestreamUris = React.useMemo(() => {
    return filterActiveLivestreamUris(channelIds, null, al, lv);
  }, [channelIds, lv, al]);
  useComponentDidMount(() => {
    dispatch(doFetchAllActiveLivestreamsForQueryAction());
  });
  return !hasSubscribedChannels ? (
    <ChannelsFollowingDiscoverPage />
  ) : (
    <Page noFooter fullWidthPage={tileLayout} className="main__channelsFollowing">
      {!fetchingActiveLivestreams && (
        <>
          <UpcomingClaims
            name="channels_following"
            channelIds={channelIds}
            tileLayout={tileLayout}
            liveUris={activeLivestreamUris}
          />

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
