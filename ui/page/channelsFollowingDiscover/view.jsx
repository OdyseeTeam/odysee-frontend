// @flow
import * as PAGES from 'constants/pages';
import React from 'react';
import Page from 'component/page';
import ClaimListDiscover from 'component/claimListDiscover';
import * as CS from 'constants/claim_search';
import { toCapitalCase } from 'util/string';
import { CUSTOM_HOMEPAGE } from 'config';

const MORE_CHANNELS_ANCHOR = 'MoreChannels';

type Props = {
  followedTags: Array<Tag>,
  subscribedChannels: Array<Subscription>,
  blockedChannels: Array<string>,
  homepageData: any,
};

type ChannelsFollowingItem = {
  title: string,
  link?: string,
  help?: any,
  options?: {},
};

function ChannelsFollowingDiscover(props: Props) {
  const { followedTags, homepageData } = props;
  const { PRIMARY_CONTENT, LATEST } = homepageData;
  let channelIds;
  if (CUSTOM_HOMEPAGE) {
    if (LATEST) {
      channelIds = LATEST.channelIds;
    } else if (PRIMARY_CONTENT) {
      channelIds = PRIMARY_CONTENT.channelIds;
    }
  }
  let rowData: Array<ChannelsFollowingItem> = [];

  rowData.push({
    title: 'Top Channels Of All Time',
    link: `/$/${PAGES.DISCOVER}?claim_type=channel&${CS.ORDER_BY_KEY}=${CS.ORDER_BY_TOP}&${CS.FRESH_KEY}=${CS.FRESH_ALL}`,
    options: {
      pageSize: 12,
      claimType: 'channel',
      orderBy: ['effective_amount'],
    },
  });

  rowData.push({
    title: 'Trending Channels',
    link: `/$/${PAGES.DISCOVER}?claim_type=channel`,
    options: {
      pageSize: 8,
      claimType: 'channel',
      orderBy: ['trending_group', 'trending_mixed'],
    },
  });

  if (followedTags.length > 0 && followedTags.length < 5) {
    const followedRows = followedTags.map((tag: Tag) => ({
      title: `Trending Channels for #${toCapitalCase(tag.name)}`,
      link: `/$/${PAGES.DISCOVER}?t=${tag.name}&claim_type=channel`,
      options: {
        claimType: 'channel',
        pageSize: 4,
        tags: [tag.name],
      },
    }));
    rowData.push(...followedRows);
  }

  if (followedTags.length > 4) {
    rowData.push({
      title: 'Trending For Your Tags',
      link: `/$/${PAGES.TAGS_FOLLOWING}?claim_type=channel`,
      options: {
        claimType: 'channel',
        tags: followedTags.map((tag) => tag.name),
      },
    });
  }

  return (
    <Page>
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
