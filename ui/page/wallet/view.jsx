// @flow
import React from 'react';
import { useHistory } from 'react-router';
import Icon from 'component/common/icon';
import WalletBalance from 'component/walletBalance';
import Page from 'component/page';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import Spinner from 'component/spinner';
import YrblWalletEmpty from 'component/yrblWalletEmpty';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import TxoList from './txoList';
import './style.scss';

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
  const transactionType = urlParams.get('transactionType');

  let tabIndex;
  switch (currentView) {
    case TABS.LBRY_CREDITS_TAB:
      tabIndex = 0;
      break;
    case TABS.PAYMENT_HISTORY:
      if (currencyValue === CREDITS_QUERY_PARAM_VALUE) {
        tabIndex = 1;
      } else if (currencyValue === FIAT_QUERY_PARAM_VALUE) {
        if (transactionType === 'tips') {
          tabIndex = 2;
        } else {
          tabIndex = 3;
        }
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
      url += `${TAB_QUERY}=${TABS.PAYMENT_HISTORY}&${CURRENCY_QUERY_PARAM}=${FIAT_QUERY_PARAM_VALUE}&transactionType=tips`;
    } else if (newTabIndex === 3) {
      url += `${TAB_QUERY}=${TABS.PAYMENT_HISTORY}&${CURRENCY_QUERY_PARAM}=${FIAT_QUERY_PARAM_VALUE}&transactionType=rentals-purchases`;
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
            <Tab>{__('Rentals/Purchases')}</Tab>
          </TabList>
          <TabPanels>
            {/* balances for lbc and fiat */}
            <TabPanel>
              <div className="tmp-lbc-announcement">
                <img src="https://thumbs.odycdn.com/dcee45614b2798d1a09d2c43dda5fade.webp" />
                <h3><Icon icon={ICONS.LBC} />LBC will be going away soon</h3>
                <p>Odysee will be using AR cryptocurrency for Payments and Monetization.</p>
              </div>
              <WalletBalance />
            </TabPanel>
            {/* credits tab */}
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
                      <div className="card-stack">{tabIndex === 1 && <TxoList search={search} />}</div>
                    </>
                  )}
                </div>
              </div>
            </TabPanel>
            {/* tips tab */}
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
                      <div className="card-stack">{tabIndex === 2 && <TxoList search={search} />}</div>
                    </>
                  )}
                </div>
              </div>
            </TabPanel>
            {/* rentals/purchases tab */}
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
                      <div className="card-stack">{tabIndex === 3 && <TxoList search={search} />}</div>
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
