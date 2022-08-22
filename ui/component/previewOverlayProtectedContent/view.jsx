// @flow
import * as ICONS from 'constants/icons';
import * as React from 'react';
import classnames from 'classnames';
import Icon from 'component/common/icon';

type Props = {
  protectedMembershipIds: Array<number>,
  activeMembershipIds: Array<number>,
  claimIsMine: boolean,
};

export default function PreviewOverlayProtectedContent(props: Props) {
  const {
    protectedMembershipIds,
    activeMembershipIds,
    claimIsMine,
  } = props;

  const [userIsAMember, setUserIsAMember] = React.useState(false);

  React.useEffect(() => {
    if (protectedMembershipIds && activeMembershipIds) {
      setUserIsAMember(activeMembershipIds.some(id => protectedMembershipIds.includes(id)));
    }
  }, [protectedMembershipIds, activeMembershipIds]);

  // don't show overlay if it's not protected or user is a member
  if (!protectedMembershipIds || userIsAMember || claimIsMine) return (<></>);

  return (
    <>
      <div className="protected-content-holder">
        <div style={{ textAlign: 'center', marginTop: '19px' }}>
          <Icon icon={ICONS.LOCK} className="protected-content-lock" />
        </div>
        <div className="protected-content-text">
          <h1>This content is only accessible to members</h1>
        </div>
      </div>
      <div
        className={classnames('claim-preview__overlay-protected-content', {
        })}
       />
    </>
  );
}
