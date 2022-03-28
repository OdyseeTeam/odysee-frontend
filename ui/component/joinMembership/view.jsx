// @flow
import { Form } from 'component/common/form';
import { Lbryio } from 'lbryinc';
import { parseURI } from 'util/lbryURI';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import Card from 'component/common/card';
import ChannelSelector from 'component/channelSelector';
import classnames from 'classnames';
import I18nMessage from 'component/i18nMessage';
import LbcSymbol from 'component/common/lbc-symbol';
import React from 'react';
import usePersistedState from 'effects/use-persisted-state';
import WalletTipAmountSelector from 'component/walletTipAmountSelector';

import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

type Props = {};

export default function JoinMembership(props: Props) {
  const { claim, isModal } = props;

  console.log('claim');
  console.log(claim);

  let membershipTiers = [
    {
      displayName: 'Helping Hand',
      description: "You're doing your part, thank you!",
      monthlyContributionInUSD: 5,
      perks: ['exclusiveAccess', 'badge'],
    },
    {
      displayName: 'Big-Time Supporter',
      description: 'You are a true fan and are helping in a big way!',
      monthlyContributionInUSD: 10,
      perks: ['exclusiveAccess', 'earlyAccess', 'badge', 'emojis'],
    },
    {
      displayName: 'Community MVP',
      description: 'Where would this creator be without you? You are a true legend!',
      monthlyContributionInUSD: 20,
      perks: ['exclusiveAccess', 'earlyAccess', 'badge', 'emojis', 'custom-badge'],
    },
  ];

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

  // setup variables for tip API
  const channelClaimId = claim ? (claim.signing_channel ? claim.signing_channel.claim_id : claim.claim_id) : undefined;
  const tipChannelName = claim ? (claim.signing_channel ? claim.signing_channel.name : claim.name) : undefined;

  const [isOnConfirmationPage, setConfirmationPage] = React.useState(false);

  const [hasCardSaved, setHasSavedCard] = usePersistedState('comment-support:hasCardSaved', false);
  const [canReceiveFiatTip, setCanReceiveFiatTip] = React.useState(); // dont persist because it needs to be calc'd per creator

  const [membershipIndex, setMembershipIndex] = React.useState(0);

  const [activeTab, setActiveTab] = React.useState('Tier1');

  const tabButtonProps = { isOnConfirmationPage, activeTab, setActiveTab, setMembershipIndex };

  // if a membership can't be purchased from the creator
  const shouldDisableSelector = !hasCardSaved || !canReceiveFiatTip;

  function membershipJoin() {
    if (!isOnConfirmationPage) {
      setConfirmationPage(true);
    } else {
      // doesn't exist yet
      // doJoinCreatorMembership();
    }
  }

  // check if user has a payment method saved
  React.useEffect(() => {
    if (!stripeEnvironment) return;

    Lbryio.call(
      'customer',
      'status',
      {
        environment: stripeEnvironment,
      },
      'post'
    ).then((customerStatusResponse) => {
      const defaultPaymentMethodId =
        customerStatusResponse.Customer &&
        customerStatusResponse.Customer.invoice_settings &&
        customerStatusResponse.Customer.invoice_settings.default_payment_method &&
        customerStatusResponse.Customer.invoice_settings.default_payment_method.id;

      setHasSavedCard(Boolean(defaultPaymentMethodId));
    });
  }, [setHasSavedCard]);

  // check if creator has a tip account saved
  React.useEffect(() => {
    if (!stripeEnvironment) return;

    Lbryio.call(
      'account',
      'check',
      {
        channel_claim_id: channelClaimId,
        channel_name: tipChannelName,
        environment: stripeEnvironment,
      },
      'post'
    )
      .then((accountCheckResponse) => {
        if (accountCheckResponse === true && canReceiveFiatTip !== true) {
          setCanReceiveFiatTip(true);
        }
      })
      .catch(() => {});
  }, [canReceiveFiatTip, channelClaimId, tipChannelName]);

  return (
    <Form style={{ maxHeight: '475px' }}>
      {/* if there is no LBC balance, show user frontend to get credits */}
      {/* if there is lbc, the main tip/boost gui with the 3 tabs at the top */}
      <Card
        title="Join Creator Membership"
        className={'join-membership-modal'}
        subtitle={
          isOnConfirmationPage ? (
            <>
              <div className="section section--padded card--inline confirm__wrapper">
                <div className="section">
                  <div className="confirm__label">{__('Subscribing to:')}</div>
                  <div className="confirm__value">{tipChannelName}</div>
                  <div className="confirm__label">{__('On tier: ')}</div>
                  <div className="confirm__value">{membershipTiers[membershipIndex].displayName}</div>
                  <div className="confirm__label">{__('For:')}</div>
                  <div className="confirm__value">${membershipTiers[membershipIndex].monthlyContributionInUSD}</div>
                  <div className="confirm__label">{__('You get: ')}</div>
                  {membershipTiers[membershipIndex].perks.map((tierPerk, i) => (
                    <>
                      <p>
                        {/* list all the perks */}
                        {perkDescriptions.map((globalPerk, i) => (
                          <>
                            {tierPerk === globalPerk.perkName && (
                              <>
                                <ul>
                                  <li className="join-membership-modal-perks__li">{globalPerk.perkDescription}</li>
                                </ul>
                              </>
                            )}
                          </>
                        ))}
                      </p>
                    </>
                  ))}
                </div>
              </div>

              <div className="section__actions">
                <Button autoFocus onClick={() => setConfirmationPage(false)} button="primary" label={__('Confirm')} />
                <Button button="link" label={__('Cancel')} onClick={() => setConfirmationPage(false)} />
              </div>
            </>
          ) : (
            <>
              <h1 className="join-membership-modal__subheader">Join this creator's channel for access</h1>
              <h1 className="join-membership-modal__subheader" style={{ marginBottom: '14px' }}>
                to exclusive content and perks
              </h1>
              <div className="section membership-modal-tab-buttons">
                {membershipTiers.map((membershipTier, index) => (
                  <>
                    {/* change tier button */}
                    <TabSwitchButton
                      index={index}
                      label={__('Tier ' + (index + 1))}
                      name={`Tier${index + 1}`}
                      {...tabButtonProps}
                    />
                  </>
                ))}
              </div>
              <div className="join-membership-modal-information__div">
                <h1 className="join-membership-modal-plan__header">{membershipTiers[membershipIndex].displayName}</h1>
                <h1 className="join-membership-modal-plan__description">
                  {membershipTiers[membershipIndex].description}
                </h1>
                <div className="join-membership-modal-perks">
                  <h1 style={{ marginTop: '30px' }}>{isModal ? 'Perks:' : 'Perks'}</h1>
                  {membershipTiers[membershipIndex].perks.map((tierPerk, i) => (
                    <>
                      <p>
                        {/* list all the perks */}
                        {perkDescriptions.map((globalPerk, i) => (
                          <>
                            {tierPerk === globalPerk.perkName && (
                              <>
                                <ul>
                                  <li className="join-membership-modal-perks__li">{globalPerk.perkDescription}</li>
                                </ul>
                              </>
                            )}
                          </>
                        ))}
                      </p>
                    </>
                  ))}
                </div>
              </div>

              {/* help message */}
              {!hasCardSaved && (
                <div className={'help add-a-card-help-message'}>
                  <Button navigate={`/$/${PAGES.SETTINGS_STRIPE_CARD}`} label={__('Add a Card')} button="link" />
                  {' ' + __('To Become a Channel Member')}
                </div>
              )}

              <Button
                className="join-membership-modal-purchase__button"
                icon={ICONS.UPGRADE}
                button="primary"
                type="submit"
                disabled={shouldDisableSelector}
                label={`Signup for $${membershipTiers[membershipIndex].monthlyContributionInUSD} a month`}
                onClick={membershipJoin}
              />
            </>
          )
        }
      />
    </Form>
  );
}

type TabButtonProps = {
  icon: string,
  label: string,
  name: string,
  isOnConfirmationPage: boolean,
  activeTab: string,
  setActiveTab: (string) => void,
  index: number,
  setMembershipIndex: (number) => void,
};

const TabSwitchButton = (tabButtonProps: TabButtonProps) => {
  const {
    icon,
    label,
    name,
    isOnConfirmationPage,
    activeTab,
    setActiveTab,
    index,
    setMembershipIndex,
  } = tabButtonProps;

  return (
    <Button
      key={name}
      icon={icon}
      label={label}
      button="alt"
      onClick={() => {
        const tipInputElement = document.getElementById('tip-input');
        if (tipInputElement) tipInputElement.focus();
        if (!isOnConfirmationPage) {
          setActiveTab(name);
          setMembershipIndex(index);
        }
      }}
      className={classnames('button-toggle', { 'button-toggle--active': activeTab === name })}
    />
  );
};
