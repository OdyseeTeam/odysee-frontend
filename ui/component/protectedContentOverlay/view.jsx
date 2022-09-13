// @flow
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import * as React from 'react';
import Icon from 'component/common/icon';
import Button from 'component/button';

type Props = {
  protectedMembershipIds: Array<number>,
  validMembershipIds: Array<number>,
  claimIsMine: boolean,
  isProtected: boolean,
  channelMemberships: Array<Membership>,
};

export default function ProtectedContentOverlay(props: Props) {
  const { protectedMembershipIds, validMembershipIds, claimIsMine, openModal, uri, isProtected, channelMemberships } = props;

  const [userIsAMember, setUserIsAMember] = React.useState(false);

  React.useEffect(() => {
    if (protectedMembershipIds && validMembershipIds && isProtected) {
      setUserIsAMember(validMembershipIds.some((id) => protectedMembershipIds.includes(id)));
    }
  }, [protectedMembershipIds, validMembershipIds, isProtected]);

  // don't show overlay if it's not protected or user is a member
  if (!isProtected || userIsAMember || claimIsMine) return <></>;

  const channelsWithContentAccess =  channelMemberships && channelMemberships.filter(membership => {
    return protectedMembershipIds.includes(membership.Membership.id);
  });

  const cheapestPlan = channelsWithContentAccess && channelsWithContentAccess.sort(function (a, b) {
    return a.NewPrices[0].Price.amount - b.NewPrices[0].Price.amount;
  })[0];

  const membershipIndex = cheapestPlan && channelMemberships.findIndex(function(membership){
    return membership.Membership.id === cheapestPlan.Membership.id
  });

  return (
    <>
      <div className="protected-content-overlay">
        <div>
          <Icon icon={ICONS.LOCK} />
          <span>Only channel members can view this content</span>
          <Button
            button="primary"
            icon={ICONS.UPGRADE}
            label={__('Membership Options')}
            title={__('Become A Member')}
            onClick={() =>
              openModal(MODALS.JOIN_MEMBERSHIP, {
                uri,
                protectedMembershipIds,
                membershipIndex,
              })
            }
            // style={{ filter: !creatorHasMemberships ? 'brightness(50%)' : undefined }}
          />
        </div>
      </div>
    </>
  );
}
