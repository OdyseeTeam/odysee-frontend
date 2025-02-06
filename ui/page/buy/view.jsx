// @flow
import React from 'react';
import { useHistory } from 'react-router';
import * as PAGES from 'constants/pages';
import Page from 'component/page';
// import Card from 'component/common/card';
import WalletConnect from '../../component/walletConnect';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';

import Symbol from 'component/common/symbol';

import { ENABLE_ARCONNECT } from 'config';
import './style.scss';

type Props = {
  arWalletStatus: any,
  theme: string,
  experimentalUi: boolean,
};

export default function BuyPage(props: Props) {
  const { arWalletStatus, theme, experimentalUi } = props;
  const [targetWallet, setTargetWallet] = React.useState(undefined);
  const {
    location: { search },
    push,
  } = useHistory();

  const showArweave = ENABLE_ARCONNECT && experimentalUi;

  const apiKey = 'pk_test_01JEXX6J49SXFTGBTEXN3S5MEF';
  const network = '0x67b573D3dA11E21Af9993c5a94C7c5cD88638F33';
  const iframeUri = `https://buy.onramper.dev?apiKey=${apiKey}&enableCountrySelector=true&partnerContext=Odysee&mode=buy&defaultCrypto=usdc_base&onlyCryptos=usdc_bsc,usdc_base&defaultFiat=usd&defaultAmount=30&networkWallets=base:${network},bsc:${network}&onlyCryptoNetworks=base,bsc&themeName=${theme}`;

  const everpayUri = 'https://fast-deposit.everpay.io/depositAddress/OI6lHBmLWMuD8rvWv7jmbESefKxZB3zFge_8FdyTqVs/evm';
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

  const TAB_QUERY = 'tab';
  const TABS = {
    BUY: 'buy',
    RECEIVE: 'receive',
  };

  const urlParams = new URLSearchParams(search);
  const currentView = urlParams.get(TAB_QUERY) || TABS.BUY;


  let tabIndex;
  switch (currentView) {
    case TABS.BUY:
      tabIndex = 0;
      break;
    case TABS.RECEIVE:
      tabIndex = 1;
      break;
    default:
      tabIndex = 0;
      break;
  }

  function onTabChange(newTabIndex) {
    let url = `/$/${PAGES.BUY}?`;

    if (newTabIndex === 0) {
      url += `${TAB_QUERY}=${TABS.BUY}`;
    } else if (newTabIndex === 1) {
      url += `${TAB_QUERY}=${TABS.RECEIVE}`;
    } else {
      url += `${TAB_QUERY}=${TABS.BUY}`;
    }
    push(url);
  }

  React.useEffect(() => {
    fetch(proxyUrl + everpayUri)
      // .then(response => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  if (showArweave) {
    return (
      <Page
        // noSideNavigation
        className="depositPage-wrapper"
        // backout={{ backoutLabel: __('Done'), title: <Symbol token="usdc" size={28} /> }}
      >
        <Tabs onChange={onTabChange} index={tabIndex}>
          <TabList className="tabs__list--collection-edit-page">
            <Tab>{__('Buy')}</Tab>
            <Tab>{__('Receive')}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <div className={`iframe-wrapper${!arWalletStatus ? ' iframe--disabled' : ''}`}>
                <iframe
                  src={iframeUri}
                  title="Onramper Widget"
                  // height="630px"
                  // width="420px"
                  allow="accelerometer; autoplay; camera; gyroscope; payment; microphone"
                />

                {!arWalletStatus && (
                  <div className="walletConnect-wrapper">
                    <WalletConnect />
                  </div>
                )}
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Page>
    );
  }
}
