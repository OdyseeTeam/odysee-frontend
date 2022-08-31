// @flow
import React from 'react';
import { URL } from 'config';
import { formatLbryUrlForWeb } from 'util/url';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import CopyableText from 'component/copyableText';

type Props = {
  // -- redux --
  activeChannelClaim: ?ChannelClaim,
  bankAccountConfirmed: ?boolean,
};

function CreatorMembershipsTab(props: Props) {
  const { bankAccountConfirmed, activeChannelClaim } = props;

  return (
    <>
      <h1>{__('Membership Page')}</h1>

      {activeChannelClaim && (
        <>
          <Button
            button="primary"
            className="membership_button"
            label={__('View your membership page')}
            icon={ICONS.UPGRADE}
            navigate={`${formatLbryUrlForWeb(activeChannelClaim.canonical_url)}?view=membership`}
          />

          <span>{__('You can also click the button below to copy your membership page url')}</span>

          <CopyableText
            className="membership-page__copy-button"
            primaryButton
            copyable={`${URL}${formatLbryUrlForWeb(activeChannelClaim.canonical_url)}?view=membership`}
            snackMessage={__('Page location copied')}
          />
        </>
      )}

      {/* Dashboard showing income/supporters amount */}
      <label>{__('Received Funds')}</label>

      {/* TODO: replace this with API calls */}
      <label>{__('Total Supporters: 0')}</label>

      <label>{__('Estimated Monthly Income: $0')}</label>

      <label>{__('Total Received: $0')}</label>

      {/* <h1 style={{ marginTop: '10px' }}>{__('You do not any withdrawable funds')}</h1> */}

      {/* Bank account connection status */}
      <div className="bank-account-information__div">
        <div className="bank-account-status__div">
          {!bankAccountConfirmed && (
            <>
              <h1>{__('Bank Account Status')}</h1>
              <h2>{__('To be able to begin receiving payments you must connect a Bank Account first')}</h2>
              <Button
                button="primary"
                className="membership_button"
                label={__('Connect a bank account')}
                icon={ICONS.FINANCE}
                navigate={`$/${PAGES.SETTINGS_STRIPE_ACCOUNT}`}
                style={{ maxWidth: '254px' }}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default CreatorMembershipsTab;
