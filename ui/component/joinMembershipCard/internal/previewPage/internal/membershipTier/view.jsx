// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import MembershipDetails from '../membershipDetails';

type Props = {
  membership: CreatorMembership,
  disabled?: boolean,
  index?: number,
  length?: number,
  isChannelTab?: boolean,
  handleSelect: () => void,
  isActive: boolean,
  isPending: boolean,
  isCanceled: boolean,
  isOwnChannel: boolean,
  userHasCreatorMembership: boolean, // here
};

const MembershipTier = (props: Props) => {
  const {
    membership,
    index,
    length,
    disabled,
    isChannelTab,
    handleSelect,
    isActive,
    isOwnChannel,
    userHasCreatorMembership,
  } = props;

  const getMembershipAction = () => {
    // if cancelled, show "Cancelled, click to Restore" and last valid date
    // if active, show "Active"

  }

  return (
    <div
      className={
        Number.isInteger(index) && Number.isInteger(length)
          ? `membership-tier__wrapper item${(index || 0) + 1}-${length || 0}`
          : 'membership-tier__wrapper'
      }
    >
      <MembershipDetails
        isChannelTab={isChannelTab}
        membership={membership}
        headerAction={
          <>
            {isActive ? (
              <div className={'help'}>Currently Subscribed!</div>
            ) : userHasCreatorMembership
              ? (<div className={'help'}>Cancel Active Membership before Joining Another</div>)
              : isOwnChannel
                ? null
                : (
              <Button
                icon={ICONS.MEMBERSHIP}
                button="primary"
                label={__('Join C for $%membership_price% per month', {
                  membership_price: (membership?.prices[0].amount / 100).toFixed(
                    membership?.prices[0].amount < 100 ? 2 : 0
                  ), // tiers
                })}
                onClick={handleSelect}
                disabled={disabled}
              />
            )}
          </>
        }
      />
    </div>
  );
};

export default MembershipTier;
