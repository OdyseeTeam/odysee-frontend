// @flow
import React from 'react';
import { useHistory } from 'react-router';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Page from 'component/page';
import Button from 'component/button';
import Symbol from 'component/common/symbol';
import WalletStatus from 'component/walletStatus';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import { useArStatus } from 'effects/use-ar-status';
import BuyAr from './buyAr';
import Overview from './overview';
import ArWallets from './arWallets';


import './style.scss';

type Props = {
  arweaveWallets: any,
  arWalletStatus: any,
  balance: any,
  fetching: boolean,
  theme: string,
  exchangeRate: { ar: number },
  doArDisconnect: () => void,
  doArUpdateBalance: () => void,
};

const TAB_QUERY = 'tab';
const TABS = {
  OVERVIEW: 'overview',
  BUY: 'buy',
  WALLETS: 'wallets',
};

function ArAccountPage(props: Props) {
  const { arweaveWallets, arWalletStatus, balance, fetching, exchangeRate, doArDisconnect, doArUpdateBalance } = props;
  const {
    location: { search },
    push,
  } = useHistory();
  const {
    activeArStatus
  } = useArStatus();
  const activeWallet = arweaveWallets.find((x) => x.default);
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

  const handleArConnectDisconnect = () => {
    window.wanderInstance.authInfo.authType = undefined;
    doArDisconnect();
    push(`/$/${PAGES.WALLET}`);
  };

  const handleUpdateBalance = () => {
    doArUpdateBalance();
  };

  function cardHeader() {
    return (
      <>
        <Symbol token="usd" amount={(balance.ar*exchangeRate.ar)} precision={2} />
        <div
          onClick={handleUpdateBalance}
          className={!fetching ? `refresh-balance` : `refresh-balance refresh-balance--loading`}
        >
          <Icon icon={ICONS.REFRESH} />
        </div>
        {arWalletStatus && (
          <Button button="alt" icon={ICONS.WANDER} label={__('Disconnect')} onClick={handleArConnectDisconnect} />
        )}
      </>
    );
  }

  function onTabChange(newTabIndex) {
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
    push(url);
  }

  return (
    <Page className="paymentAccountPage-wrapper main--full-width">
      <header className="page-header"></header>
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
              <BuyAr
                cardHeader={cardHeader}
                wallet={activeWallet}
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
              <ArWallets 
                cardHeader={cardHeader} 
                activeArStatus={activeArStatus} 
                arweaveWallets={arweaveWallets}
              />
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
