// @flow
import React from 'react';
import { URL } from 'config';
import { formatLbryUrlForWeb } from 'util/url';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import CopyableText from 'component/copyableText';
import ChannelThumbnail from 'component/channelThumbnail';
import ButtonNavigateChannelId from 'component/buttonNavigateChannelId';
import './style.scss';

type Props = {
  channelsToList: ?Array<ChannelClaim>,
  onTabChange: (tabIndex: number) => void,
  hasTiers: ?boolean,
  // -- redux --
  bankAccountConfirmed: ?boolean,
  doSetActiveChannel: (claimId: ?string, override?: boolean) => void,
};

function OverviewTab(props: Props) {
  const { channelsToList, onTabChange, hasTiers, bankAccountConfirmed, doSetActiveChannel } = props;

  function selectChannel(channelClaim) {
    doSetActiveChannel(channelClaim.claim_id, true);
    onTabChange(1);
  }

  return (
    <>
      <h1>Total Supporters:</h1>
      <h1>Total Monthly Income:</h1>
      <h1>Total Received:</h1>
      <br />
      {/* to-do: hard set it to "All" */}

      {channelsToList && (
        <div className="membership__mychannels-wrapper">
          <div className="membership__mychannels-header">
            <div />
            <label>Channel Incomes</label>
          </div>
          <div className="membership__mychannels-content">
            {hasTiers && bankAccountConfirmed && (
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
                      <tr key={channelClaim.claim_id} onClick={() => selectChannel(channelClaim)}>
                        <td>
                          <ChannelThumbnail xsmall uri={channelClaim.canonical_url} />
                          {channelClaim.value.title || channelClaim.name}
                        </td>
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
            {/* Tiers status */}
            {!hasTiers && (
              <div className="bank-account-status">
                <div>
                  <label>{__(`You don't have any Tiers`)}</label>
                  <span>
                    {__('To be able to begin receiving payments you have to add at least 1 Tier to your channel.')}
                  </span>
                </div>
                <Button requiresChannel button="primary" label={__('Add a Tier')} onClick={() => onTabChange(1)} />
              </div>
            )}

            {/* Bank account connection status */}
            {hasTiers && !bankAccountConfirmed && (
              <div className="bank-account-status">
                <div>
                  <label>{__('Bank Account Status')}</label>
                  <span>{__('To be able to begin receiving payments you must connect a Bank Account first.')}</span>
                </div>
                <Button
                  button="primary"
                  label={__('Connect a bank account')}
                  icon={ICONS.FINANCE}
                  navigate={`$/${PAGES.SETTINGS_STRIPE_ACCOUNT}`}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default OverviewTab;
