// @flow
import React from 'react';
import { useHistory } from 'react-router';
import { ENABLE_ARCONNECT } from 'config';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import Card from 'component/common/card';
import Button from 'component/button';
import Symbol from 'component/common/symbol';
import './style.scss';

type Props = {
  arWalletStatus: any,
  theme: string,
  balance: number,
  experimentalUi: boolean,
};

export default function OnRamper(props: Props) {
  const { arWalletStatus, theme, balance, experimentalUi, mode } = props;
  const [targetWallet, setTargetWallet] = React.useState(undefined);
  const {
    location: { search },
    push,
  } = useHistory();

  const showArweave = ENABLE_ARCONNECT && experimentalUi;

  const apiKey = 'pk_test_01JEXX6J49SXFTGBTEXN3S5MEF';
  const network = '0xE6c07B52d897c596ECeA3a94566C4F4Fd45Ca04d';
  
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
    mode,
    
    ...(mode === 'buy' ? { defaultCrypto: 'usdc_base' } : { sell_defaultCrypto: 'usdc_base' }),
    ...(mode === 'buy' ? { onlyCryptos: 'usdc_bsc,usdc_base,usdc_ethereum' } : { sell_onlyCryptos: 'usdc_bsc,usdc_base,usdc_ethereum' }),
    ...(mode === 'buy' ? { defaultFiat: 'USD' } : { sell_defaultFiat: 'USD' }),
    ...(mode === 'buy' && { defaultAmount: '30' }),
    ...(mode === 'buy' && { networkWallets: `base:${network},bsc:${network},ethereum:${network}` }),
    ...(mode === 'buy' ? { onlyCryptoNetworks: `base:${network},bsc:${network},ethereum:${network}` } : { sell_onlyCryptoNetworks: `base:${network},bsc:${network},ethereum:${network}` }),

    // theme
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
  // const everpayUri = 'https://fast-deposit.everpay.io/depositAddress/OI6lHBmLWMuD8rvWv7jmbESefKxZB3zFge_8FdyTqVs/evm';

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



  const handleArConnectDisconnect = () => {
    doArDisconnect();
  };

  return (
    <Card
      className={!arWalletStatus ? `card--buyusdc card--disabled` : `card--buyusdc`}
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
  );
}
