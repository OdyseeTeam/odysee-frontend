// @flow
import React from 'react';
import { useHistory } from 'react-router';
import WalletBalance from 'component/walletBalance';
import TxoList from 'component/txoList';
import Page from 'component/page';
import * as PAGES from 'constants/pages';
import Spinner from 'component/spinner';
import YrblWalletEmpty from 'component/yrblWalletEmpty';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';

const TAB_QUERY = 'tab';

const TABS = {
  LBRY_CREDITS_TAB: 'credits',
  ACCOUNT_HISTORY: 'fiat-account-history',
  PAYMENT_HISTORY: 'fiat-payment-history',
};

type Props = {
  history: { action: string, push: (string) => void, replace: (string) => void },
  location: { search: string, pathname: string },
  totalBalance: ?number,
};

const OdyseeMembershipPage = (props: Props) => {
  const {
    location: { search },
    push,
  } = useHistory();


  const { totalBalance } = props;
  const showIntro = totalBalance === 0;
  const loading = totalBalance === undefined;

  return (
    <>
      <Page>
        <h2>Hello!</h2>
      </Page>
    </>
  );
};

export default OdyseeMembershipPage;
