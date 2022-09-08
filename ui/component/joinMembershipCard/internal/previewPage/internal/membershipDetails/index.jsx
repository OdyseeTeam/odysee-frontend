// @flow
import React from 'react';

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

        <div className="membership-tier__perks">
          <div className="membership-tier__moon" />
          <div className="membership-tier__perks-content">
            {membership.Perks && membership.Perks.length > 0 ? (
              <>
                <label>{__('Perks')}</label>
                <ul>
                  {/* $FlowFixMe -- already handled above */}
                  {membership.Perks.map((tierPerk, i) => (
                    <li key={i}>{tierPerk.name}</li>
                  ))}
                </ul>
              </>
            ) : (
              <label>{__('No Perks...')}</label>
            )}
          </div>
        </div>
      </section>

      <section className="membership-tier__actions">{headerAction}</section>
    </>
  );
};

export default MembershipDetails;
