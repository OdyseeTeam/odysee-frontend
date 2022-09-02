// @flow
import React from 'react';

import * as ICONS from 'constants/icons';

import Button from 'component/button';
import MembershipDetails from '../membershipDetails';

type Props = {
  key?: any,
  membership: CreatorMembership,
  channelIsMine: boolean,
  handleSelect: () => void,
};

const MembershipBlock = (props: Props) => {
  const { key, membership, channelIsMine, handleSelect } = props;

  return (
    <div key={key} className="join-membership__block">
      <MembershipDetails
        membership={membership}
        headerAction={
          <Button
            icon={ICONS.UPGRADE}
            button="primary"
            disabled={channelIsMine}
            label={__('Signup for $%membership_price% a month', {
              membership_price: membership.NewPrices[0].Price.amount / 100,
            })}
            onClick={handleSelect}
          />
        }
      />
    </div>
  );
};

export default MembershipBlock;
