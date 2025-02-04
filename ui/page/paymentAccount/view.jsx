// @flow
import React from 'react';
import { useHistory } from 'react-router';
// import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import Page from 'component/page';
import Card from 'component/common/card';
import Button from 'component/button';
import Symbol from 'component/common/symbol';
import I18nMessage from 'component/i18nMessage';
import WalletConnect from 'component/walletConnect';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import './style.scss';

type Props = {
  arWalletStatus: any,
  balance: any,
  doArDisconnect: () => void,
};

const TAB_QUERY = 'tab';
const TABS = {
  OVERVIEW: 'overview',
  SEND: 'send',
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
                className={!arWalletStatus ? `card--disabled` : ``}
                title={
                  <>
                    <Symbol token="usdc" amount={balance.usdc} precision={2} isTitle />
                    {arWalletStatus && (
                      <Button
                        button="primary"
                        icon={ICONS.ARCONNECT}
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
                      <I18nMessage
                        tokens={{ usdc_amount: <Symbol token="usdc" amount={balance.usdc} precision={2} /> }}
                      >
                        %usdc_amount%
                      </I18nMessage>
                    </h2>
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
          <TabPanel>Send</TabPanel>
          <TabPanel>Withdraw</TabPanel>
          <TabPanel>History</TabPanel>
        </TabPanels>
      </Tabs>
    </Page>
  );
}

export default PaymentAccountPage;
