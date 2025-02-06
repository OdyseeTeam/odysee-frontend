// @flow
import React from 'react';
import { useHistory } from 'react-router';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import I18nMessage from 'component/i18nMessage';
import Page from 'component/page';
import Card from 'component/common/card';
import Button from 'component/button';
import Symbol from 'component/common/symbol';
import WalletConnect from 'component/walletConnect';
import QRCode from 'component/common/qr-code';
import CopyableText from 'component/copyableText';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import './style.scss';

type Props = {
  arWalletStatus: any,
  balance: number,
  doArDisconnect: () => void,
};

const TAB_QUERY = 'tab';
const TABS = {
  OVERVIEW: 'overview',
  SEND: 'send',
  RECEIVE: 'receive',
  WITHDRAW: 'withdraw',
  TRANSACTION_HISTORY: 'transaction-history',
};

function PaymentAccountPage(props: Props) {
  const { arWalletStatus, balance, doArDisconnect } = props;
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
    case TABS.SEND:
      tabIndex = 1;
      break;
    case TABS.RECEIVE:
      tabIndex = 2;
      break;
    case TABS.WITHDRAW:
      tabIndex = 3;
      break;
    default:
      tabIndex = 0;
      break;
  }

  const handleArConnectDisconnect = () => {
    doArDisconnect();
  };

  function onTabChange(newTabIndex) {
    let url = `/$/${PAGES.PAYMENTACCOUNT}?`;

    if (newTabIndex === 0) {
      url += `${TAB_QUERY}=${TABS.OVERVIEW}`;
    } else if (newTabIndex === 1) {
      url += `${TAB_QUERY}=${TABS.SEND}`;
    } else if (newTabIndex === 2) {
      url += `${TAB_QUERY}=${TABS.RECEIVE}`;
    } else if (newTabIndex === 3) {
      url += `${TAB_QUERY}=${TABS.WITHDRAW}`;
    } else {
      url += `${TAB_QUERY}=${TABS.OVERVIEW}`;
    }
    push(url);
  }

  return (
    <Page className="paymentAccountPage-wrapper">
      <Tabs onChange={onTabChange} index={tabIndex}>
        <TabList className="tabs__list--collection-edit-page">
          <Tab>{__('Overview')}</Tab>
          <Tab>{__('Send')}</Tab>
          <Tab>{__('Receive')}</Tab>
          <Tab>{__('Withdraw')}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <>
              <Card
                className={!arWalletStatus ? `card--disabled` : ``}
                title={
                  <>
                    <Symbol token="usdc" amount={balance} precision={2} isTitle />
                    {arWalletStatus && (
                      <Button
                        button="primary"
                        icon={ICONS.WANDER}
                        label={__('Disconnect')}
                        onClick={handleArConnectDisconnect}
                      />
                    )}
                  </>
                }
                // subtitle={}
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
              <Card
                className={!arWalletStatus ? `card--disabled` : ``}
                title={
                  <>
                    <Symbol token="usdc" amount={balance} precision={2} isTitle />
                    {arWalletStatus && (
                      <Button
                        button="primary"
                        icon={ICONS.WANDER}
                        label={__('Disconnect')}
                        onClick={handleArConnectDisconnect}
                      />
                    )}
                  </>
                }
                background
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
              <Card
                className={!arWalletStatus ? `card--disabled` : ``}
                title={
                  <>
                    <Symbol token="usdc" amount={balance} precision={2} isTitle />
                    {arWalletStatus && (
                      <Button
                        button="primary"
                        icon={ICONS.WANDER}
                        label={__('Disconnect')}
                        onClick={handleArConnectDisconnect}
                      />
                    )}
                  </>
                }
                // subtitle={}
                background
                actions={
                  <div className="section__flex">
                    <div className="qr__wrapper">
                      <QRCode value="abc" />
                      <div className="address__wrapper">
                      <CopyableText copyable={`0x67b573D3dA11E21Af9993c5a94C7c5cD88638F33`} />
                      </div>
                    </div>
                    <div className="section-content__wrapper">
                      <h2 className="section__title--small">
                        <I18nMessage
                          tokens={{
                            usdc: <><Symbol token="usdc" />USDC</>,
                            bnb: <><Symbol token="bnb" />BNB</>,
                            base: <><Symbol token="base" />Base</>,
                            eth: <><Symbol token="eth" />ETH</>,
                          }}
                        >
                          This is your %usdc% deposit address on the %bnb%, %base%, and %eth% chains. You can use this address to deposit %usdc% into your account directly from your own wallet.
                        </I18nMessage>

                      </h2>
                      <div className="section__warning">
                        <I18nMessage
                          tokens={{
                            usdc: <><Symbol token="usdc" />USDC</>,
                            bnb: <><Symbol token="bnb" />BNB</>,
                            base: <><Symbol token="base" />Base</>,
                            eth: <><Symbol token="eth" />Ethereum</>,
                          }}
                        >
                          Be aware that at this moment, we only support %usdc% on the %bnb%, %base% and %eth% chains. Sending %usdc% on any other chain will result in a loss of funds.
                        </I18nMessage>
                      </div>
                    </div>
                    
                  </div>
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
              <Card
                className={!arWalletStatus ? `card--disabled` : ``}
                title={
                  <>
                    <Symbol token="usdc" amount={balance} precision={2} isTitle />
                    {arWalletStatus && (
                      <Button
                        button="primary"
                        icon={ICONS.WANDER}
                        label={__('Disconnect')}
                        onClick={handleArConnectDisconnect}
                      />
                    )}
                  </>
                }
                // subtitle={}
                background
              />  
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
