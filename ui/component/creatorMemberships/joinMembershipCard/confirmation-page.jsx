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
  membershipTier: any,
  fetchStarted: boolean,
  handleJoinMembership: () => void,
  onCancel: () => void,
};

export default function ConfirmationPage(props: Props) {
  const { channelName, membershipTier, fetchStarted, handleJoinMembership, onCancel } = props;

  return (
    <div className="confirm__wrapper">
      <ConfirmationGroup label={__('Subscribing to:')} value={channelName} />
      <ConfirmationGroup label={__('On tier:')} value={membershipTier.displayName} />
      <ConfirmationGroup label={__('For:')} value={`$${membershipTier.monthlyContributionInUSD}`} />
      <ConfirmationGroup
        label={__('You get:')}
        value={membershipTier.perks.map((tierPerk, i) => (
          <p key={tierPerk}>
            {/* list all the perks */}
            {perkDescriptions.map(
              (globalPerk, i) =>
                tierPerk === globalPerk.perkName && (
                  <ul>
                    <li className="membership-join__plan-perks__li">{globalPerk.perkDescription}</li>
                  </ul>
                )
            )}
          </p>
        ))}
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

const ConfirmationGroup = (props: GroupProps) => {
  const { label, value } = props;

  return (
    <div className="confirm__group">
      <span className="confirm__label">{label}</span>
      <span className="confirm__value">{value}</span>
    </div>
  );
};
