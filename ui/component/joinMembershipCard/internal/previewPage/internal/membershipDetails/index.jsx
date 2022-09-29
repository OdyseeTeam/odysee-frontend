// @flow
import React from 'react';
import './style.scss';

type Props = {
  membership: CreatorMembership,
  headerAction?: any,
  protectedMembershipIds?: Array<number>,
};

const MembershipDetails = (props: Props) => {
  const { membership, headerAction, protectedMembershipIds } = props;

  const descriptionParagraphs = membership.Membership.description.split('\n');

  let accessText = __('This Tier does not grant you access to the currently selected content.');
  if (new Set(protectedMembershipIds).has(membership.Membership.id)) {
    // accessText = 'This membership has access to the current content.';
    accessText = undefined;
  }

  return (
    <>
      <section className="membership-tier__header">
        <span>{membership.Membership.name}</span>
      </section>

      <section className="membership-tier__infos">
        {protectedMembershipIds && accessText && (
          <div className="access-status">
            <label>{accessText}</label>
          </div>
        )}

        <span>
          {descriptionParagraphs.map((descriptionLine, i) =>
            descriptionLine === '' ? <br /> : <p key={i}>{descriptionLine}</p>
          )}
        </span>

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

      {headerAction && <section className="membership-tier__actions">{headerAction}</section>}
    </>
  );
};

export default MembershipDetails;
