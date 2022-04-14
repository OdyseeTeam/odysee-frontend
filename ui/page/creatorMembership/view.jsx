/* eslint-disable no-console */
// @flow
import React from 'react';
import moment from 'moment';
import Page from 'component/page';
import Spinner from 'component/spinner';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';
import Card from 'component/common/card';
import MembershipSplash from 'component/membershipSplash';
import Button from 'component/button';
import ChannelSelector from 'component/channelSelector';
import PremiumBadge from 'component/common/premium-badge';
import I18nMessage from 'component/i18nMessage';
import useGetUserMemberships from 'effects/use-get-user-memberships';
import usePersistedState from 'effects/use-persisted-state';
import { useHistory } from 'react-router';

let stripeEnvironment = getStripeEnvironment();

const isDev = process.env.NODE_ENV !== 'production';

let log = (input) => {};
if (isDev) log = console.log;

// odysee channel information since the memberships are only for Odysee
const odyseeChannelId = '80d2590ad04e36fb1d077a9b9e3a8bba76defdf8';
const odyseeChannelName = '@odysee';

type Props = {
  history: { action: string, push: (string) => void, replace: (string) => void },
  location: { search: string, pathname: string },
  totalBalance: ?number,
  openModal: (string, {}) => void,
  activeChannelClaim: ?ChannelClaim,
  channels: ?Array<ChannelClaim>,
  claimsByUri: { [string]: any },
  fetchUserMemberships: (claimIdCsv: string) => void,
  incognito: boolean,
  updateUserOdyseeMembershipStatus: () => void,
  user: ?User,
  locale: ?LocaleInfo,
  preferredCurrency: ?string,
};

const OdyseeMembershipPage = (props: Props) => {
  const {
    openModal,
    activeChannelClaim,
    channels,
    claimsByUri,
    fetchUserMemberships,
    updateUserOdyseeMembershipStatus,
    incognito,
    user,
    locale,
    preferredCurrency,
  } = props;

  const { goBack } = useHistory();

  const myMemberships = [1, 2];

  return (
    <Page className="premium-wrapper">
      <div className="billingHistory-back__button">
        {/* todo: how to show this conditionally */}
        <Button button="primary" label={__('Go Back')} onClick={() => goBack()} />
      </div>

      <h1 className="billingHistory__header">Your Billing History for test2342</h1>
      <table className="table table--transactions">
        <thead>
          <tr>
            <th className="date-header">Channel Name</th>
            <th className="channelName-header">Membership Tier</th>
            <th className="channelName-header">Payment Date</th>
            <th className="location-header">Support Amount</th>
            <th className="amount-header">Receipt</th>
          </tr>
        </thead>
        <tbody>
          {myMemberships.map((pledge, i) => (
            <>
              <tr>
                <td>test2342</td>
                <td>Community MVP</td>
                <td>{new Date().toLocaleString()}</td>
                <td>$29.99</td>
                <Button button="link" navigate={pledge.url + '?view=membership'} style={{ marginTop: '5px' }}>
                  <span dir="auto" className="button__label">
                    See Receipt
                  </span>
                </Button>
              </tr>
            </>
          ))}
        </tbody>
      </table>
    </Page>
  );
};

export default OdyseeMembershipPage;
