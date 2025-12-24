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
  doTipAccountStatus: () => void,
};

const WalletPage = (props: Props) => {
  const { doTipAccountStatus } = props;
  const {
    location: { search },
    push,
  } = useHistory();

  // @if TARGET='web'
  // Some contexts (e.g. HTML entity decoding) can turn `&currency=` into `¤cy=`.
  // Normalize it so the Wallet tabs don't get stuck due to missing params.
  const normalizedSearch = (search || '').replace(/%C2%A4cy=/gi, '&currency=').replace(/¤cy=/g, '&currency=');
  const urlParams = new URLSearchParams(normalizedSearch);
  const currentView = urlParams.get(TAB_QUERY) || TABS.LBRY_CREDITS_TAB;
  const currencyValue = urlParams.get(CURRENCY_QUERY_PARAM);
  const transactionType = urlParams.get('transactionType');

  let tabIndex = 0;
  switch (currentView) {
    case TABS.LBRY_CREDITS_TAB:
      tabIndex = 0;
      break;

    case TABS.PAYMENT_HISTORY:
      // If the param is missing/malformed, default to Credits history.
      if (!currencyValue || currencyValue === CREDITS_QUERY_PARAM_VALUE) {
        tabIndex = 1;
      } else if (currencyValue === FIAT_QUERY_PARAM_VALUE) {
        tabIndex = transactionType === 'tips' ? 2 : 3;
      }
      break;

    default:
      tabIndex = 0;
      break;
  }

  React.useEffect(() => {
    doTipAccountStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onTabChange(newTabIndex) {
    const urlParams = new URLSearchParams();

    if (newTabIndex === 0) {
      urlParams.set(TAB_QUERY, TABS.LBRY_CREDITS_TAB);
    } else if (newTabIndex === 1) {
      urlParams.set(TAB_QUERY, TABS.PAYMENT_HISTORY);
      urlParams.set(CURRENCY_QUERY_PARAM, CREDITS_QUERY_PARAM_VALUE);
    } else if (newTabIndex === 2) {
      urlParams.set(TAB_QUERY, TABS.PAYMENT_HISTORY);
      urlParams.set(CURRENCY_QUERY_PARAM, FIAT_QUERY_PARAM_VALUE);
      urlParams.set('transactionType', 'tips');
    } else if (newTabIndex === 3) {
      urlParams.set(TAB_QUERY, TABS.PAYMENT_HISTORY);
      urlParams.set(CURRENCY_QUERY_PARAM, FIAT_QUERY_PARAM_VALUE);
      urlParams.set('transactionType', 'rentals-purchases');
    } else {
      urlParams.set(TAB_QUERY, TABS.LBRY_CREDITS_TAB);
    }

    push(`/$/${PAGES.WALLET}?${urlParams.toString()}`);
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
                <img src="https://thumbnails.odycdn.com/optimize/s:140:0/quality:95/plain/https://thumbs.odycdn.com/dcee45614b2798d1a09d2c43dda5fade.webp" />
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
                      <div className="card-stack">{tabIndex === 1 && <TxoList search={normalizedSearch} />}</div>
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
                      <div className="card-stack">{tabIndex === 2 && <TxoList search={normalizedSearch} />}</div>
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
                      <div className="card-stack">{tabIndex === 3 && <TxoList search={normalizedSearch} />}</div>
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
                <TxoList search={normalizedSearch} />
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
