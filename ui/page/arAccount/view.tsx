import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Page from 'component/page';
import Button from 'component/button';
import Symbol from 'component/common/symbol';
import WalletStatus from 'component/walletStatus';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import { useArStatus } from 'effects/use-ar-status';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectArweaveConnected,
  selectArweaveBalance,
  selectArweaveFetching,
  selectArweaveExchangeRates,
} from 'redux/selectors/arwallet';
import { selectFullAPIArweaveAccounts } from 'redux/selectors/stripe';
import { doArDisconnect, doArUpdateBalance } from 'redux/actions/arwallet';
import BuyAr from './buyAr';
import Overview from './overview';
import ArWallets from './arWallets';
import './style.scss';

const TAB_QUERY = 'tab';
const TABS = {
  OVERVIEW: 'overview',
  BUY: 'buy',
  WALLETS: 'wallets',
};

function disconnectArWallet(dispatchArDisconnect: () => void, navigate: (path: string) => void) {
  window.wanderInstance.authInfo.authType = undefined;
  dispatchArDisconnect();
  navigate(`/$/${PAGES.WALLET}`);
}

function updateArBalance(dispatchArUpdateBalance: () => void) {
  dispatchArUpdateBalance();
}

function ArAccountPage() {
  const dispatch = useAppDispatch();
  const arweaveWallets = useAppSelector(selectFullAPIArweaveAccounts);
  const arWalletStatus = useAppSelector(selectArweaveConnected);
  const balance = useAppSelector((state) => selectArweaveBalance(state) || { ar: 0 });
  const fetching = useAppSelector(selectArweaveFetching);
  const exchangeRate = useAppSelector(selectArweaveExchangeRates);

  const navigate = useNavigate();
  const { search } = useLocation();
  const { activeArStatus } = useArStatus();
  const activeWallet = arweaveWallets.find((x: any) => x.default);
  const urlParams = new URLSearchParams(search);
  const currentView = urlParams.get(TAB_QUERY) || TABS.OVERVIEW;
  let tabIndex;

  switch (currentView) {
    case TABS.OVERVIEW:
      tabIndex = 0;
      break;

    case TABS.BUY:
      tabIndex = 1;
      break;

    case TABS.WALLETS:
      tabIndex = 2;
      break;
  }

  function cardHeader() {
    return (
      <>
        <Symbol token="usd" amount={balance.ar * exchangeRate.ar} precision={2} />
        <div
          onClick={() => updateArBalance(() => dispatch(doArUpdateBalance()))}
          className={!fetching ? `refresh-balance` : `refresh-balance refresh-balance--loading`}
        >
          <Icon icon={ICONS.REFRESH} />
        </div>
        {arWalletStatus && (
          <Button
            button="alt"
            icon={ICONS.WANDER}
            label={__('Disconnect')}
            onClick={() => disconnectArWallet(() => dispatch(doArDisconnect()), navigate)}
          />
        )}
      </>
    );
  }

  function onTabChange(newTabIndex: number) {
    let url = `/$/${PAGES.ARACCOUNT}?`;

    if (newTabIndex === 0) {
      url += `${TAB_QUERY}=${TABS.OVERVIEW}`;
    } else if (newTabIndex === 1) {
      url += `${TAB_QUERY}=${TABS.BUY}`;
    } else if (newTabIndex === 2) {
      url += `${TAB_QUERY}=${TABS.WALLETS}`;
    } else {
      url += `${TAB_QUERY}=${TABS.OVERVIEW}`;
    }

    navigate(url);
  }

  return (
    <Page className="paymentAccountPage-wrapper main--full-width">
      <header className="page-header" />
      <Tabs onChange={onTabChange} index={tabIndex}>
        <div className="tab__wrapper">
          <TabList className="tabs__list">
            <Tab aria-selected={tabIndex === 0} onClick={() => onTabChange(0)}>
              {__('Overview')}
            </Tab>
            <Tab aria-selected={tabIndex === 1} onClick={() => onTabChange(1)}>
              {__('Buy')}
            </Tab>
            {arweaveWallets && arweaveWallets.length > 1 ? (
              <Tab aria-selected={tabIndex === 2} onClick={() => onTabChange(2)}>
                {__('My Wallets')}
              </Tab>
            ) : (
              <></>
            )}
          </TabList>
        </div>
        <TabPanels>
          <TabPanel>
            <>
              <Overview
                cardHeader={cardHeader}
                wallet={activeWallet}
                balance={balance}
                activeArStatus={activeArStatus}
              />
              {activeArStatus !== 'connected' && (
                <div className="wallet">
                  <WalletStatus />
                </div>
              )}
            </>
          </TabPanel>
          <TabPanel>
            <>
              <BuyAr cardHeader={cardHeader} wallet={activeWallet} activeArStatus={activeArStatus} />
              {activeArStatus !== 'connected' && (
                <div className="wallet">
                  <WalletStatus />
                </div>
              )}
            </>
          </TabPanel>
          <TabPanel>
            <>
              <ArWallets cardHeader={cardHeader} activeArStatus={activeArStatus} arweaveWallets={arweaveWallets} />
              {activeArStatus !== 'connected' && (
                <div className="wallet">
                  <WalletStatus />
                </div>
              )}
            </>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Page>
  );
}

export default ArAccountPage;
