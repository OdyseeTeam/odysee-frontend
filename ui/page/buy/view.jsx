// @flow
import React from 'react';
import { useHistory } from 'react-router';
import { ENABLE_ARCONNECT } from 'config';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import Page from 'component/page';
import Card from 'component/common/card';
import Button from 'component/button';
import Symbol from 'component/common/symbol';
import WalletConnect from 'component/walletConnect';
import ReceiveUsdc from '../paymentAccount/receiveUsdc/view';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import './style.scss';

type Props = {
  arWalletStatus: any,
  theme: string,
  balance: number,
  experimentalUi: boolean,
};

export default function BuyPage(props: Props) {
  const { arweaveActiveWallet, arWalletStatus, theme, balance, experimentalUi } = props;
  const [targetWallet, setTargetWallet] = React.useState(undefined);
  const {
    location: { search },
    push,
  } = useHistory();

  const showArweave = ENABLE_ARCONNECT && experimentalUi;

  const apiKey = 'pk_test_01JEXX6J49SXFTGBTEXN3S5MEF';
  const network = arweaveActiveWallet?.deposit_address;
  
  const rgbaToHex = (rgba) => {
    const [r, g, b, a = 1] = rgba.match(/\d+(\.\d+)?/g).map(Number);
    return `${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}${a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : ''}`;
  };

  const rgbaToHexWithBackground = (backgroundRgba, rgba) => {
    const [rB, gB, bB, aB] = backgroundRgba.match(/\d+(\.\d+)?/g).map(Number);
    const [rA, gA, bA, aA] = rgba.match(/\d+(\.\d+)?/g).map(Number);
  
    const r = Math.round(rB * (1 - aA) + rA * aA);
    const g = Math.round(gB * (1 - aA) + gA * aA);
    const b = Math.round(bB * (1 - aA) + bA * aA);
  
    return `${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).padStart(6, '0')}`;
  };

  const containerColor = `${rgbaToHexWithBackground(getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim(), getComputedStyle(document.documentElement).getPropertyValue('--color-header-button').trim())}`;
  const primaryColor = rgbaToHex(getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim());
  const primaryTextColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim().slice(1);
  const secondaryColor = rgbaToHex(getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim());
  const secondaryTextColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim().slice(1);
  const cardColor = rgbaToHex(getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim());
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const params = {
    apiKey,
    enableCountrySelector: 'true',
    partnerContext: 'Odysee',
    mode: 'buy',
    defaultCrypto: 'usdc_base',
    onlyCryptos: 'usdc_bsc,usdc_base',
    defaultFiat: 'usd',
    defaultAmount: '30',
    networkWallets: `base:${network},bsc:${network}`,
    onlyCryptoNetworks: 'base,bsc',
    themeName: 'dark',
    containerColor,
    primaryColor,
    primaryTextColor,
    secondaryColor,
    secondaryTextColor,
    cardColor,
    primaryBtnTextColor: 'ffffff',
    borderRadius: '0',
    wgBorderRadius: '0'
  };

  const iframeUri = `https://buy.onramper.dev?${new URLSearchParams(params).toString()}`;
  const everpayUri = 'https://fast-deposit.everpay.io/depositAddress/OI6lHBmLWMuD8rvWv7jmbESefKxZB3zFge_8FdyTqVs/evm';
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

  const TAB_QUERY = 'tab';
  const TABS = {
    BUY: 'buy',
    RECEIVE: 'receive',
  };

  const urlParams = new URLSearchParams(search);
  const currentView = urlParams.get(TAB_QUERY) || TABS.BUY;

  React.useEffect(() => {
    if(theme){
      setTimeout(() => {
        const iframe = iframeRef.current;
        iframe.contentWindow.postMessage({
          type: "change-theme",
          id: "change-theme",
          theme: {
            containerColor: `#${rgbaToHexWithBackground(getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim(), getComputedStyle(document.documentElement).getPropertyValue('--color-header-button').trim())}`,
            primaryColor: `#${rgbaToHex(getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim())}`,
            primaryTextColor: getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim(),
            secondaryColor: `#${rgbaToHex(getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim())}`,
            secondaryTextColor: getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim(),            
            cardColor: `#${rgbaToHex(getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim())}`,
            primaryBtnTextColor: '#ffffff',
            borderRadius: '0rem',
            widgetBorderRadius: '0rem',
          },
        }, "*");
      }, 1000);      
    }    
  },[theme])

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

  const handleArConnectDisconnect = () => {
    doArDisconnect();
  };

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
              <>
              <Card
                className={!arWalletStatus ? `card--iframe card--disabled` : `card--iframe`}
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
                actions={
                  <div className={`iframe-wrapper${!arWalletStatus ? ' iframe--disabled' : ''}`}>
                    <iframe
                      ref={iframeRef}
                      src={iframeUri}
                      title="Onramper Widget"
                      // height="630px"
                      // width="420px"
                      allow="accelerometer; autoplay; camera; gyroscope; payment; microphone"
                    />                    
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
            <ReceiveUsdc arWalletStatus={arWalletStatus} balance={balance} handleArConnectDisconnect={handleArConnectDisconnect} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Page>
    );
  }
}
