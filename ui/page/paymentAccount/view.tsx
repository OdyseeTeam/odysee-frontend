import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Page from 'component/page';
import Button from 'component/button';
import Symbol from 'component/common/symbol';
import WalletConnect from 'component/walletConnect';
import SendUsdc from './sendUsdc';
import ReceiveUsdt from './receiveUsdc';
import OnRamper from './onRamper';
import ArWallets from './arWallets';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import './style.scss';
import Overview from './overview';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectArweaveConnected, selectArweaveBalance, selectArweaveFetching } from 'redux/selectors/arwallet';
import { selectAPIArweaveActiveAccounts } from 'redux/selectors/stripe';
import {
  doArDisconnect as doArDisconnectAction,
  doArUpdateBalance as doArUpdateBalanceAction,
} from 'redux/actions/arwallet';
import { selectThemePath } from 'redux/selectors/settings';
const TAB_QUERY = 'tab';
const TABS = {
  OVERVIEW: 'overview',
  RECEIVE: 'receive',
  SEND: 'send',
  BUY: 'buy',
  WITHDRAW: 'withdraw',
  WALLETS: 'wallets',
  TRANSACTION_HISTORY: 'transaction-history',
};

function PaymentAccountPage() {
  const dispatch = useAppDispatch();
  const arweaveWallets = useAppSelector(selectAPIArweaveActiveAccounts);
  const arWalletStatus = useAppSelector(selectArweaveConnected);
  const balance = useAppSelector((state) => selectArweaveBalance(state).usdc || 0);
  const fetching = useAppSelector(selectArweaveFetching);
  const theme = useAppSelector(selectThemePath);
  const navigate = useNavigate();
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const currentView = urlParams.get(TAB_QUERY) || TABS.OVERVIEW;
  let tabIndex;

  switch (currentView) {
    case TABS.OVERVIEW:
      tabIndex = 0;
      break;

    case TABS.RECEIVE:
      tabIndex = 1;
      break;

    case TABS.SEND:
      tabIndex = 2;
      break;

    case TABS.BUY:
      tabIndex = 3;
      break;

    case TABS.WITHDRAW:
      tabIndex = 4;
      break;

    case TABS.WALLETS:
      tabIndex = 5;
      break;

    default:
      tabIndex = 0;
      break;
  }

  function cardHeader() {
    return (
      <>
        <Symbol token="usdc" amount={balance} precision={2} isTitle />
        <div
          onClick={() => dispatch(doArUpdateBalanceAction())}
          className={!fetching ? `refresh-balance` : `refresh-balance refresh-balance--loading`}
        >
          <Icon icon={ICONS.REFRESH} />
        </div>
        {arWalletStatus && (
          <Button button="alt" label={__('Disconnect Wallet')} onClick={() => dispatch(doArDisconnectAction())} />
        )}
      </>
    );
  }

  function onTabChange(newTabIndex) {
    let url = `/$/${PAGES.PAYMENTACCOUNT}?`;

    if (newTabIndex === 0) {
      url += `${TAB_QUERY}=${TABS.OVERVIEW}`;
    } else if (newTabIndex === 1) {
      url += `${TAB_QUERY}=${TABS.RECEIVE}`;
    } else if (newTabIndex === 2) {
      url += `${TAB_QUERY}=${TABS.SEND}`;
    } else if (newTabIndex === 3) {
      url += `${TAB_QUERY}=${TABS.BUY}`;
    } else if (newTabIndex === 4) {
      url += `${TAB_QUERY}=${TABS.WITHDRAW}`;
    } else if (newTabIndex === 5) {
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
              {__('Receive')}
            </Tab>
            <Tab aria-selected={tabIndex === 2} onClick={() => onTabChange(2)}>
              {__('Send')}
            </Tab>
            <Tab aria-selected={tabIndex === 3} onClick={() => onTabChange(3)}>
              {__('Buy')}
            </Tab>
            <Tab aria-selected={tabIndex === 4} onClick={() => onTabChange(4)}>
              {__('Withdraw')}
            </Tab>
            {arweaveWallets && arweaveWallets.length > 0 ? (
              <Tab aria-selected={tabIndex === 5} onClick={() => onTabChange(5)}>
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
              <Overview cardHeader={cardHeader} arWalletStatus={arWalletStatus} />
              {!arWalletStatus && (
                <div className="wallet">
                  <WalletConnect />
                </div>
              )}
            </>
          </TabPanel>
          <TabPanel>
            <>
              <ReceiveUsdt cardHeader={cardHeader} arWalletStatus={arWalletStatus} />
              {!arWalletStatus && (
                <div className="wallet">
                  <WalletConnect />
                </div>
              )}
            </>
          </TabPanel>
          <TabPanel>
            <>
              <SendUsdc cardHeader={cardHeader} arWalletStatus={arWalletStatus} balance={balance} />
              {!arWalletStatus && (
                <div className="wallet">
                  <WalletConnect />
                </div>
              )}
            </>
          </TabPanel>
          <TabPanel>
            <>
              <OnRamper
                cardHeader={cardHeader}
                arWalletStatus={arWalletStatus}
                balance={balance}
                theme={theme}
                mode="buy"
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
              <OnRamper
                cardHeader={cardHeader}
                arWalletStatus={arWalletStatus}
                balance={balance}
                theme={theme}
                mode="sell"
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

export default PaymentAccountPage;
