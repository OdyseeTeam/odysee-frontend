// @flow
import React from 'react';
import { useHistory } from 'react-router';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Page from 'component/page';
import Card from 'component/common/card';
import Button from 'component/button';
import Symbol from 'component/common/symbol';
import WalletConnect from 'component/walletConnect';
import SendUsdc from './sendUsdc';
import ReceiveUsdt from './receiveUsdc';
import OnRamper from './onRamper';

import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import './style.scss';

type Props = {
  arWalletStatus: any,
  balance: number,
  fetching: boolean,
  theme: string,
  doArDisconnect: () => void,
  doArUpdateBalance: () => void,
};

const TAB_QUERY = 'tab';
const TABS = {
  OVERVIEW: 'overview',
  RECEIVE: 'receive',
  SEND: 'send',
  BUY: 'buy',
  WITHDRAW: 'withdraw',
  TRANSACTION_HISTORY: 'transaction-history',
};

function PaymentAccountPage(props: Props) {
  const { arWalletStatus, balance, fetching, theme, doArDisconnect, doArUpdateBalance } = props;
  const {
    location: { search },
    push,
  } = useHistory();

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
    default:
      tabIndex = 0;
      break;
  }

  const handleArConnectDisconnect = () => {
    doArDisconnect();
  };

  const handleUpdateBalance = () => {
    doArUpdateBalance();
  }

  function cardHeader() {
    return (
      <>
        <Symbol token="usdc" amount={balance} precision={2} isTitle />
        <div onClick={handleUpdateBalance} className={!fetching ? `refresh-balance` : `refresh-balance refresh-balance--loading`}>
          <Icon icon={ICONS.REFRESH} />
        </div>
        {arWalletStatus && (
          <Button
            button="alt"
            icon={ICONS.WANDER}
            label={__('Disconnect')}
            onClick={handleArConnectDisconnect}
          />
        )}
      </>
    )
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
    } else {
      url += `${TAB_QUERY}=${TABS.OVERVIEW}`;
    }
    push(url);
  }

  return (
    <Page className="paymentAccountPage-wrapper main--full-width">
      <header className="page-header">
      </header>
      <Tabs onChange={onTabChange} index={tabIndex}>
        <div className="tab__wrapper">
        <TabList className="tabs__list--collection-edit-page">
          <Tab aria-selected={tabIndex === 0} onClick={() => onTabChange(0)}>{__('Overview')}</Tab>
          <Tab aria-selected={tabIndex === 1} onClick={() => onTabChange(1)}>{__('Receive')}</Tab>
          <Tab aria-selected={tabIndex === 2} onClick={() => onTabChange(2)}>{__('Send')}</Tab>
          <Tab aria-selected={tabIndex === 3} onClick={() => onTabChange(3)}>{__('Buy')}</Tab>
          <Tab aria-selected={tabIndex === 4} onClick={() => onTabChange(4)}>{__('Withdraw')}</Tab>
        </TabList>
        </div>
        <TabPanels>
        <TabPanel>
            <>
              <Card
                className={!arWalletStatus ? `card--disabled` : ``}
                title={cardHeader()}
                background
                actions={
                  <>
                  <h2 className="section__title--small">
                    {__('Transaction history')}
                  </h2>
                  <div className="transaction-history">
                    <div className="transaction-history__row">
                      <div className="transaction-history__date">xx.xx.xxx</div>
                      <div className="transaction-history__action">{__('Purchase')}</div>
                      <div className="transaction-history__amount">0.00</div>
                      <div className="transaction-history__token"><Symbol token="usdc" />USDC</div>
                      <div className="transaction-history__direction">{__('via')}</div>
                      <div className="transaction-history__target">OnRamp</div>
                    </div>
                    <div className="transaction-history__row">
                      <div className="transaction-history__date">xx.xx.xxx</div>
                      <div className="transaction-history__action">{__('Withdraw')}</div>
                      <div className="transaction-history__amount">0.00</div>
                      <div className="transaction-history__token"><Symbol token="usdc" />USDC</div>
                      <div className="transaction-history__direction">{__('to')}</div>
                      <div className="transaction-history__target">0x00000000000000000000</div>
                    </div>
                    <div className="transaction-history__row">
                      <div className="transaction-history__date">xx.xx.xxx</div>
                      <div className="transaction-history__action">{__('Receive')}</div>
                      <div className="transaction-history__amount">0.00</div>
                      <div className="transaction-history__token"><Symbol token="usdc" />USDC</div>
                      <div className="transaction-history__direction">{__('from')}</div>
                      <div className="transaction-history__target">0x00000000000000000000</div>
                    </div>
                    <div className="transaction-history__row">
                      <div className="transaction-history__date">xx.xx.xxx</div>
                      <div className="transaction-history__action">{__('Send Tip')}</div>
                      <div className="transaction-history__amount">0.00</div>
                      <div className="transaction-history__token"><Symbol token="usdc" />USDC</div>
                      <div className="transaction-history__direction">{__('to')}</div>
                      <div className="transaction-history__target">Username</div>
                    </div>
                    <div className="transaction-history__row">
                      <div className="transaction-history__date">xx.xx.xxx</div>
                      <div className="transaction-history__action">{__('Receive Tip')}</div>
                      <div className="transaction-history__amount">0.00</div>
                      <div className="transaction-history__token"><Symbol token="usdc" />USDC</div>
                      <div className="transaction-history__direction">{__('from')}</div>
                      <div className="transaction-history__target">Username</div>
                    </div>
                  </div>
                  </>
                }
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
              <OnRamper cardHeader={cardHeader} arWalletStatus={arWalletStatus} balance={balance} theme={theme} mode="buy" />
              {!arWalletStatus && (
                <div className="wallet">
                  <WalletConnect />
                </div>
              )}
            </>
          </TabPanel>
          <TabPanel>
            <>
              <OnRamper cardHeader={cardHeader} arWalletStatus={arWalletStatus} balance={balance} theme={theme} mode="sell" />
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
