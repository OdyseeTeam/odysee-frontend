// @flow
import 'scss/component/_comment-badge.scss';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';
import React from 'react';
import CommentBadge from 'component/common/comment-badge';
import Button from 'component/button';

type Props = {
  membership: ?string,
  linkPage?: boolean,
  placement?: string,
  className?: string,
  hideTooltip?: boolean,
  uri?: string,
  openModal: (string, {}) => void,
  activeChannelMembershipName: string,
  channelUri?: string,
};

function getBadgeToShow(membership) {
  if (membership === 'Premium') return 'silver';
  if (membership === 'Premium+') return 'gold';
  if (membership) return 'user'; // catchall for other memberships
  return null;
}

export default function PremiumBadge(props: Props) {
  const { membership, linkPage, placement, className, hideTooltip,  uri, openModal, activeChannelMembershipName, channelUri } = props;

  const userIsActiveMember = Boolean(activeChannelMembershipName);

  const badgeToShow = getBadgeToShow(membership);

  if (!badgeToShow) return null;

  const badgeProps = { size: 40, placement, hideTooltip, className };

  return (
    <BadgeWrapper linkPage={linkPage} badgeToShow={badgeToShow} openModal={openModal} userIsActiveMember={userIsActiveMember} channelUri={channelUri}>
      {badgeToShow === 'silver' && (
        <CommentBadge label="Premium" icon={ICONS.PREMIUM} {...badgeProps} />
      )}
      {badgeToShow === 'gold' && (
        <CommentBadge label="Premium+" icon={ICONS.PREMIUM_PLUS} {...badgeProps} />
      )}
      {badgeToShow === 'user' && (
        <CommentBadge label={membership} uri={uri} channelUri={channelUri} icon={ICONS.MEMBERSHIP} {...badgeProps} />
      )}
    </BadgeWrapper>
  );
}

type WrapperProps = {
  linkPage?: boolean,
  children: any,
  badgeToShow: string,
  uri?: string,
  openModal: (string, {}) => void,
  userIsActiveMember: boolean,
};

const BadgeWrapper = (props: WrapperProps) => {
  const { linkPage, children, badgeToShow, openModal, userIsActiveMember, channelUri } = props;

  if (badgeToShow === 'user') {
    // onclick open user modal
    const buttonToOpenMembershipModal =
      <Button onClick={() => openModal(MODALS.JOIN_MEMBERSHIP, { uri: channelUri })}>{children}</Button>;

    return linkPage && !userIsActiveMember ? buttonToOpenMembershipModal : children;
  } else {
    const linkToOdyseePremium = <Button navigate={`/$/${PAGES.ODYSEE_PREMIUM}`}>{children}</Button>;

    return linkPage ? linkToOdyseePremium : children;
  }
};
