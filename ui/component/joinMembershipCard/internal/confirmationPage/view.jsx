// @flow
import React from 'react';

import * as STRIPE from 'constants/stripe';
import BusyIndicator from 'component/common/busy-indicator';
import Button from 'component/button';
import ChannelSelector from 'component/channelSelector';
import ErrorBubble from 'component/common/error-bubble';
import I18nMessage from 'component/i18nMessage';
import { Submit } from 'component/common/form';
import Symbol from 'component/common/symbol';

type Props = {
  selectedCreatorMembership: CreatorMembership,
  selectedMembershipIndex: number,
  onCancel: () => void,
  // -- redux --
  channelName: string,
  purchasePending: boolean,
  preferredCurrency: ?string,
  incognito: boolean,
  isRenewal?: boolean,
  balance: WalletBalance,
  exchangeRate: { ar: number },
  doArConnect: () => void,
  membershipBuyError: string,
  doMembershipBuyClear: () => void,
};

const ConfirmationPage = (props: Props) => {
  const {
    selectedCreatorMembership,
    selectedMembershipIndex,
    onCancel,
    channelName,
    purchasePending,
    preferredCurrency,
    incognito,
    isRenewal = false,
    balance,
    exchangeRate,
    doArConnect,
    membershipBuyError,
    doMembershipBuyClear,
  } = props;

  const { ar: arBalance } = balance;
  const { ar: dollarsPerAr } = exchangeRate;

  React.useEffect(() => {
    doArConnect();
  }, [doArConnect]);

  React.useEffect(() => {
    return () => {
      doMembershipBuyClear();
    };
  }, [doMembershipBuyClear]);

  const total = Number((Number(selectedCreatorMembership.prices[0].amount) / 100).toFixed(2));
  return (
    <div className="confirm__wrapper">
      <h1>{__('Almost done')}</h1>
      <ConfirmationSection
        label={
          isRenewal
            ? __(`Renew %channelName%'s Membership As`, { channelName })
            : __(`Join %channelName%'s Membership As`, { channelName })
        }
        value={<ChannelSelector />}
      />
      <section>
        <label>{__('Membership Tier')}</label>
        <span>
          <div className="dot" />
          {selectedCreatorMembership.name}
        </span>
      </section>
      <ConfirmationSection
        className={'membership-tier__description'}
        label={__('Description')}
        value={selectedCreatorMembership.description}
      />

      <section>
        <label>{__('Total Monthly Cost')}</label>
        <span className="total-membership-price">
          <span className="total">
            ${total} (<Symbol token="ar" amount={total / exchangeRate.ar} />)
          </span>
        </span>
      </section>
      {selectedCreatorMembership.perks && selectedCreatorMembership.perks.length > 0 && (
        <ConfirmationSection
          label={__('Features and Perks')}
          value={
            <ul className="ul--no-style membership-tier__perks">
              {/* $FlowFixMe -- already handled above */}
              {selectedCreatorMembership.perks.map((tierPerk, i) => (
                <li key={i}>{__(tierPerk.name)}</li>
              ))}
            </ul>
          }
        />
      )}

      {preferredCurrency && preferredCurrency === STRIPE.CURRENCIES.EUR ? (
        <>
          <ErrorBubble>
            {__('You currently have EUR selected as your preferred currency, currently only USD is supported.')}
          </ErrorBubble>

          <div className="section__actions">
            <Button button="primary" label={__('Change Settings')} navigate="/$/settings/card" />
          </div>
        </>
      ) : purchasePending ? (
        <BusyIndicator message={__('Processing payment...')} />
      ) : (
        <>
          <div className="section__actions">
            {incognito && (
              <p className="help">
                <div className="error__text">
                  {__("You are about to join as Anonymous, you won't be able to view or comment on chat at this time")}
                </div>
              </p>
            )}
            {(!arBalance || (dollarsPerAr && Number(dollarsPerAr) * arBalance < total)) && (
              <p className="help">
                <div className="error__text">{__('Insufficient Balance')}</div>
              </p>
            )}

            <SubmitButton
              isRenewal={isRenewal}
              disabled={!arBalance || (!!dollarsPerAr && Number(dollarsPerAr) * arBalance < total)}
              modalState={{ passedTierIndex: selectedMembershipIndex }}
            />
            <Button button="link" label={__('Cancel')} onClick={onCancel} />
          </div>

          {membershipBuyError && <p className="error">{membershipBuyError}</p>}
          <p className="help">
            <I18nMessage
              tokens={{
                membership_terms_and_conditions: (
                  <Button
                    button="link"
                    href="https://help.odysee.tv/category-memberships/"
                    label={__('Membership Terms and Conditions')}
                  />
                ),
              }}
            >
              By proceeding, you agree to the %membership_terms_and_conditions%. Subscriptions are paid in
              cryptocurrency, so you’ll need to make a renewal payment every month to stay subscribed. All payments are
              final and non-refundable.
            </I18nMessage>
          </p>
        </>
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
  const { label, value, className } = props;

  return (
    <section>
      <label>{label}</label>
      <span className={className}>{value}</span>
    </section>
  );
};

const SubmitButton = (props: { isRenewal: boolean, disabled: boolean }) => (
  <Submit disabled={props.disabled} autoFocus button="primary" label={props.isRenewal ? __('Renew') : __('Confirm')} />
);

export default ConfirmationPage;
