// @flow
import React from 'react';

import BusyIndicator from 'component/common/busy-indicator';
import Button from 'component/button';
import BalanceText from 'react-balance-text';
import { Submit } from 'component/common/form';

type Props = {
  selectedTier: CreatorMembership,
  onCancel: () => void,
  // -- redux --
  channelName: string,
  purchasePending: boolean,
};

export default function ConfirmationPage(props: Props) {
  const { selectedTier, onCancel, channelName, purchasePending } = props;

  return (
    <div className="confirm__wrapper">
      <ConfirmationSection label={__('Subscribing To:')} value={channelName} />
      <ConfirmationSection label={__('Membership Tier:')} value={selectedTier.Membership.name} />
      <ConfirmationSection
        label={__('Description:')}
        value={<BalanceText>{selectedTier.Membership.description}</BalanceText>}
      />
      <ConfirmationSection label={__('Monthly Cost:')} value={`$${selectedTier.NewPrices[0].Price.amount / 100}`} />
      {selectedTier.Perks && selectedTier.Perks.length > 0 && (
        <ConfirmationSection
          label={__('Features and Perks:')}
          value={
            <ul className="ul--no-style membership__tier-perks">
              {/* $FlowFixMe -- already handled above */}
              {selectedTier.Perks.map((tierPerk, i) => (
                <li key={i} className="section__subtitle section__subtitle--join-membership__perk">
                  {tierPerk.name}
                </li>
              ))}
            </ul>
          }
        />
      )}

      {purchasePending ? (
        <BusyIndicator message={__('Processing payment...')} />
      ) : (
        <div className="section__actions">
          <Submit autoFocus button="primary" label={__('Confirm')} />
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
  style?: any,
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
