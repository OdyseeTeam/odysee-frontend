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
      <section className="join-membership__plan-info">
        <h1 className="join-membership__plan-header">{membership.Membership.name}</h1>

        {headerAction}
      </section>

      <section className={classnames('join-membership__tier-info', { 'expanded-block': expanded })}>
        <span className="section__subtitle section__subtitle--join-membership__description">
          <BalanceText>{membership.Membership.description}</BalanceText>
        </span>

        {membership.Perks && membership.Perks.length > 0 && (
          <div className="membership__tier-perks">
            <h1 className="join-membership__plan-header" style={{ marginTop: '17px' }}>
              {__('Perks')}
            </h1>

            <ul className="join-membership__perks">
              {/* $FlowFixMe -- already handled above */}
              {membership.Perks.map((tierPerk, i) => (
                <p key={i}>
                  <li className="section__subtitle section__subtitle--join-membership__perk">{tierPerk.name}</li>
                </p>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
};

export default MembershipDetails;
