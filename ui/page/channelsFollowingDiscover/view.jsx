// @flow
import React from 'react';
import Page from 'component/page';
import ClaimListDiscover from 'component/claimListDiscover';
import * as CS from 'constants/claim_search';
import { CUSTOM_HOMEPAGE } from 'config';

const MORE_CHANNELS_ANCHOR = 'MoreChannels';

type Props = {
  subscribedChannels: Array<Subscription>,
  blockedChannels: Array<string>,
  homepageData: any,
};

function ChannelsFollowingDiscover(props: Props) {
  const { homepageData } = props;
  const { PRIMARY_CONTENT, LATEST } = homepageData;
  let channelIds;
  if (CUSTOM_HOMEPAGE) {
    if (LATEST) {
      channelIds = LATEST.channelIds;
    } else if (PRIMARY_CONTENT) {
      channelIds = PRIMARY_CONTENT.channelIds;
    }
  }

  return (
    <Page className="discoverPage-wrapper">
      <ClaimListDiscover
        defaultOrderBy={CS.ORDER_BY_TRENDING}
        defaultFreshness={CS.FRESH_ALL}
        claimType={CS.CLAIM_CHANNEL}
        claimIds={CUSTOM_HOMEPAGE && channelIds ? channelIds : undefined}
        scrollAnchor={MORE_CHANNELS_ANCHOR}
        maxPages={3}
        hideFilters
        header={<h1 className="section__title">{__('Moon cheese is an acquired taste')}</h1>}
      />
    </Page>
  );
}

export default ChannelsFollowingDiscover;
