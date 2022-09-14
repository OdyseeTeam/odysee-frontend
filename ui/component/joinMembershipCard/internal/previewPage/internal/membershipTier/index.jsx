// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import MembershipDetails from '../membershipDetails';

type Props = {
  membership: CreatorMembership,
  disabled?: boolean,
  handleSelect: () => void,
};

const MembershipTier = (props: Props) => {
  const { membership, disabled, handleSelect } = props;

  return (
    <div className="membership-tier__wrapper">
      <MembershipDetails
        membership={membership}
        headerAction={
          <Button
            icon={ICONS.UPGRADE}
            button="primary"
            disabled={disabled}
            label={__('Signup for $%membership_price% a month', {
              membership_price: membership.NewPrices && membership.NewPrices[0].Price.amount / 100,
            })}
            onClick={handleSelect}
          />
        }
      />
    </div>
  );
};

export default MembershipTier;
