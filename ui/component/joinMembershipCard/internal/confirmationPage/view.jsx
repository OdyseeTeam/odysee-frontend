// @flow
import React from 'react';

import BusyIndicator from 'component/common/busy-indicator';
import Button from 'component/button';
import ChannelSelector from 'component/channelSelector';
import { Submit } from 'component/common/form';

import withCreditCard from 'hocs/withCreditCard';

type Props = {
  selectedTier: CreatorMembership,
  onCancel: () => void,
  // -- redux --
  channelName: string,
  purchasePending: boolean,
};

const ConfirmationPage = (props: Props) => {
  const { selectedTier, onCancel, channelName, purchasePending } = props;

  const totalCost =
    `$${(selectedTier.NewPrices[0].Price.amount / 100).toFixed(2)}` +
    ' (' +
    __(
      'Creator revenue' +
        ': ' +
        `$${(selectedTier.NewPrices[0].creator_receives_amount / 100).toFixed(2)}` +
        ', ' +
        ' ' +
        __('Payment processing fee') +
        ': ' +
        `$${(selectedTier.NewPrices[0].fees.stripe_fee / 100).toFixed(2)}` +
        ', ' +
        __('Odysee platform fee') +
        ': ' +
        `$${(selectedTier.NewPrices[0].fees.odysee_fee / 100).toFixed(2)}` +
        ')'
    );
  return (
    <div className="confirm__wrapper">
      <ConfirmationSection label={__('Join Membership As')} value={<ChannelSelector />} />
      <ConfirmationSection label={__('Joining Membership')} value={channelName} />
      <section>
        <label>{__('Membership Tier')}</label>
        <span>
          <div className="dot" />
          {selectedTier.Membership.name}
        </span>
      </section>
      <ConfirmationSection label={__('Description')} value={selectedTier.Membership.description} />
      <ConfirmationSection label={__('Total Monthly Cost')} value={totalCost} />
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
          <SubmitButton modalState={{ passedTier: selectedTier }} />
          <Button button="link" label={__('Cancel')} onClick={onCancel} />
        </div>
      )}
    </div>
  );
};

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

const SubmitButton = withCreditCard(() => <Submit autoFocus button="primary" label={__('Confirm')} />);

export default ConfirmationPage;
