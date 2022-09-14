// @flow
import * as ICONS from 'constants/icons';
import * as React from 'react';
import Icon from 'component/common/icon';
import './style.scss';

type Props = {
  protectedMembershipIds: Array<number>,
  validMembershipIds: Array<number>,
  claimIsMine: boolean,
  channelMemberships: Array<Membership>,
};

export default function PreviewOverlayProtectedContent(props: Props) {
  const { protectedMembershipIds, validMembershipIds, claimIsMine } = props;

  const [userIsAMember, setUserIsAMember] = React.useState(false);
  // const protectedMembershipIdsSet = new Set(protectedMembershipIds);

  // const channelsWithContentAccess =
  //   channelMemberships &&
  //   channelMemberships.filter((membership) => protectedMembershipIdsSet.has(membership.Membership.id));

  // const cheapestPlan =
  //   channelsWithContentAccess &&
  //   channelsWithContentAccess.sort(function (a, b) {
  //     return a.NewPrices[0].Price.amount - b.NewPrices[0].Price.amount;
  //   })[0];

  // TODO: let's add something that's like 'Content available starting at $5.00/month'

  React.useEffect(() => {
    if (protectedMembershipIds && validMembershipIds) {
      setUserIsAMember(validMembershipIds.some((id) => protectedMembershipIds.includes(id)));
    }
  }, [protectedMembershipIds, validMembershipIds]);

  if (!protectedMembershipIds?.length || userIsAMember || claimIsMine)
    return (
      <div class="protected-content-unlocked">
        <Icon icon={ICONS.UNLOCK} size={64} />
      </div>
    );

  return (
    <div className="protected-content-holder">
      <Icon icon={ICONS.LOCK} className="protected-content-locked" />
      <span>Members Only</span>
    </div>
  );
}
