// @flow
import * as ICONS from 'constants/icons';
import * as React from 'react';
import Icon from 'component/common/icon';
import './style.scss';

type Props = {
  protectedMembershipIds: Array<number>,
  claimIsMine: boolean,
  userIsAMember: boolean,
  cheapestPlanPrice: ?number,
};

const PreviewOverlayProtectedContent = (props: Props) => {
  const { protectedMembershipIds, claimIsMine, userIsAMember, cheapestPlanPrice } = props;

  if (userIsAMember || (protectedMembershipIds && claimIsMine)) {
    return (
      <div className="protected-content-unlocked">
        <Icon icon={ICONS.UNLOCK} size={64} />
      </div>
    );
  }

  if (protectedMembershipIds && userIsAMember !== undefined) {
    return (
      <div className="protected-content-holder">
        <div className="protected-content-holder-lock">
          <Icon icon={ICONS.LOCK} />
        </div>
        <div className="protected-content-holder-label">
          {__('Members Only')}
          <span>{__('Join for $%membership_price% per month', { membership_price: cheapestPlanPrice })}</span>
        </div>
      </div>
    );
  }

  return null;
};

export default PreviewOverlayProtectedContent;
