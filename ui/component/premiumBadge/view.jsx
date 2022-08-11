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
  creatorUri?: string,
  doOpenModal: (modalId: string, {}) => void,
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

function PremiumBadge(props: Props) {
  const { membershipName, linkPage, placement, className, hideTooltip, creatorUri, doOpenModal } = props;

  const badgeToShow = getBadgeToShow(membershipName);

  if (!membershipName) return null;

  const badgeProps = { size: 40, placement, hideTooltip, className };

  return (
    <BadgeWrapper linkPage={linkPage} badgeToShow={badgeToShow} doOpenModal={doOpenModal} creatorUri={creatorUri}>
      <CommentBadge label={membershipName} icon={BADGE_ICONS[badgeToShow]} {...badgeProps} />
    </BadgeWrapper>
  );
}

type WrapperProps = {
  linkPage?: boolean,
  children: any,
  badgeToShow: string,
  uri?: string,
  creatorUri?: string,
  doOpenModal: (modalId: string, {}) => void,
};

const BadgeWrapper = (props: WrapperProps) => {
  const { linkPage, children, badgeToShow, doOpenModal, creatorUri } = props;

  if (!linkPage) return children;

  if (badgeToShow === 'Creator') {
    return <Button onClick={() => doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri: creatorUri })}>{children}</Button>;
  }

  return <Button navigate={`/$/${PAGES.ODYSEE_PREMIUM}`}>{children}</Button>;
};

export default PremiumBadge;
