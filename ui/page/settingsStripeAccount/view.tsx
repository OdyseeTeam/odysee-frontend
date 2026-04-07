import React from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import Page from 'component/page';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import './style.scss';

const StripeAccountConnection = () => {
  return (
    <Page
      noFooter
      noSideNavigation
      settingsPage
      className="card-stack"
      backout={{
        title: __('Legacy Payout Settings'),
        backLabel: __('Back'),
      }}
    >
      <Card
        title={<div className="table__header-text">{__('Fiat payout accounts retired')}</div>}
        background
        isBodyList
        body={
          <div className="card__body-actions connected-account-information">
            <h3>{__('Stripe-based payout accounts are no longer supported.')}</h3>
            <p>
              {__(
                'If you still have legacy fiat payout data attached to your account, it is now read-only and no longer managed from this app.'
              )}
            </p>
            <p>{__('Use wallet and Arweave account flows for any active creator payout setup.')}</p>
          </div>
        }
        actions={
          <div className="section__actions">
            <Button button="secondary" label={__('Open Wallet')} icon={ICONS.WALLET} navigate={`/$/${PAGES.WALLET}`} />
            <Button
              button="primary"
              icon={ICONS.AR}
              label={__('Open Arweave Account')}
              navigate={`/$/${PAGES.ARACCOUNT}`}
            />
          </div>
        }
      />
    </Page>
  );
};

export default StripeAccountConnection;
