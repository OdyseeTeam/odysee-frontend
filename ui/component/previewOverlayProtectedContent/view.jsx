// add flow when this component is finished
/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import * as ICONS from 'constants/icons';
import * as React from 'react';
import Icon from 'component/common/icon';
import classnames from 'classnames';
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

  if (userIsAMember || (protectedMembershipIds && claimIsMine)) {
    return (
      <div className="protected-content-unlocked">
        <Icon icon={ICONS.UNLOCK} size={64} />
      </div>
    );
  }

  if (channelMemberships && protectedMembershipIds && userIsAMember !== undefined) {
    const protectedMembershipIdsSet = new Set(protectedMembershipIds);

    return (
      <div className="protected-content-holder">
        <Icon icon={ICONS.LOCK} className="protected-content-locked" />
        <span>
          Members Only
          <br />
          {channelMemberships.map(({ Membership }) => (
            <div
              key={Membership.id}
              className={classnames('dot', { active: protectedMembershipIdsSet.has(Membership.id) })}
            />
          ))}
        </span>
      </div>
    );
  }

  return null;
}
/* eslint-enable no-undef */
/* eslint-enable react/prop-types */
