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
};

export default function ProtectedContentOverlay(props: Props) {
  const { protectedMembershipIds, validMembershipIds, claimIsMine, openModal, uri, isProtected } = props;

  const [userIsAMember, setUserIsAMember] = React.useState(false);

  React.useEffect(() => {
    if (protectedMembershipIds && validMembershipIds && isProtected) {
      setUserIsAMember(validMembershipIds.some((id) => protectedMembershipIds.includes(id)));
    }
  }, [protectedMembershipIds, validMembershipIds, isProtected]);

  // don't show overlay if it's not protected or user is a member
  if (!isProtected || userIsAMember || claimIsMine) return <></>;

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
              })
            }
            // style={{ filter: !creatorHasMemberships ? 'brightness(50%)' : undefined }}
          />
        </div>
      </div>
    </>
  );
}
