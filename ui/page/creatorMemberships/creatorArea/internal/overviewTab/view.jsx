// @flow
import React from 'react';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import HelpHub from 'component/common/help-hub';
import ChannelOverview from './internal/channelOverview';

import './style.scss';

type Props = {
  onChannelSelect: () => void,
  // -- redux --
  myChannelClaims: Array<ChannelClaim>,
  totalSupportersAmount: number,
  totalMonthlyIncome: number,
  doSetActiveChannel: (claimId: ?string, override?: boolean) => void,
};

function OverviewTab(props: Props) {
  const { onChannelSelect, myChannelClaims, totalSupportersAmount, totalMonthlyIncome, doSetActiveChannel } = props;

  function selectChannel(channelClaim) {
    doSetActiveChannel(channelClaim.claim_id, true);
    onChannelSelect();
  }

  return (
    <>
      <table className="table table-total">
        <tr>
          {/* todo: allow sorting */}
          <td>
            {/* todo: make this a link to the supporters tab with all channel set to on */}
            {/* so they can see all their supporters */}
            {__('Total Supporters')} <span>{totalSupportersAmount}</span>
          </td>
          <td>
            {__('Total Monthly Income')} <span>${(totalMonthlyIncome / 100).toFixed(2)}</span>
          </td>
        </tr>
      </table>

      <div className="link-to-bank-account">
        <h2>You can view your balance and transaction history on Stripe from the Bank Accounts section.</h2>
        <Button
          button="secondary"
          label={__('Bank Accounts')}
          icon={ICONS.SETTINGS}
          navigate={`/$/${PAGES.SETTINGS_STRIPE_ACCOUNT}`}
        />
      </div>

      <div className="membership-table__wrapper">
        <table className="table">
          <thead>
            <tr>
              <th className="channelName-header" colSpan="2">
                {__('Channel Name')}
              </th>
              <th>{__('Supporters')}</th>
              <th>{__('Estimated Monthly Income')}</th>
              <th className="membership-table__page">{__('Page')}</th>
              <th className="membership-table__url">{__('URL')}</th>
            </tr>
          </thead>

          <tbody>
            {myChannelClaims.map((channelClaim) => (
              <tr key={channelClaim.claim_id} onClick={() => selectChannel(channelClaim)}>
                <ChannelOverview channelClaim={channelClaim} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <HelpHub
        href="https://help.odysee.tv/category-memberships/"
        image="Spaceman"
        text={__(
          'Want to increase your channel growth? Spaceman has whipped up some marketing concepts in the %help_hub%.'
        )}
      />
    </>
  );
}

export default OverviewTab;
