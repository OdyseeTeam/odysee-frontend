// @flow
import React from 'react';
import classnames from 'classnames';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import ChannelThumbnail from 'component/channelThumbnail';
import ChannelTitle from 'component/channelTitle';
import PremiumBadge from 'component/premiumBadge';

type Props = {
  uri: string,
  isSelected?: boolean,
  // -- redux --
  claimId?: string,
  doFetchOdyseeMembershipForChannelIds: (channelIds: string) => void,
};

const ChannelListItem = (props: Props) => {
  const { uri, isSelected = false, claimId, doFetchOdyseeMembershipForChannelIds } = props;

  React.useEffect(() => {
    if (claimId) {
      doFetchOdyseeMembershipForChannelIds([claimId]);
    }
  }, [claimId, doFetchOdyseeMembershipForChannelIds, uri]);

  return (
    <div className={classnames('channel__list-item', { 'channel__list-item--selected': isSelected })}>
      <ChannelThumbnail uri={uri} hideStakedIndicator xsmall noLazyLoad />
      <ChannelTitle uri={uri} />
      <PremiumBadge uri={uri} />
      {isSelected && <Icon icon={ICONS.DOWN} />}
    </div>
  );
};

export default ChannelListItem;
