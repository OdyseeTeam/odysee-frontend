// @flow
import React from 'react';
import { useHistory } from 'react-router';
import { ENABLE_ARCONNECT } from 'config';
import Card from 'component/common/card';
import './style.scss';
import { Lbryio } from 'lbryinc';

type Props = {
  arWalletStatus: any,
  theme: string,
  balance: number,
  experimentalUi: boolean,
};

export default function OnRamper(props: Props) {
  const { cardHeader, arWalletStatus, theme, experimentalUi, mode } = props;

  // const [targetWallet, setTargetWallet] = React.useState(undefined);
  const {
    location: { search },
    push,
  } = useHistory();

  const showArweave = ENABLE_ARCONNECT && experimentalUi;

  const apiKey = 'pk_test_01JEXX6J49SXFTGBTEXN3S5MEF';
  const network = '0xE6c07B52d897c596ECeA3a94566C4F4Fd45Ca04d';

  const rgbaToHex = (rgba) => {
    const [r, g, b, a = 1] = rgba.match(/\d+(\.\d+)?/g).map(Number);
    return `${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}${
      a < 1
        ? Math.round(a * 255)
            .toString(16)
            .padStart(2, '0')
        : ''
    }`;
  };

  const rgbaToHexWithBackground = (backgroundRgba, rgba) => {
    const [rB, gB, bB, aB] = backgroundRgba.match(/\d+(\.\d+)?/g).map(Number);
    const [rA, gA, bA, aA] = rgba.match(/\d+(\.\d+)?/g).map(Number);

    const r = Math.round(rB * (1 - aA) + rA * aA);
    const g = Math.round(gB * (1 - aA) + gA * aA);
    const b = Math.round(bB * (1 - aA) + bA * aA);

    return `${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).padStart(6, '0')}`;
  };

  const containerColor = `${rgbaToHexWithBackground(
    getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim(),
    getComputedStyle(document.documentElement).getPropertyValue('--color-header-button').trim()
  )}`;
  const primaryColor = rgbaToHex(getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim());
  const primaryTextColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim().slice(1);
  const secondaryColor = rgbaToHex(
    getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim()
  );
  const secondaryTextColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-text')
    .trim()
    .slice(1);
  const cardColor = rgbaToHex(getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim());
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const params = {
    apiKey,
    enableCountrySelector: 'true',
    partnerContext: 'Odysee',
    mode,

    ...(mode === 'buy' ? { defaultCrypto: 'usdc_base' } : { sell_defaultCrypto: 'usdc_base' }),
    ...(mode === 'buy'
      ? { onlyCryptos: 'usdc_bsc,usdc_base,usdc_ethereum' }
      : { sell_onlyCryptos: 'usdc_bsc,usdc_base' }),
    ...(mode === 'buy' ? { defaultFiat: 'USD' } : { sell_defaultFiat: 'USD' }),
    ...(mode === 'buy' && { defaultAmount: '30' }),
    ...(mode === 'buy' && { networkWallets: `base:${network},bsc:${network}` }),
    ...(mode === 'buy'
      ? { onlyCryptoNetworks: `base:${network},bsc:${network},ethereum:${network}` }
      : { sell_onlyCryptoNetworks: `base:${network},bsc:${network}` }),

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
    wgBorderRadius: '0',
  };
  console.log('params', params);

  const getSignContentSubsetFromParams: (params: any) => string = (params) => {
    const subsetParams = {};
    console.log('paramsBefore', params);
    const subsetKeys = Object.keys(params).filter(
      (key) => key === 'networkWallets' || key === 'wallets' || key === 'walletAddressTags'
    );
    console.log('paramsAfter', params);
    subsetKeys.forEach((key) => {
      subsetParams[key] = params[key];
    });
    console.log('newParams', subsetParams);
    const subsetString = buildParamString(subsetParams);
    console.log('substring', subsetString);

    return subsetString;
  };

  const buildParamString = (params) => {
    const paramString = Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    return paramString;
  };

  // const signContent = 'wallets=btc:1Lbcfr7sAHTD9CgdQo3HTMTkV8LK4ZnX71,eth:1Lbcfr7sAUTEFCgdQo3HTMTkV8LK4ZnX71
  // &networkWallets=ethereum:1BvBMSEYstWetqTFn5wrwrhGFryetusJaNVN2,bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2
  // &walletAddressTags=btc:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2,eth:1BvBMSEYstWetqTFn5wrwrhGFryetusJaNVN2'
  //
  // function arrangeStringAlphabetically(inputString: string): string {
  //   // Parse the input string into an object
  //   const inputObject: { [key: string]: { [key: string]: string } } = {};
  //   inputString.split('&').forEach((pair) => {
  //     // Split each pair into key and value
  //     const [key, value] = pair.split('=');
  //     // Split the value into nested key-value pairs
  //     const nestedPairs = value.split(',');
  //     inputObject[key] = {}; // Initialize the nested object for the key
  //     nestedPairs.forEach((nestedPair) => {
  //       // Split each nested pair into nested key and value
  //       const [nestedKey, nestedValue] = nestedPair.split(':');
  //       // Assign the nested key-value pair to the nested object
  //       inputObject[key][nestedKey] = nestedValue;
  //     });
  //   });
  //
  //   // Sort the keys of each nested object alphabetically
  //   for (const key in inputObject) {
  //     inputObject[key] = Object.fromEntries(Object.entries(inputObject[key]).sort());
  //   }
  //
  //   // Sort the keys of the top-level object alphabetically
  //   const sortedKeys = Object.keys(inputObject).sort();
  //   const sortedObject: { [key: string]: { [key: string]: string } } = {};
  //   sortedKeys.forEach((key) => {
  //     sortedObject[key] = inputObject[key];
  //   });
  //
  //   // Reconstruct the string from the sorted object
  //   let resultString = '';
  //   for (const key in sortedObject) {
  //     resultString += key + '='; // Append the key
  //     // Append nested key-value pairs, sorted alphabetically
  //     resultString += Object.entries(sortedObject[key]).map(([nestedKey, nestedValue]) => `${nestedKey}:${nestedValue}`).join(',');
  //     resultString += '&'; // Separate key-value pairs with '&'
  //   }
  //   resultString = resultString.slice(0, -1); // Remove the trailing '&'
  //
  //   return resultString;
  // }

  const signContent = getSignContentSubsetFromParams(params);
  console.log('signContent', signContent);

  const [isSigning, setIsSigning] = React.useState(false);
  const [onRamperSignature, setOnRamperSignature] = React.useState(null);

  React.useEffect(() => {
    async function fetchSignature(sc) {
      setIsSigning(true);
      try {
        const response = await Lbryio.call('or', 'sign', { url: signContent }, 'post');
        console.log('response', response);
        setOnRamperSignature(response);
      } catch (error) {
        console.error('Error fetching signature:', error);
      } finally {
        setIsSigning(false);
      }
    }

    if (signContent && mode === 'buy') {
      fetchSignature(signContent);
    }
  }, [signContent, mode]);

  const iframeUri = `https://buy.onramper.dev?${new URLSearchParams(params).toString()}`;

  const iframeUriWithSig = `${iframeUri}&signature=${onRamperSignature}`;
  // const everpayUri = 'https://fast-deposit.everpay.io/depositAddress/OI6lHBmLWMuD8rvWv7jmbESefKxZB3zFge_8FdyTqVs/evm';

  React.useEffect(() => {
    if (theme) {
      setTimeout(() => {
        const iframe = iframeRef.current;
        iframe.contentWindow.postMessage(
          {
            type: 'change-theme',
            id: 'change-theme',
            theme: {
              containerColor: `#${rgbaToHexWithBackground(
                getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim(),
                getComputedStyle(document.documentElement).getPropertyValue('--color-header-button').trim()
              )}`,
              primaryColor: `#${rgbaToHex(
                getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
              )}`,
              primaryTextColor: getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim(),
              secondaryColor: `#${rgbaToHex(
                getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim()
              )}`,
              secondaryTextColor: getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim(),
              cardColor: `#${rgbaToHex(
                getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim()
              )}`,
              primaryBtnTextColor: '#ffffff',
              borderRadius: '0rem',
              widgetBorderRadius: '0rem',
            },
          },
          '*'
        );
      }, 1000);
    }
  }, [theme]);

  return (
    <Card
      className={!arWalletStatus ? `card--buyusdc card--disabled` : `card--buyusdc`}
      title={cardHeader()}
      background
      actions={
        isSigning || (mode === 'buy' && !onRamperSignature) ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className={`iframe-wrapper${!arWalletStatus ? ' iframe--disabled' : ''}`}>
            <iframe
              ref={iframeRef}
              src={iframeUriWithSig || iframeUri}
              title="Onramper Widget"
              allow="accelerometer; autoplay; camera; gyroscope; payment; microphone"
            />
          </div>
        )
      }
    />
  );
}
