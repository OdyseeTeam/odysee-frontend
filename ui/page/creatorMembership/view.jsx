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

  return (
    <>
      <Page className="premium-wrapper">
        <div>
          <h1>Hey this is the creator page!</h1>
        </div>
      </Page>
    </>
  );
};

export default OdyseeMembershipPage;
