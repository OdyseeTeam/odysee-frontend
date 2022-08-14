// @flow
import React from 'react';
import Spinner from 'component/spinner';
import Button from 'component/button';
import BalanceText from 'react-balance-text';

type Props = {
  closeModal?: () => void,
  onCancel: () => void,
  selectedTier: any, // todo: membership type
  // -- redux --
  activeChannelClaim: any,
  channelName: string,
  doMembershipBuy: (membershipParams: any, cb?: () => void) => void,
  fetchStarted: boolean,
};

export default function ConfirmationPage(props: Props) {
  const {
    activeChannelClaim,
    channelName,
    closeModal,
    doMembershipBuy,
    fetchStarted,
    onCancel,
    selectedTier,
  } = props;

  function handleJoinMembership() {
    const testChannelParams = {
      membership_id: selectedTier.Membership.id,
      channel_id: activeChannelClaim.claim_id,
      channel_name: activeChannelClaim.name,
      price_id: selectedTier.NewPrices[0].Price.stripe_price_id,
    };

    doMembershipBuy(testChannelParams, closeModal);
  }

  return (
    <div className="confirm__wrapper">
      <div className="confirmation-section__div" style={{ overflow: 'auto', maxHeight: '461px' }}>
        { console.log(selectedTier) }
        <ConfirmationSection label={__('Subscribing To:')} value={channelName} />
        <ConfirmationSection label={__('Membership Tier:')} value={selectedTier.Membership.name} />
        <ConfirmationSection
          style={{ maxWidth: '300px', margin: '10px auto', lineHeight: '27px' }}
          label={__('Description:')}
          value={<BalanceText>{selectedTier.Membership.description}</BalanceText>}
        />
        <ConfirmationSection label={__('Monthly Cost:')} value={`$${selectedTier.NewPrices[0].Price.amount / 100}`} />

        {selectedTier.Perks && selectedTier.Perks.length && (<>
          <ConfirmationSection
            className="membership-features-confirmation__section"
            label={__('Features and Perks:')}
            value={
              <ul className="membership-join-perks__list">
                {selectedTier.Perks.map((tierPerk, i) =>
                  <li className="section__subtitle membership-join__perk-item">{tierPerk.name}</li>
                )}
              </ul>
            }
          />
        </>)}
      </div>

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
