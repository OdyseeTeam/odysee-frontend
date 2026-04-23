import React from 'react';
import classnames from 'classnames';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import ChannelThumbnail from 'component/channelThumbnail';
import ChannelTitle from 'component/channelTitle';
import MembershipBadge from 'component/membershipBadge';
import { useAppSelector } from 'redux/hooks';
import { selectClaimUriForId } from 'redux/selectors/claims';
import { selectUserOdyseeMembership } from 'redux/selectors/memberships';

type Props = {
  channelId: string;
  isSelected?: boolean;
};

const ChannelListItem = (props: Props) => {
  const { channelId, isSelected = false } = props;

  const uri = useAppSelector((state) => selectClaimUriForId(state, channelId));
  const odyseeMembership = useAppSelector((state) => selectUserOdyseeMembership(state, channelId));
  return (
    <div
      className={classnames('channel-selector__item', {
        'channel-selector__item--selected': isSelected,
      })}
    >
      <ChannelThumbnail uri={uri} hideStakedIndicator xsmall noLazyLoad />
      <ChannelTitle uri={uri} />
      {odyseeMembership && <MembershipBadge membershipName={odyseeMembership} />}
      {isSelected && <Icon icon={ICONS.DOWN} />}
    </div>
  );
};

export default ChannelListItem;
