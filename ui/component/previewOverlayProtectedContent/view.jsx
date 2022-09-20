import * as ICONS from 'constants/icons';
import * as React from 'react';
import Icon from 'component/common/icon';
import './style.scss';

// eslint-disable-next-line flowtype/no-types-missing-file-annotation
type Props = {
  protectedMembershipIds: Array<number>,
  validMembershipIds: Array<number>,
  claimIsMine: boolean,
  channelMemberships: Array<Membership>,
};

// eslint-disable-next-line flowtype/no-types-missing-file-annotation
export default function PreviewOverlayProtectedContent(props: Props) {
  const { protectedMembershipIds, validMembershipIds, claimIsMine, channelMemberships } = props;

  const userIsAMember = React.useMemo(() => {
    return (
      protectedMembershipIds &&
      validMembershipIds &&
      protectedMembershipIds.some((id) => validMembershipIds.includes(id))
    );
  }, [protectedMembershipIds, validMembershipIds]);

  const protectedMembershipIdsSet = new Set(protectedMembershipIds);

  const channelsWithContentAccess =
    channelMemberships &&
    channelMemberships.filter((membership) => protectedMembershipIdsSet.has(membership.Membership.id));

  const cheapestPlan =
    channelsWithContentAccess &&
    channelsWithContentAccess.sort(function (a, b) {
      return a.NewPrices[0].Price.amount - b.NewPrices[0].Price.amount;
    })[0];

  if (userIsAMember || (protectedMembershipIds && claimIsMine)) {
    return (
      <div className="protected-content-unlocked">
        <Icon icon={ICONS.UNLOCK} size={64} />
      </div>
    );
  }

  if (channelMemberships && protectedMembershipIds && userIsAMember !== undefined) {
    return (
      <div className="protected-content-holder">
        <Icon icon={ICONS.LOCK} className="protected-content-locked" />
        <span>
          Members Only
        </span>
        <span>
          Join for ${cheapestPlan.NewPrices[0].Price.amount / 100} per month
        </span>

      </div>
    );
  }

  return null;
}
