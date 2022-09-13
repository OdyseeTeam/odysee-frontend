// @flow
import * as ICONS from 'constants/icons';
import * as React from 'react';
import classnames from 'classnames';
import Icon from 'component/common/icon';

type Props = {
  protectedMembershipIds: Array<number>,
  validMembershipIds: Array<number>,
  claimIsMine: boolean,
  channelMemberships: Array<Membership>,
};

export default function PreviewOverlayProtectedContent(props: Props) {
  const { protectedMembershipIds, validMembershipIds, claimIsMine, channelMemberships } = props;

  const [userIsAMember, setUserIsAMember] = React.useState(false);

  const channelsWithContentAccess =  channelMemberships.filter(membership => {
    return protectedMembershipIds.includes(membership.Membership.id);
  });

  const cheapestPlan = channelsWithContentAccess.sort(function (a, b) {
    return a.NewPrices[0].Price.amount - b.NewPrices[0].Price.amount;
  })[0];

  l('cheapest plan with access');
  l(cheapestPlan)

  React.useEffect(() => {
    if (protectedMembershipIds && validMembershipIds) {
      setUserIsAMember(validMembershipIds.some((id) => protectedMembershipIds.includes(id)));
    }
  }, [protectedMembershipIds, validMembershipIds]);

  // don't show overlay if it's not protected or user is a member
  if (!protectedMembershipIds?.length || userIsAMember || claimIsMine) return <></>;

  return (
    <div className="protected-content-holder">
      <Icon icon={ICONS.LOCK} className="protected-content-lock" />
      <span>Members Only</span>
    </div>
  );
}
