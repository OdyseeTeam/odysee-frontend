// @flow
import React from 'react';
import Spinner from 'component/spinner';
import Button from 'component/button';

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
  channelName: string,
  membershipTier: any, // todo: membership type
  fetchStarted: boolean,
  handleJoinMembership: () => void,
  onCancel: () => void,
};

export default function ConfirmationPage(props: Props) {
  const { channelName, membershipTier, fetchStarted, handleJoinMembership, onCancel } = props;

  return (
    <div className="confirm__wrapper">
      <ConfirmationSection label={__('Subscribing to:')} value={channelName} />
      <ConfirmationSection label={__('On tier:')} value={membershipTier.displayName} />
      <ConfirmationSection label={__('For:')} value={`$${membershipTier.monthlyContributionInUSD}`} />
      <ConfirmationSection
        label={__('You get:')}
        value={
          <ul>
            {membershipTier.perks.map((tierPerk, i) =>
              perkDescriptions.map(
                (globalPerk, i) =>
                  tierPerk === globalPerk.perkName && (
                    <li className="membership-join__perk-item">{globalPerk.perkDescription}</li>
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
  label: string,
  value: string | Array<Node>,
};

const ConfirmationSection = (props: GroupProps) => {
  const { label, value } = props;

  return (
    <section className="confirm__section">
      <span className="confirm__label">{label}</span>
      <span className="confirm__value">{value}</span>
    </section>
  );
};
