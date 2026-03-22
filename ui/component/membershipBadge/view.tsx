import 'scss/component/_comment-badge.scss';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';
import * as MEMBERSHIP_CONSTS from 'constants/memberships';
import React from 'react';
import CommentBadge from 'component/common/comment-badge';
import { formatLbryUrlForWeb } from 'util/url';
import { CHANNEL_PAGE } from 'constants/urlParams';
import { useNavigate } from 'react-router-dom';
import { parseURI, buildURI } from 'util/lbryURI';
import Button from 'component/button';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectUserValidMembershipForChannelUri } from 'redux/selectors/memberships';
import { doOpenModal } from 'redux/actions/app';
const BADGE_ICONS = {
  [MEMBERSHIP_CONSTS.ODYSEE_TIER_NAMES.PREMIUM]: ICONS.PREMIUM,
  [MEMBERSHIP_CONSTS.ODYSEE_TIER_NAMES.PREMIUM_PLUS]: ICONS.PREMIUM_PLUS,
  Creator: ICONS.MEMBERSHIP,
};
type Props = {
  membershipName: string;
  linkPage?: boolean;
  placement?: string;
  className?: string;
  hideTooltip?: boolean;
  uri?: string;
};

function getBadgeToShow(membershipName) {
  switch (membershipName) {
    case MEMBERSHIP_CONSTS.ODYSEE_TIER_NAMES.PREMIUM:
    case MEMBERSHIP_CONSTS.ODYSEE_TIER_NAMES.PREMIUM_PLUS:
      return membershipName;

    default:
      return 'Creator';
  }
}

function MembershipBadge(props: Props) {
  const { membershipName, linkPage, placement, className, hideTooltip, uri } = props;
  const dispatch = useAppDispatch();
  const validUserMembershipForChannel = useAppSelector((state) => selectUserValidMembershipForChannelUri(state, uri));
  const badgeToShow = getBadgeToShow(membershipName);
  if (!membershipName) return null;
  const badgeProps = {
    size: 40,
    placement,
    hideTooltip,
    className,
  };
  return (
    <BadgeWrapper
      linkPage={linkPage}
      badgeToShow={badgeToShow}
      dispatch={dispatch}
      uri={uri}
      validUserMembershipForChannel={validUserMembershipForChannel}
    >
      <CommentBadge label={membershipName} icon={BADGE_ICONS[badgeToShow]} {...badgeProps} />
    </BadgeWrapper>
  );
}

type WrapperProps = {
  linkPage?: boolean;
  children: any;
  badgeToShow: string;
  uri?: string;
  validUserMembershipForChannel: boolean | null | undefined;
  dispatch: ReturnType<typeof useAppDispatch>;
};

const BadgeWrapper = (props: WrapperProps) => {
  const { linkPage, children, badgeToShow, dispatch, validUserMembershipForChannel, uri } = props;
  const navigate = useNavigate();
  if (!linkPage) return children;

  if (badgeToShow === 'Creator' && uri) {
    const { channelName, channelClaimId } = parseURI(uri);
    const channelUri = buildURI({
      channelName,
      channelClaimId,
    });
    const urlParams = new URLSearchParams();
    urlParams.set(CHANNEL_PAGE.QUERIES.VIEW, CHANNEL_PAGE.VIEWS.MEMBERSHIP);
    return (
      <Button
        onClick={() =>
          validUserMembershipForChannel
            ? navigate({
                pathname: formatLbryUrlForWeb(channelUri),
                search: urlParams.toString(),
              })
            : dispatch(
                doOpenModal(MODALS.JOIN_MEMBERSHIP, {
                  uri: channelUri,
                })
              )
        }
      >
        {children}
      </Button>
    );
  }

  return <Button navigate={`/$/${PAGES.ODYSEE_MEMBERSHIP}`}>{children}</Button>;
};

export default React.memo(MembershipBadge);
