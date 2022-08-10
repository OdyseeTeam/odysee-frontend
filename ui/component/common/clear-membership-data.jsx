// @flow
import React from 'react';

import { doMembershipClearData } from 'util/memberships';
import * as ICONS from 'constants/icons';
import Button from 'component/button';

const isDev = process.env.NODE_ENV !== 'production';

type Props = {
  membershipMine?: any,
};

const ClearMembershipDataButton = (props: Props) => {
  const { membershipMine } = props;

  const purchasedMemberships =
    membershipMine &&
    Object.values(membershipMine.purchasedMemberships).filter(
      (membership) => membership.MembershipDetails.channel_name === '@odysee'
    );

  return (
    isDev &&
    (!membershipMine || purchasedMemberships?.length > 0) && (
      <>
        <h1 style={{ marginTop: '30px', fontSize: '20px' }}>Clear Membership Data (Only Available On Dev)</h1>
        <div>
          <Button
            button="primary"
            label="Clear Membership Data"
            icon={ICONS.SETTINGS}
            className="membership_button"
            onClick={doMembershipClearData}
          />
        </div>
      </>
    )
  );
};

export default ClearMembershipDataButton;
