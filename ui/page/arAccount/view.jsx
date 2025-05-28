// @flow
import React from 'react';
import { useHistory } from 'react-router';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Page from 'component/page';
import Button from 'component/button';
import Symbol from 'component/common/symbol';
import WalletConnect from 'component/walletConnect';
// import ReceiveAr from './receiveAr';
import BuyAr from './buyAr';
import ArWallets from './arWallets';

import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import './style.scss';
import Overview from './overview';

type Props = {
  arweaveWallets: any,
  arWalletStatus: any,
  balance: any,
  fetching: boolean,
  theme: string,
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
  const { arweaveWallets, arWalletStatus, balance, fetching, theme, doArDisconnect, doArUpdateBalance } = props;
  const {
    location: { search },
    push,
  } = useHistory();
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
        <Symbol token="ar" amount={balance.ar} precision={2} />
        <div
          onClick={handleUpdateBalance}
          className={!fetching ? `refresh-balance` : `refresh-balance refresh-balance--loading`}
        >
          <Icon icon={ICONS.REFRESH} />
        </div>
        {arWalletStatus && (
          <Button button="alt" label={__('Disconnect Wallet')} onClick={handleArConnectDisconnect} />
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
            {arweaveWallets && arweaveWallets.length > 0 ? (
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
                arWalletStatus={arWalletStatus}
              />
              {!arWalletStatus && (
                <div className="wallet">
                  <WalletConnect />
                </div>
              )}
            </>
          </TabPanel>
          <TabPanel>
            <>
              <BuyAr cardHeader={cardHeader} wallet={activeWallet} arWalletStatus={arWalletStatus} />
              {!arWalletStatus && (
                <div className="wallet">
                  <WalletConnect />
                </div>
              )}
            </>
          </TabPanel>
          <TabPanel>
            <>
              <ArWallets cardHeader={cardHeader} arWalletStatus={arWalletStatus} arweaveWallets={arweaveWallets} />
              {!arWalletStatus && (
                <div className="wallet">
                  <WalletConnect />
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
