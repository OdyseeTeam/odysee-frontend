// @flow
import { Form } from 'component/common/form';
import { Lbryio } from 'lbryinc';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import Card from 'component/common/card';
import classnames from 'classnames';
import React from 'react';
import usePersistedState from 'effects/use-persisted-state';
import Spinner from 'component/spinner';

import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

const testChannel = {
  membership_id: 7,
  channel_id: '0b67b972c8e9a15ebc5fd1f316ad38460767c939',
  channel_name: '@test35234',
  price_id: 'price_1KlXw8IrsVv9ySuhFJJ4HSgq',
};

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

type Props = {
  isModal?: boolean,
  closeModal?: () => void,
  // -- redux --
  claim: ChannelClaim,
  fetchStarted: ?boolean,
  doMembershipBuy: (any: any) => void,
};

export default function JoinMembership(props: Props) {
  const { claim, fetchStarted, isModal, closeModal, doMembershipBuy } = props;

  // setup variables for tip API
  const channelClaimId = claim ? (claim.signing_channel ? claim.signing_channel.claim_id : claim.claim_id) : undefined;
  const tipChannelName = claim ? (claim.signing_channel ? claim.signing_channel.name : claim.name) : undefined;

  const [isOnConfirmationPage, setConfirmationPage] = React.useState(false);

  const [hasCardSaved, setHasSavedCard] = usePersistedState('comment-support:hasCardSaved', false);
  const [canReceiveFiatTip, setCanReceiveFiatTip] = React.useState(); // dont persist because it needs to be calc'd per creator

  const [membershipIndex, setMembershipIndex] = React.useState(0);

  const [activeTab, setActiveTab] = React.useState('Tier1');

  // if a membership can't be purchased from the creator
  const shouldDisableSelector = claim?.name !== '@test35234';

  function handleJoinMembership() {
    if (!isOnConfirmationPage) {
      setConfirmationPage(true);
    } else {
      doMembershipBuy(testChannel, closeModal);
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

  if (fetchStarted) {
    return (
      <div className="main--empty">
        <Spinner />
      </div>
    );
  }

  const tabButtonProps = { isOnConfirmationPage, activeTab, setActiveTab, setMembershipIndex };

  return (
    <Form>
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
                    <p key={tierPerk}>
                      {/* list all the perks */}
                      {perkDescriptions.map(
                        (globalPerk, i) =>
                          tierPerk === globalPerk.perkName && (
                            <ul>
                              <li className="join-membership-modal-perks__li">{globalPerk.perkDescription}</li>
                            </ul>
                          )
                      )}
                    </p>
                  ))}
                </div>
              </div>

              <div className="section__actions">
                <Button autoFocus onClick={handleJoinMembership} button="primary" label={__('Confirm')} />
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
                    <p key={tierPerk}>
                      {/* list all the perks */}
                      {perkDescriptions.map(
                        (globalPerk, i) =>
                          tierPerk === globalPerk.perkName && (
                            <ul>
                              <li className="join-membership-modal-perks__li">{globalPerk.perkDescription}</li>
                            </ul>
                          )
                      )}
                    </p>
                  ))}
                </div>
              </div>

              {/* help message */}
              {shouldDisableSelector && (
                <div className={'help add-a-card-help-message'}>
                  {!hasCardSaved ? (
                    <>
                      <Button navigate={`/$/${PAGES.SETTINGS_STRIPE_CARD}`} label={__('Add a Card')} button="link" />
                      {' ' + __('To Become a Channel Member')}
                    </>
                  ) : (
                    __('Only creators that verify cash accounts can receive tips')
                  )}
                </div>
              )}

              <Button
                className="join-membership-modal-purchase__button"
                icon={ICONS.UPGRADE}
                button="primary"
                type="submit"
                disabled={shouldDisableSelector}
                label={`Signup for $${membershipTiers[membershipIndex].monthlyContributionInUSD} a month`}
                onClick={handleJoinMembership}
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
