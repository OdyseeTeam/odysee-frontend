// @flow
import React from 'react';
import Spinner from 'component/spinner';
import Button from 'component/button';
import BalanceText from 'react-balance-text';

type Props = {
  selectedTier: any, // todo: membership type
  onCancel: () => void,
  closeModal?: () => void,
  // -- redux --
  channelName: string,
  activeChannelClaim: any,
  purchasePending: boolean,
  doMembershipBuy: (membershipParams: any, cb?: () => void) => void,
  doToast: (params: { message: string }) => void,
};

export default function ConfirmationPage(props: Props) {
  const {
    selectedTier,
    onCancel,
    closeModal,
    channelName,
    activeChannelClaim,
    purchasePending,
    doMembershipBuy,
    doToast,
  } = props;

  function handleJoinMembership() {
    const testChannelParams = {
      membership_id: selectedTier.Membership.id,
      channel_id: activeChannelClaim.claim_id,
      channel_name: activeChannelClaim.name,
      price_id: selectedTier.NewPrices[0].Price.stripe_price_id,
    };

    doMembershipBuy(testChannelParams, closeModal).then(() =>
      doToast({
        message: __(
          "You are now a '%membership_tier_name%' member for %creator_channel_name%, enjoy the perks and special features!",
          {
            membership_tier_name: selectedTier.Membership.name,
            creator_channel_name: selectedTier.Membership.channel_name,
          }
        ),
      })
    );
  }

  return (
    <div className="confirm__wrapper">
      <div className="confirmation-section__div" style={{ overflow: 'auto', maxHeight: '461px' }}>
        <ConfirmationSection label={__('Subscribing To:')} value={channelName} />
        <ConfirmationSection label={__('Membership Tier:')} value={selectedTier.Membership.name} />
        <ConfirmationSection
          style={{ maxWidth: '300px', margin: '10px auto', lineHeight: '27px' }}
          label={__('Description:')}
          value={<BalanceText>{selectedTier.Membership.description}</BalanceText>}
        />
        <ConfirmationSection label={__('Monthly Cost:')} value={`$${selectedTier.NewPrices[0].Price.amount / 100}`} />
        {selectedTier.Perks && selectedTier.Perks.length && (
          <>
            <ConfirmationSection
              className="membership-features-confirmation__section"
              label={__('Features and Perks:')}
              value={
                <ul className="membership-join-perks__list">
                  {selectedTier.Perks.map((tierPerk, i) => (
                    <li key={tierPerk.name} className="section__subtitle membership-join__perk-item">
                      {tierPerk.name}
                    </li>
                  ))}
                </ul>
              }
            />
          </>
        )}
      </div>

      {purchasePending ? (
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
