import React from 'react';
import Page from 'component/page';
import ClaimListDiscover from 'component/claimListDiscover';
import * as CS from 'constants/claim_search';
import { CUSTOM_HOMEPAGE, SIMPLE_SITE } from 'config';
import { useAppSelector } from 'redux/hooks';
import { selectSubscriptionIds } from 'redux/selectors/subscriptions';
import { selectHomepageData, selectHomepageDiscover, selectHomepageDiscoverNew } from 'redux/selectors/settings';
const MORE_CHANNELS_ANCHOR = 'MoreChannels';

function ChannelsFollowingDiscover() {
  const subscribedChannelIds = useAppSelector(selectSubscriptionIds);
  const homepageData = useAppSelector(selectHomepageData) || {};
  const discoverData = useAppSelector(selectHomepageDiscover);
  const discoverDataNew = useAppSelector(selectHomepageDiscoverNew);
  const { PRIMARY_CONTENT, LATEST } = homepageData;
  let channelIds;

  if (discoverDataNew && discoverDataNew.length > 0) {
    channelIds = discoverDataNew;
  } else if (discoverData) {
    channelIds = discoverData;
  } else if (CUSTOM_HOMEPAGE) {
    if (LATEST) {
      channelIds = LATEST.channelIds;
    } else if (PRIMARY_CONTENT) {
      channelIds = PRIMARY_CONTENT.channelIds;
    }
  }

  return (
    <Page>
      <ClaimListDiscover
        defaultOrderBy={CS.ORDER_BY_NEW_CREATED}
        defaultFreshness={CS.FRESH_ALL}
        claimType={CS.CLAIM_CHANNEL}
        claimIds={CUSTOM_HOMEPAGE && channelIds ? channelIds : undefined}
        excludedChannelIds={subscribedChannelIds}
        scrollAnchor={MORE_CHANNELS_ANCHOR}
        maxPages={SIMPLE_SITE ? 3 : undefined}
        hideFilters={SIMPLE_SITE}
        header={SIMPLE_SITE ? <h1 className="section__title">{__('Moon cheese is an acquired taste')}</h1> : undefined}
      />
    </Page>
  );
}

export default ChannelsFollowingDiscover;
