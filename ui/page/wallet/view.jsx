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

const CURRENCY_QUERY_PARAM = 'currency';
const CREDITS_QUERY_PARAM_VALUE = 'credits';
const FIAT_QUERY_PARAM_VALUE = 'fiat';

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

  // @if TARGET='web'
  const urlParams = new URLSearchParams(search);

  const currentView = urlParams.get(TAB_QUERY) || TABS.LBRY_CREDITS_TAB;
  const currencyValue = urlParams.get(CURRENCY_QUERY_PARAM);

  let tabIndex;
  switch (currentView) {
    case TABS.LBRY_CREDITS_TAB:
      tabIndex = 0;
      break;
    case TABS.PAYMENT_HISTORY:
      if (currencyValue === CREDITS_QUERY_PARAM_VALUE) {
        tabIndex = 1;
      } else if (currencyValue === FIAT_QUERY_PARAM_VALUE) {
        tabIndex = 2;
      }
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
      url += `${TAB_QUERY}=${TABS.PAYMENT_HISTORY}&${CURRENCY_QUERY_PARAM}=${CREDITS_QUERY_PARAM_VALUE}`;
    } else if (newTabIndex === 2) {
      url += `${TAB_QUERY}=${TABS.PAYMENT_HISTORY}&${CURRENCY_QUERY_PARAM}=${FIAT_QUERY_PARAM_VALUE}`;
    } else {
      url += `${TAB_QUERY}=${TABS.LBRY_CREDITS_TAB}`;
    }
    push(url);
  }
  // @endif

  const { totalBalance } = props;
  const showIntro = totalBalance === 0;
  const loading = totalBalance === undefined;

  return (
    <>
      {/* @if TARGET='web' */}
      <Page className="transactionsPage-wrapper">
        <Tabs onChange={onTabChange} index={tabIndex}>
          <TabList className="tabs__list--collection-edit-page">
            <Tab>{__('Balance')}</Tab>
            <Tab>{__('Credits')}</Tab>
            <Tab>{__('Tips')}</Tab>
          </TabList>
          <TabPanels>
            {/* balances for lbc and fiat */}
            <TabPanel>
              <WalletBalance />
            </TabPanel>
            {/* transactions panel */}
            <TabPanel>
              <div className="section card-stack">
                <div className="lbc-transactions">
                  {loading && (
                    <div className="main--empty">
                      <Spinner delayed />
                    </div>
                  )}
                  {!loading && (
                    <>
                      {showIntro && <YrblWalletEmpty includeWalletLink />}
                      <div className="card-stack">
                        <TxoList search={search} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              <div className="section card-stack">
                <div className="lbc-transactions">
                  {loading && (
                    <div className="main--empty">
                      <Spinner delayed />
                    </div>
                  )}
                  {!loading && (
                    <>
                      <div className="card-stack">
                        <TxoList search={search} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Page>
      {/* @endif */}
      {/* @if TARGET='app' */}
      <Page>
        {loading && (
          <div className="main--empty">
            <Spinner delayed />
          </div>
        )}
        {!loading && (
          <>
            {showIntro ? (
              <YrblWalletEmpty includeWalletLink />
            ) : (
              <div className="card-stack">
                <TxoList search={search} />
              </div>
            )}
          </>
        )}
      </Page>
      {/* @endif */}
    </>
  );
};

export default WalletPage;
