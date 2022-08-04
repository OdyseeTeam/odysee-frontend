// @flow
import React from 'react';
import { useHistory } from 'react-router';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import * as PAGES from 'constants/pages';
import WalletBalance from 'component/walletBalance';
import Page from 'component/page';
import Spinner from 'component/spinner';
import YrblWalletEmpty from 'component/yrblWalletEmpty';
import TxoList from './internal/txoList';

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

const WalletPage = (props: Props) => {
  const {
    location: { search },
    push,
  } = useHistory();

  const urlParams = new URLSearchParams(search);

  const currentView = urlParams.get(TAB_QUERY) || TABS.LBRY_CREDITS_TAB;

  let tabIndex;
  switch (currentView) {
    case TABS.LBRY_CREDITS_TAB:
      tabIndex = 0;
      break;
    case TABS.PAYMENT_HISTORY:
      tabIndex = 1;
      break;
    case TABS.ACCOUNT_HISTORY:
      tabIndex = 2;
      break;
    default:
      tabIndex = 0;
      break;
  }

  function onTabChange(newTabIndex) {
    let url = `/$/${PAGES.WALLET}?`;

    if (newTabIndex === 0) {
      url += `${TAB_QUERY}=${TABS.LBRY_CREDITS_TAB}`;
    } else if (newTabIndex === 1) {
      url += `${TAB_QUERY}=${TABS.PAYMENT_HISTORY}`;
    } else if (newTabIndex === 2) {
      url += `${TAB_QUERY}=${TABS.ACCOUNT_HISTORY}`;
    } else {
      url += `${TAB_QUERY}=${TABS.LBRY_CREDITS_TAB}`;
    }
    push(url);
  }

  const { totalBalance } = props;
  const showIntro = totalBalance === 0;
  const loading = totalBalance === undefined;

  return (
    <Page className="transactionsPage-wrapper">
      <Tabs onChange={onTabChange} index={tabIndex}>
        <TabList className="tabs__list--collection-edit-page">
          <Tab>{__('Balance')}</Tab>
          <Tab>{__('Transactions')}</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <WalletBalance />
          </TabPanel>

          <TabPanel>
            <div className="section card-stack">
              {loading ? (
                <div className="main--empty">
                  <Spinner delayed />
                </div>
              ) : (
                <>
                  {showIntro && <YrblWalletEmpty includeWalletLink />}
                  <div className="card-stack">
                    <TxoList search={search} />
                  </div>
                </>
              )}
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Page>
  );
};

export default WalletPage;
