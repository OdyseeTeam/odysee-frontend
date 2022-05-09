// @flow
import React from 'react';
import Spinner from 'component/spinner';
import Button from 'component/button';
import BalanceText from 'react-balance-text';

// const testChannel = {
//   membership_id: 7,
//   channel_id: '0b67b972c8e9a15ebc5fd1f316ad38460767c939',
//   channel_name: '@test35234',
//   price_id: 'price_1KlXw8IrsVv9ySuhCFlKEJvj',
// };

const perkDescriptions = [
  {
    perkName: 'exclusiveAccess',
    perkDescription: 'Members-only content',
  },
  {
    perkName: 'earlyAccess',
    perkDescription: 'Early access content',
  },
  {
    perkName: 'badge',
    perkDescription: 'Member Badge',
  },
  {
    perkName: 'emojis',
    perkDescription: 'Members-only emojis',
  },
  {
    perkName: 'custom-badge',
    perkDescription: 'MVP member badge',
  },
];

type Props = {
  selectedTier: any, // todo: membership type
  onCancel: () => void,
  closeModal?: () => void,
  // -- redux --
  channelName: string,
  fetchStarted: boolean,
  activeChannelClaim: any,
  doMembershipBuy: (membershipParams: any, cb?: () => void) => void,
};

export default function ConfirmationPage(props: Props) {
  const { selectedTier, onCancel, closeModal, channelName, fetchStarted, activeChannelClaim, doMembershipBuy } = props;

  function handleJoinMembership() {
    const testChannelParams = {
      membership_id: 7, // TODO: this is hardcoded for now
      channel_id: activeChannelClaim.claim_id,
      channel_name: activeChannelClaim.name,
      price_id: 'price_1KlXw8IrsVv9ySuhCFlKEJvj', // TODO: this is hardcoded for now
    };

    doMembershipBuy(testChannelParams, closeModal);
  }

  return (
    <div className="confirm__wrapper">
      <ConfirmationSection label={__('Subscribing To:')} value={channelName} />
      <ConfirmationSection label={__('Membership Tier:')} value={selectedTier.displayName} />
      <ConfirmationSection
        style={{ maxWidth: '300px', margin: '0 auto', marginBottom: '10px', lineHeight: '27px' }}
        label={__('Description:')}
        value={<BalanceText>{selectedTier.description}</BalanceText>}
      />
      <ConfirmationSection label={__('Monthly Cost:')} value={`$${selectedTier.monthlyContributionInUSD}`} />
      <ConfirmationSection
        className="membership-features-confirmation__section"
        label={__('Features and Perks:')}
        value={
          <ul className="membership-join-perks__list">
            {selectedTier.perks.map((tierPerk, i) =>
              perkDescriptions.map(
                (globalPerk, i) =>
                  tierPerk === globalPerk.perkName && (
                    <li className="section__subtitle membership-join__perk-item">{globalPerk.perkDescription}</li>
                  )
              )
            )}
          </ul>
        }
      />

      {fetchStarted ? (
        <div className="membership-join__spinner">
          <Spinner type="small" text={__('Processing payment...')} />
        </div>
      ) : (
        <div className="section__actions">
          <Button autoFocus onClick={handleJoinMembership} button="primary" label={__('Confirm')} />
          <Button button="link" label={__('Cancel')} onClick={onCancel} />
        </div>
      )}
    </div>
  );
}

type GroupProps = {
  className?: string,
  label: string,
  value: string | React$Node,
  style: any,
};

const ConfirmationSection = (props: GroupProps) => {
  const { label, value, className, style } = props;

  return (
    <section style={style} className={`confirm__section ${className || ''}`}>
      <span className="confirm__label">{label}</span>
      <span className="section__subtitle confirm__value">{value}</span>
    </section>
  );
};
