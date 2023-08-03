// @flow
import React from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import Page from 'component/page';
import I18nMessage from 'component/i18nMessage';
import Spinner from 'component/spinner';
import ButtonStripeConnectAccount from 'component/buttonStripeConnectAccount';

import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as STRIPE from 'constants/stripe';

import './style.scss';

type Props = {
  // -- redux --
  accountInfo: ?StripeAccountInfo,
  unpaidBalance: number,
  chargesEnabled: ?boolean,
  accountRequiresVerification: ?boolean,
  doTipAccountStatus: () => Promise<StripeAccountStatus>,
};

const StripeAccountConnection = (props: Props) => {
  const { accountInfo, unpaidBalance, chargesEnabled, accountRequiresVerification, doTipAccountStatus } = props;

  const { email, id: accountId } = accountInfo || {};
  const bankAccountNotFetched = chargesEnabled === undefined;

  React.useEffect(() => {
    if (bankAccountNotFetched) {
      doTipAccountStatus();
    }
  }, [bankAccountNotFetched, doTipAccountStatus]);

  if (bankAccountNotFetched) {
    return (
      <Page
        noFooter
        noSideNavigation
        settingsPage
        className="card-stack"
        backout={{ title: __('Your Payout Method'), backLabel: __('Back') }}
      >
        <div className="main--empty">
          <Spinner />
        </div>
      </Page>
    );
  }

  return (
    <Page
      noFooter
      noSideNavigation
      settingsPage
      className="card-stack"
      backout={{
        title: !chargesEnabled ? __('Add Payout Method') : __('Your Payout Method'),
        backLabel: __('Back'),
      }}
    >
      <Card
        title={
          <div className="table__header-text">
            {chargesEnabled ? __('Bank account connected') : __('Connect a bank account')}
          </div>
        }
        background
        isBodyList
        body={
          chargesEnabled ? (
            <div className="card__body-actions connected-account-information">
              <h3>{__('Congratulations! Your account has been connected with Odysee.')}</h3>
              <h3>
                <I18nMessage tokens={{ email: <span className="bolded-email">{email}</span> }}>
                  The email you registered with Stripe is %email%
                </I18nMessage>
              </h3>

              {accountRequiresVerification && (
                <>
                  <h3 style={{ marginTop: '10px' }}>
                    {__('Although your account is connected it still requires verification to begin receiving tips.')}
                  </h3>
                  <h3 style={{ marginTop: '10px' }}>
                    {__(
                      'Please use the button below to complete your verification process and enable tipping for ' +
                        'your account.'
                    )}
                  </h3>
                </>
              )}
            </div>
          ) : unpaidBalance > 0 ? (
            // TODO: hopefully we won't be using this anymore and can remove it
            <div className="card__body-actions">
              <h3>{__('Congratulations, you have already begun receiving tips on Odysee!')}</h3>
              <div>
                <br />
                <h3>{__('Your pending account balance is $%balance% USD.', { balance: unpaidBalance / 100 })}</h3>
              </div>
              <br />
              <div>
                <h3>{__('Connect your bank account to be able to cash your pending balance out to your account.')}</h3>
              </div>
            </div>
          ) : (
            <div className="card__body-actions">
              <h3>{__('Connect your bank account to Odysee to receive donations directly from users')}</h3>
            </div>
          )
        }
        actions={
          chargesEnabled && !accountRequiresVerification ? (
            <>
              <Button
                button="secondary"
                label={__('View Tips')}
                icon={ICONS.SETTINGS}
                navigate={`/$/${PAGES.WALLET}?fiatType=incoming&tab=fiat-payment-history&currency=fiat`}
              />
              {accountId && (
                <Button
                  button="secondary"
                  icon={ICONS.SETTINGS}
                  label={__('View Account On Stripe')}
                  navigate={`${STRIPE.STRIPE_ACCOUNT_DASHBOARD_URL}/${accountId}`}
                  className="stripe__view-account-button"
                />
              )}
            </>
          ) : (
            <ButtonStripeConnectAccount />
          )
        }
      />
    </Page>
  );
};

export default StripeAccountConnection;
