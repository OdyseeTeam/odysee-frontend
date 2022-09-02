// @flow
import React from 'react';
import BalanceText from 'react-balance-text';

type Props = {
  membership: CreatorMembership,
  headerAction?: any,
};

const MembershipDetails = (props: Props) => {
  const { membership, headerAction } = props;

  return (
    <>
      <section className="join-membership__header" />

      <section>
        <h2>{membership.Membership.name}</h2>
        {headerAction}
      </section>

      <section className="join-membership__tier-info">
        <span className="section__subtitle section__subtitle--join-membership__description">
          <BalanceText>{membership.Membership.description}</BalanceText>
        </span>

        {membership.Perks && membership.Perks.length > 0 && (
          <div className="membership__tier-perks">
            <div className="membership__tier-moon" />
            <div className="membership__tier-perks-content">
              <h3>{__('Perks')}</h3>

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
    </>
  );
};

export default MembershipDetails;
