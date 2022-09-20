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
  uri: string,
  openModal: (string, {}) => void,
  channelMemberships: CreatorMemberships,
};

export default function ProtectedContentOverlay(props: Props) {
  const {
    protectedMembershipIds,
    validMembershipIds,
    claimIsMine,
    openModal,
    uri,
    isProtected,
    channelMemberships,
  } = props;

  const [userIsAMember, setUserIsAMember] = React.useState(false);
  const protectedMembershipIdsSet = new Set(protectedMembershipIds);
  const hideOverlay = !isProtected || userIsAMember || claimIsMine;

  const channelsWithContentAccess = React.useMemo(
    () =>
      !hideOverlay &&
      channelMemberships &&
      channelMemberships.filter((membership) => protectedMembershipIdsSet.has(membership.Membership.id)),
    [channelMemberships, hideOverlay, protectedMembershipIdsSet]
  );

  const cheapestPlan = React.useMemo(
    () =>
      !hideOverlay &&
      channelsWithContentAccess &&
      channelsWithContentAccess.sort(
        (a, b) => (a.NewPrices ? a.NewPrices[0].Price.amount : 0) - (b.NewPrices ? b.NewPrices[0].Price.amount : 0)
      )[0],
    [channelsWithContentAccess, hideOverlay]
  );

  const membershipIndex = React.useMemo(
    () =>
      !hideOverlay &&
      cheapestPlan &&
      channelMemberships.findIndex((membership) => membership.Membership.id === cheapestPlan.Membership.id),
    [channelMemberships, cheapestPlan, hideOverlay]
  );

  React.useEffect(() => {
    if (protectedMembershipIds && validMembershipIds && isProtected) {
      setUserIsAMember(validMembershipIds.some((id) => protectedMembershipIdsSet.has(id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protectedMembershipIds, validMembershipIds, isProtected]);

  // don't show overlay if it's not protected or user is a member
  if (!isProtected || userIsAMember || claimIsMine) return null;

  return (
    <>
      <div className="protected-content-overlay">
        <div>
          <Icon icon={ICONS.LOCK} />
          <span>Only channel members can view this content</span>
          <Button
            button="primary"
            icon={ICONS.MEMBERSHIP}
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
