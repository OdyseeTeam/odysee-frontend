// @flow
import 'scss/component/_comment-badge.scss';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';
import React from 'react';
import CommentBadge from 'component/common/comment-badge';
import Button from 'component/button';

const BADGE_ICONS = {
  Premium: ICONS.PREMIUM,
  'Premium+': ICONS.PREMIUM_PLUS,
  Creator: ICONS.MEMBERSHIP,
};

type Props = {
  membershipName: string,
  linkPage?: boolean,
  placement?: string,
  className?: string,
  hideTooltip?: boolean,
  openModal: (string, {}) => void,
  channelUri?: string,
};

function getBadgeToShow(membershipName) {
  switch (membershipName) {
    case 'Premium':
    case 'Premium+':
      return membershipName;
    default:
      return 'Creator';
  }
}

export default function PremiumBadge(props: Props) {
  const { membershipName, linkPage, placement, className, hideTooltip, openModal, channelUri } = props;

  const badgeToShow = getBadgeToShow(membershipName);

  if (!membershipName) return null;

  const badgeProps = { size: 40, placement, hideTooltip, className };

  return (
    <BadgeWrapper linkPage={linkPage} badgeToShow={badgeToShow} openModal={openModal} channelUri={channelUri}>
      <CommentBadge label={membershipName} icon={BADGE_ICONS[badgeToShow]} {...badgeProps} />
    </BadgeWrapper>
  );
}

type WrapperProps = {
  linkPage?: boolean,
  children: any,
  badgeToShow: string,
  uri?: string,
  openModal: (string, {}) => void,
};

const BadgeWrapper = (props: WrapperProps) => {
  const { linkPage, children, badgeToShow, openModal, channelUri } = props;

  if (!linkPage) return children;

  if (badgeToShow === 'Creator') {
    return <Button onClick={() => openModal(MODALS.JOIN_MEMBERSHIP, { uri: channelUri })}>{children}</Button>;
  }

  return <Button navigate={`/$/${PAGES.ODYSEE_PREMIUM}`}>{children}</Button>;
};
