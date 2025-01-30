// @flow
import React from 'react';
import { useHistory } from 'react-router';
// import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Page from 'component/page';
import Card from 'component/common/card';
import Button from 'component/button';
import Symbol from 'component/common/symbol';
import I18nMessage from 'component/i18nMessage';
import WalletConnect from 'component/walletConnect';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import './style.scss';

type Props = {
  arConnectStatus: any,
  doCheckArConnectStatus: () => void,
  doDisconnectArConnect: () => void,
};

const TAB_QUERY = 'tab';
const TABS = {
  OVERVIEW: 'overview',
  SEND: 'send',
  WITHDRAW: 'withdraw',
  TRANSACTION_HISTORY: 'transaction-history',
};

function PaymentAccountPage(props: Props) {
  const { arConnectStatus, doCheckArConnectStatus, doDisconnectArConnect } = props;
  const {
    location: { search },
    push,
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  const currentView = urlParams.get(TAB_QUERY) || TABS.LBRY_CREDITS_TAB;

  let tabIndex;
  switch (currentView) {
    case TABS.OVERVIEW:
      tabIndex = 0;
      break;
    case TABS.SEND:
      tabIndex = 1;
      break;
    case TABS.WITHDRAW:
      tabIndex = 2;
      break;
    case TABS.TRANSACTION_HISTORY:
      tabIndex = 3;
      break;
    default:
      tabIndex = 0;
      break;
  }

  React.useEffect(() => {
    doCheckArConnectStatus();
  }, []);

  const handleArConnectDisconnect = () => {
    doDisconnectArConnect();
  };

  function onTabChange(newTabIndex) {
    let url = `/$/${PAGES.PAYMENTACCOUNT}?`;

    if (newTabIndex === 0) {
      url += `${TAB_QUERY}=${TABS.OVERVIEW}`;
    } else if (newTabIndex === 1) {
      url += `${TAB_QUERY}=${TABS.SEND}`;
    } else if (newTabIndex === 2) {
      url += `${TAB_QUERY}=${TABS.WITHDRAW}`;
    } else if (newTabIndex === 3) {
      url += `${TAB_QUERY}=${TABS.TRANSACTION_HISTORY}`;
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
          <Tab>{__('Withdraw')}</Tab>
          <Tab>{__('Transaction history')}</Tab>
        </TabList>
        <TabPanels>
          {/* balances for lbc and fiat */}
          <TabPanel>
            <>
              <Card
                className={
                  arConnectStatus.status === 'loading' || arConnectStatus.status === 'disconnected'
                    ? `card--disabled`
                    : ``
                }
                title={
                  <>
                    <Symbol token="usdc" amount={'12'} precision="2" isTitle />
                    <select>
                      <option value="">Wallet A</option>
                    </select>
                    <Button button="primary" label={__('Disconnect')} onClick={handleArConnectDisconnect} />
                  </>
                }
                // subtitle={}
                background
                actions={
                  <>
                    <h2 className="section__title--small">
                      <I18nMessage
                        tokens={{ usdc_amount: <Symbol token="usdc" chain="bnb" amount="10" precision="2" /> }}
                      >
                        %usdc_amount% on BNB Chain
                      </I18nMessage>
                    </h2>
                    <h2 className="section__title--small">
                      <I18nMessage
                        tokens={{ usdc_amount: <Symbol token="usdc" chain="base" amount={2} precision="2" /> }}
                      >
                        %usdc_amount% on Base Chain
                      </I18nMessage>
                    </h2>
                    {/*
                  <div className="section__actions">
                    <Button button="secondary" label={__('Deposit Funds')} icon={ICONS.BUY} navigate={`/$/${PAGES.BUY}`} />
                    <Button
                      button="secondary"
                      label={__('Payment Account')}
                      icon={ICONS.SETTINGS}
                      navigate={`/$/${PAGES.PAYMENTACCOUNT}`}
                    />
                  </div>
                  */}
                  </>
                }
              />
              {arConnectStatus.status === 'disconnected' && (
                <div className="wallet">
                  <WalletConnect />
                </div>
              )}
            </>
          </TabPanel>
          <TabPanel>Send</TabPanel>
          <TabPanel>Withdraw</TabPanel>
          <TabPanel>History</TabPanel>
        </TabPanels>
      </Tabs>
    </Page>
  );
}

export default PaymentAccountPage;
