// @flow
import React from 'react';
import classnames from 'classnames';
import BalanceText from 'react-balance-text';

type Props = {
  membership: CreatorMembership,
  headerAction?: any,
  expanded: boolean,
};

const MembershipDetails = (props: Props) => {
  const { membership, headerAction, expanded } = props;

  return (
    <>
      <section className="join-membership__header"></section>

      <section>
        <h2>{membership.Membership.name}</h2>
        {headerAction}
      </section>

      <section className={classnames('join-membership__tier-info', { 'expanded-block': expanded })}>
        <span className="section__subtitle section__subtitle--join-membership__description">
          <BalanceText>{membership.Membership.description}</BalanceText>
        </span>

        {membership.Perks && membership.Perks.length > 0 && (
          <div className="membership__tier-perks">
            <h3>{__('Perks')}</h3>

            <ul>
              {/* $FlowFixMe -- already handled above */}
              {membership.Perks.map((tierPerk, i) => (
                <li key={i}>{tierPerk.name}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
};

export default MembershipDetails;
