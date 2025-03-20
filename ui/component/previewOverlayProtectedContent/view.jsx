// @flow
import * as ICONS from 'constants/icons';
import * as React from 'react';
import Icon from 'component/common/icon';

type Props = {
  channel: ?ChannelClaim,
  cheapestPlanPrice: ?number,
  claimIsMine: boolean,
  doMembershipList: (params: MembershipListParams) => Promise<CreatorMemberships>,
  hasProtectedContentTag: boolean,
  protectedMembershipIds: Array<number>,
  userIsAMember: boolean,
};

const PreviewOverlayProtectedContent = (props: Props) => {
  const {
    protectedMembershipIds,
    claimIsMine,
    userIsAMember,
    cheapestPlanPrice,
    channel,
    doMembershipList,
    hasProtectedContentTag,
  } = props;

  React.useEffect(() => {
    if (channel && protectedMembershipIds && cheapestPlanPrice === undefined) {
      doMembershipList({ channel_id: channel.claim_id });
    }
  }, [channel, cheapestPlanPrice, doMembershipList, protectedMembershipIds]);

  if (userIsAMember || (protectedMembershipIds && claimIsMine)) {
    return (
      <div className="protected-content__wrapper--unlocked">
        <Icon icon={ICONS.UNLOCK} size={64} />
      </div>
    );
  }

  if (protectedMembershipIds && userIsAMember !== undefined && cheapestPlanPrice && hasProtectedContentTag) {
    return (
      <div className="protected-content__wrapper">
        <div className="protected-content__lock">
          <Icon icon={ICONS.LOCK} />
        </div>
        <div className="protected-content__label-wrapper">
          <div className="protected-content__label-container">
            <div className="protected-content__label">
              {__('Members Only')}
              <span>{__('Join for $%membership_price% per month', { membership_price: cheapestPlanPrice })}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PreviewOverlayProtectedContent;
