// @flow
import React from 'react';

type Props = {
  membership: CreatorMembership,
  headerAction?: any,
  protectedMembershipIds: Array<number>
};

const MembershipDetails = (props: Props) => {
  const { membership, headerAction, protectedMembershipIds } = props;

  let accessText = 'This membership doesn\'t have access to the current content';
  if (protectedMembershipIds && protectedMembershipIds.includes(membership.Membership.id)) {
    accessText = 'This membership has access to the current content';
  }

  console.log('headerAction: ', headerAction);

  l(membership.Membership)

  return (
    <>
      <section className="membership-tier__header">
        <span>{membership.Membership.name}</span>
      </section>

      <section className="membership-tier__infos">
        <h1>{accessText}</h1>

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
