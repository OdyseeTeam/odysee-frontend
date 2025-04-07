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
  disabled?: boolean,
  isChannelTab?: boolean,
  handleSelect: () => void,
  hasMembership: boolean,
};

const MembershipTier = (props: Props) => {
  const { membership, index, length, disabled, isChannelTab, handleSelect, hasMembership } = props;
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
            {hasMembership ? (
              <h2>Currently Subscribed!</h2>
            ) : (
              <Button
                icon={ICONS.MEMBERSHIP}
                button="primary"
                label={__('Join for $%membership_price% per month', {
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
