// @flow
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import React from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import Page from 'component/page';

type Props = {
  source: string,
  doOpenModal: (string, {}) => void,
  // -- redux --
  accountPendingConfirmation: ?boolean,
  accountNotConfirmedButReceivedTips: ?boolean,
  stripeConnectionUrl: ?string,
  accountStatus: { accountConfirmed: ?boolean, stillRequiringVerification: ?boolean },
  doToast: ({ message: string }) => void,
  doTipAccountStatus: (any) => void,
};

type State = {
  unpaidBalance: number,
  pageTitle: string,
};

class StripeAccountConnection extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      unpaidBalance: 0,
      pageTitle: 'Add Payout Method',
    };
  }

  componentDidMount() {
    const { doTipAccountStatus } = this.props;

    doTipAccountStatus({ getInfo: true });
  }

  render() {
    const {
      stripeConnectionUrl,
      accountStatus,
      accountPendingConfirmation,
      accountNotConfirmedButReceivedTips,
    } = this.props;
    const { unpaidBalance, pageTitle } = this.state;
    const { accountConfirmed, stillRequiringVerification } = accountStatus;

    return (
      <Page
        noFooter
        noSideNavigation
        settingsPage
        className="card-stack"
        backout={{ title: pageTitle, backLabel: __('Back') }}
      >
        <Card
          title={<div className="table__header-text">{__('Connect a bank account')}</div>}
          isBodyList
          body={
            <div>
              {/* show while waiting for account status */}
              {!accountConfirmed && !accountPendingConfirmation && !accountNotConfirmedButReceivedTips && (
                <div className="card__body-actions">
                  <div>
                    <div>
                      <h3>{__('Getting your bank account connection status...')}</h3>
                    </div>
                  </div>
                </div>
              )}
              {/* user has yet to complete their integration */}
              {!accountConfirmed && accountPendingConfirmation && (
                <div className="card__body-actions">
                  <div>
                    <div>
                      <h3>{__('Connect your bank account to Odysee to receive donations directly from users')}</h3>
                    </div>
                    <div className="section__actions">
                      <a href={stripeConnectionUrl}>
                        <Button button="secondary" label={__('Connect your bank account')} icon={ICONS.FINANCE} />
                      </a>
                    </div>
                  </div>
                </div>
              )}
              {/* user has completed their integration */}
              {accountConfirmed && (
                <div className="card__body-actions">
                  <div>
                    <div>
                      <h3>{__('Congratulations! Your account has been connected with Odysee.')}</h3>
                      {stillRequiringVerification && (
                        <>
                          <h3 style={{ marginTop: '10px' }}>
                            Although your account is connected it still requires verification to begin receiving tips.
                          </h3>
                          <h3 style={{ marginTop: '10px' }}>
                            Please use the button below to complete your verification process and enable tipping for
                            your account.
                          </h3>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* TODO: hopefully we won't be using this anymore and can remove it */}
              {accountNotConfirmedButReceivedTips && (
                <div className="card__body-actions">
                  <div>
                    <div>
                      <h3>{__('Congratulations, you have already begun receiving tips on Odysee!')}</h3>
                      <div>
                        <br />
                        <h3>
                          {__('Your pending account balance is $%balance% USD.', { balance: unpaidBalance / 100 })}
                        </h3>
                      </div>
                      <br />
                      <div>
                        <h3>
                          {__('Connect your bank account to be able to cash your pending balance out to your account.')}
                        </h3>
                      </div>
                      <div className="section__actions">
                        <a href={stripeConnectionUrl}>
                          <Button button="secondary" label={__('Connect your bank account')} icon={ICONS.FINANCE} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          }
          // only show additional buttons if its for additional verification or to show transaction page
          actions={
            (stillRequiringVerification || accountConfirmed) && (
              <>
                {stillRequiringVerification && (
                  <Button
                    button="primary"
                    label={__('Complete Verification')}
                    icon={ICONS.SETTINGS}
                    navigate={stripeConnectionUrl}
                    className="stripe__complete-verification-button"
                  />
                )}
                {accountConfirmed && (
                  <Button
                    button="secondary"
                    label={__('View Transactions')}
                    icon={ICONS.SETTINGS}
                    navigate={`/$/${PAGES.WALLET}?fiatType=incoming&tab=fiat-payment-history&currency=fiat`}
                  />
                )}
              </>
            )
          }
        />
        <br />
      </Page>
    );
  }
}

export default StripeAccountConnection;
