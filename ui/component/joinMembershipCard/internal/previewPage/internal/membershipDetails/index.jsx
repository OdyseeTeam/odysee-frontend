// @flow
import React from 'react';
import BalanceText from 'react-balance-text';

type Props = {
  membership: CreatorMembership,
  headerAction?: any,
};

const MembershipDetails = (props: Props) => {
  const { membership, headerAction } = props;

  console.log('headerAction: ', headerAction);

  return (
    <>
      <section className="membership-tier__header">
        <span>{membership.Membership.name}</span>
      </section>

      <section className="membership-tier__infos">
        <span>{membership.Membership.description}</span>

        {membership.Perks && membership.Perks.length > 0 && (
          <div className="membership-tier__perks">
            <div className="membership-tier__moon" />
            <div className="membership-tier__perks-content">
              <label>{__('Perks')}</label>

              <ul>
                {/* $FlowFixMe -- already handled above */}
                {membership.Perks.map((tierPerk, i) => (
                  <li key={i}>{tierPerk.name}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section className="membership-tier__actions">{headerAction}</section>
    </>
  );
};

export default MembershipDetails;
