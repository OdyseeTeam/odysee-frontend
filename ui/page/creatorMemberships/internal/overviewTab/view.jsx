// @flow
import React from 'react';
import { URL } from 'config';
import { formatLbryUrlForWeb } from 'util/url';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import CopyableText from 'component/copyableText';
import ButtonNavigateChannelId from 'component/buttonNavigateChannelId';

type Props = {
  channelsToList: ?Array<ChannelClaim>,
  // -- redux --
  bankAccountConfirmed: ?boolean,
};

function OverviewTab(props: Props) {
  const { channelsToList, bankAccountConfirmed } = props;

  return (
    <>
      {channelsToList && (
        <div className="membership-table__wrapper">
          <table className="table">
            <thead>
              <tr>
                <th className="channelName-header">Channel Name</th>
                <th>{__('Supporters')}</th>
                <th>{__('Estimated Monthly Income')}</th>
                <th>{__('Total Received')}</th>
                <th className="membership-table__page">{__('Page')}</th>
                <th className="membership-table__url">{__('URL')}</th>
              </tr>
            </thead>
            <tbody>
              {channelsToList.map((channelClaim) => (
                <tr key={channelClaim.claim_id}>
                  <td>{channelClaim.value.title || channelClaim.name}</td>
                  <td>0</td>
                  <td>$0</td>
                  <td>$0</td>
                  <td>
                    <ButtonNavigateChannelId
                      button="primary"
                      // className="membership_button"
                      // label={__('View your membership page')}
                      icon={ICONS.UPGRADE}
                      navigate={`${formatLbryUrlForWeb(channelClaim.canonical_url)}?view=membership`}
                    />
                  </td>
                  <td className="membership-table__url">
                    <CopyableText
                      onlyCopy
                      primaryButton
                      copyable={`${URL}${formatLbryUrlForWeb(channelClaim.canonical_url)}?view=membership`}
                      snackMessage={__('Page location copied')}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

export default OverviewTab;
