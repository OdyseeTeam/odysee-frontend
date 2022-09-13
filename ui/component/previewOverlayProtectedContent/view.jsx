// @flow
import * as ICONS from 'constants/icons';
import * as React from 'react';
import classnames from 'classnames';
import Icon from 'component/common/icon';

type Props = {
  protectedMembershipIds: Array<number>,
  validMembershipIds: Array<number>,
  claimIsMine: boolean,
};

export default function PreviewOverlayProtectedContent(props: Props) {
  const { protectedMembershipIds, validMembershipIds, claimIsMine } = props;

  const [userIsAMember, setUserIsAMember] = React.useState(false);

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
