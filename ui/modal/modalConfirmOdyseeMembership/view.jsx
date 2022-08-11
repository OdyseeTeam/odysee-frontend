// @flow
import React from 'react';

import { Modal } from 'modal/modal';

import * as ICONS from 'constants/icons';
import * as MEMBERSHIPS from 'constants/memberships';

import Card from 'component/common/card';
import Button from 'component/button';
import I18nMessage from 'component/i18nMessage';

type Props = {
  membership: MembershipData,
  price: MembershipPriceDetails,
  // -- redux --
  activeChannelClaim: ?ChannelClaim,
  channels: ?Array<ChannelClaim>,
  incognito: boolean,
  preferredCurrency: CurrencyOption,
  doMembershipBuy: (any: any) => void,
  doHideModal: () => void,
};

export default function ConfirmOdyseeMembershipPurchase(props: Props) {
  const {
    membership,
    price,
    // -- redux --
    activeChannelClaim,
    channels,
    incognito,
    preferredCurrency,
    doMembershipBuy,
    doHideModal,
  } = props;

  const { Membership } = membership;

  const [waitingForBackend, setWaitingForBackend] = React.useState();
  const [statusText, setStatusText] = React.useState();

  const { name: activeChannelName, claim_id: activeChannelId } = activeChannelClaim || {};
  const noChannelsOrIncognitoMode = incognito || !channels;
  const plan = Membership.name;

  // TODO: can clean this up, some repeating text
  function buildPurchaseString(price, plan) {
    let featureString = '';

    // generate different strings depending on other conditions
    if (plan === 'Premium' && !noChannelsOrIncognitoMode) {
      featureString = (
        <I18nMessage tokens={{ channel_name: <b className="membership-bolded">{activeChannelName}</b> }}>
          Your badge will be shown for your %channel_name% channel in all areas of the app, and can be added to two
          additional channels in the future for free.
        </I18nMessage>
      );
    } else if (plan === 'Premium+' && !noChannelsOrIncognitoMode) {
      // user has channel selected
      featureString = (
        <I18nMessage tokens={{ channel_name: <b className="membership-bolded">{activeChannelName}</b> }}>
          The no ads feature applies site-wide for all channels and your badge will be shown for your %channel_name%
          channel in all areas of the app, and can be added to two additional channels in the future for free.
        </I18nMessage>
      );
    } else if (plan === 'Premium' && !channels) {
      // user has no channels
      featureString = __(
        'You currently have no channels. To show your badge on a channel, please create a channel first. If you register a channel later you will be able to show a badge for up to three channels.'
      );
    } else if (plan === 'Premium+' && !channels) {
      // user has no channels
      featureString = __(
        'The no ads feature applies site-wide. You currently have no channels. To show your badge on a channel, please create a channel first. If you register a channel later you will be able to show a badge for up to three channels.'
      );
    } else if (plan === 'Premium' && incognito) {
      // user has incognito selected
      featureString = __(
        'You currently have no channel selected and will not have a badge be visible, if you want to show a badge you can select a channel now, or you can show a badge for up to three channels in the future for free.'
      );
    } else if (plan === 'Premium+' && incognito) {
      // user has incognito selected
      featureString = __(
        'The no ads feature applies site-wide. You currently have no channel selected and will not have a badge be visible, if you want to show a badge you can select a channel now, or you can show a badge for up to three channels in the future for free.'
      );
    }

    return (
      <>
        <I18nMessage
          tokens={{
            time_interval_bold: <b className="membership-bolded">{MEMBERSHIPS.INTERVALS[price.recurring.interval]}</b>,
            time_interval: MEMBERSHIPS.INTERVALS[price.recurring.interval],
            price_bold: (
              <b className="membership-bolded">{`${preferredCurrency.toUpperCase()} ${
                MEMBERSHIPS.CURRENCY_SYMBOLS[price.currency]
              }${price.unit_amount / 100}`}</b>
            ),
            plan,
          }}
        >
          You are purchasing a %time_interval_bold% %plan% membership that is active immediately and will renew
          %time_interval% at a price of %price_bold%.
        </I18nMessage>

        {featureString}

        {__(
          'You can cancel Premium at any time (no refunds) and you can also close this window and choose a different membership option.'
        )}
      </>
    );
  }

  function handleClick() {
    // if (hasMembership) {
    //   cancelMembership();
    // } else {
    setWaitingForBackend(true);
    setStatusText(__('Completing your purchase...'));

    doMembershipBuy({
      membership_id: Membership.id,
      channel_id: activeChannelId,
      channel_name: activeChannelName,
      price_id: price.id,
    }).then(doHideModal);
    // }
  }

  return (
    <Modal
      className="confirm-odysee-premium__modal"
      ariaHideApp={false}
      isOpen
      contentLabel={__('Confirm Membership Purchase')}
      type="card"
      onAborted={doHideModal}
    >
      <Card
        className="stripe__confirm-remove-membership"
        title={__('Confirm %plan% Membership', { plan })}
        subtitle={buildPurchaseString(price, plan)}
        actions={
          <div className="section__actions">
            {!waitingForBackend ? (
              <>
                <Button
                  className="stripe__confirm-remove-card"
                  button="primary"
                  icon={ICONS.FINANCE}
                  label={__('Confirm Purchase')}
                  onClick={handleClick}
                />
                <Button button="link" label={__('Cancel')} onClick={doHideModal} />
              </>
            ) : (
              <h1 style={{ fontSize: '18px' }}>{statusText}</h1>
            )}
          </div>
        }
      />
    </Modal>
  );
}
