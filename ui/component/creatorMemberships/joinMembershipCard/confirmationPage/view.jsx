// @flow
import React from 'react';
import Spinner from 'component/spinner';
import Button from 'component/button';

const testChannel = {
  membership_id: 7,
  channel_id: '0b67b972c8e9a15ebc5fd1f316ad38460767c939',
  channel_name: '@test35234',
  price_id: 'price_1KlXw8IrsVv9ySuhCFlKEJvj',
};

const perkDescriptions = [
  {
    perkName: 'exclusiveAccess',
    perkDescription: 'You will exclusive access to members-only content',
  },
  {
    perkName: 'earlyAccess',
    perkDescription: 'You will get early access to this creators content',
  },
  {
    perkName: 'badge',
    perkDescription: 'You will get a generic badge showing you are a supporter of this creator',
  },
  {
    perkName: 'emojis',
    perkDescription: 'You will get access to custom members-only emojis offered by the creator',
  },
  {
    perkName: 'custom-badge',
    perkDescription: 'You can choose a custom badge showing you are an MVP supporter',
  },
];

type Props = {
  selectedTier: any, // todo: membership type
  onCancel: () => void,
  closeModal?: () => void,
  // -- redux --
  channelName: string,
  fetchStarted: boolean,
  doMembershipBuy: (membershipParams: any, cb?: () => void) => void,
};

export default function ConfirmationPage(props: Props) {
  const { selectedTier, onCancel, closeModal, channelName, fetchStarted, doMembershipBuy } = props;

  function handleJoinMembership() {
    doMembershipBuy(testChannel, closeModal);
  }

  return (
    <div className="confirm__wrapper">
      <ConfirmationSection label={__('Subscribing To:')} value={channelName} />
      <ConfirmationSection label={__('Membership Tier:')} value={selectedTier.displayName} />
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
};

const ConfirmationSection = (props: GroupProps) => {
  const { label, value, className } = props;

  return (
    <section className={`confirm__section ${className || ''}`}>
      <span className="confirm__label">{label}</span>
      <span className="section__subtitle confirm__value">{value}</span>
    </section>
  );
};
