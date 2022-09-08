// @flow
import React from 'react';

import BusyIndicator from 'component/common/busy-indicator';
import Button from 'component/button';
import ChannelSelector from 'component/channelSelector';
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
      <ConfirmationSection label={__('Subscribing As')} value={<ChannelSelector />} />
      <ConfirmationSection label={__('Subscribing To')} value={channelName} />
      <ConfirmationSection label={__('Membership Tier')} value={selectedTier.Membership.name} />
      <ConfirmationSection label={__('Description')} value={selectedTier.Membership.description} />
      <ConfirmationSection
        label={__('Monthly Cost')}
        value={`$${selectedTier.NewPrices && selectedTier.NewPrices[0].Price.amount / 100}`}
      />
      {selectedTier.Perks && selectedTier.Perks.length > 0 && (
        <ConfirmationSection
          label={__('Features and Perks')}
          value={
            <ul className="ul--no-style membership-tier__perks">
              {/* $FlowFixMe -- already handled above */}
              {selectedTier.Perks.map((tierPerk, i) => (
                <li key={i}>{tierPerk.name}</li>
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
  const { label, value } = props;

  return (
    <section>
      <label>{label}</label>
      <span>{value}</span>
    </section>
  );
};
