// @flow
import React from 'react';
import WalletStatus from 'component/walletStatus';
import { useArStatus } from 'effects/use-ar-status';
import './style.scss';

type Props = {
  membership: CreatorMembership,
  headerAction?: any,
  unlockableTierIds?: Array<number>,
  userHasACreatorMembership?: boolean,
  isChannelTab?: boolean,
  membersOnly?: boolean,
  isLivestream?: ?boolean,
};

const MembershipDetails = (props: Props) => {
  const {
    membership,
    headerAction,
    unlockableTierIds,
    userHasACreatorMembership,
    isChannelTab,
    membersOnly,
    isLivestream,
  } = props;
  const {
    activeArStatus,
  } = useArStatus();

  const selectedMembershipName = membership.name;
  const membershipIsUnlockable = !userHasACreatorMembership && new Set(unlockableTierIds).has(membership.membership_id);

  let accessText = __(
    membersOnly
      ? !isLivestream
        ? 'This membership does not give you access to the members-only comment section.'
        : 'This membership does not give you access to the members-only chat mode.'
      : 'This Tier does not grant you access to the currently selected content.'
  );
  if (userHasACreatorMembership) {
    accessText = __("You can't upgrade or downgrade plans at the moment, coming soon!");
  } else if (membershipIsUnlockable) {
    // This is the green alert, only used to prevent the modal from moving when moving tiers from one that
    // has access to one that doesn't
    accessText = __(
      membersOnly
        ? !isLivestream
          ? 'This membership gives you access to the members-only comment section.'
          : 'This membership gives you access to the members-only chat mode.'
        : 'This membership gives you access to the current content.'
    );
  }

  return (
    <>
      {unlockableTierIds && (
        <div className={'access-status' + ' ' + (membershipIsUnlockable ? 'green' : 'red')}>
          <p>{accessText}</p>
        </div>
      )}

      {activeArStatus !== 'connected' && !isChannelTab ? (
        <WalletStatus />
      ) : (
        <>
          {!isChannelTab && <div className="selected-membership">{selectedMembershipName}</div>}

          <section className="membership-tier__header">
            <span>{membership.name}</span>
          </section>

          <section className="membership-tier__infos">
            <span className="membership-tier__infos-description">
              {membership.description}
            </span>
            <label>{__('Pledge')}</label>
            <span style={{ display: 'flex' }}>${(membership?.prices[0].amount / 100).toFixed(2)}</span>

            <div className="membership-tier__perks">
              <div className="membership-tier__moon" />
              <div className="membership-tier__perks-content">
                {membership.perks && membership.perks.length > 0 ? (
                  <>
                    <label>{__('Perks')}</label>
                    <ul>
                      {membership.perks.map((tierPerk, i) => (
                        <li key={i}>{__(tierPerk.name)}</li>
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
      )}
    </>
  );
};

export default MembershipDetails;
