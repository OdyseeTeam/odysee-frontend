import React from 'react';
import Card from 'component/common/card';
import './style.scss';
import { Lbryio } from 'lbryinc';
type Props = {
  cardHeader: () => React.ReactNode;
  mode: string;
  arWalletStatus: any;
  theme: string;
  balance: number;
  arweaveAccount: any;
};
const rgbaToHex = (rgba) => {
  // $FlowIgnore
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
  // $FlowIgnore
  const [rB, gB, bB] = backgroundRgba.match(/\d+(\.\d+)?/g).map(Number);
  // $FlowIgnore
  const [rA, gA, bA, aA] = rgba.match(/\d+(\.\d+)?/g).map(Number);
  const r = Math.round(rB * (1 - aA) + rA * aA);
  const g = Math.round(gB * (1 - aA) + gA * aA);
  const b = Math.round(bB * (1 - aA) + bA * aA);
  return `${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).padStart(6, '0')}`;
};

const getRootStyle = (varName: string): string => {
  // $FlowIgnore[incompatible-call] - documentElement cannot be null in real browser runtime
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};

function buildParamString(params: any) {
  const paramString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return paramString || '';
}

// alphabetize function from onramper docs, modified for safety
function arrangeStringAlphabetically(inputString: string): string {
  const inputObject: Record<string, Record<string, string>> = {};

  if (!inputString) {
    return '';
  }

  inputString.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    const nestedPairs = value.split(',');
    inputObject[key] = {};

    nestedPairs.forEach((nestedPair) => {
      const [nestedKey, nestedValue] = nestedPair.split(':');
      inputObject[key][nestedKey] = nestedValue;
    });
  });

  for (const key in inputObject) {
    inputObject[key] = Object.fromEntries(Object.entries(inputObject[key]).toSorted());
  }

  const sortedKeys = Object.keys(inputObject).toSorted();
  const sortedObject: Record<string, Record<string, string>> = {};
  sortedKeys.forEach((key) => {
    sortedObject[key] = inputObject[key];
  });

  let resultString = '';
  for (const key in sortedObject) {
    resultString += key + '=';
    resultString += Object.entries(sortedObject[key])
      .map(([nestedKey, nestedValue]) => `${nestedKey}:${nestedValue}`)
      .join(',');
    resultString += '&';
  }

  resultString = resultString.slice(0, -1);
  return resultString;
}

export default function OnRamper(props: Props) {
  const { cardHeader, arWalletStatus, theme, mode, arweaveAccount } = props;
  const apiKey = 'pk_test_01JEXX6J49SXFTGBTEXN3S5MEF';
  const depositAddress = arweaveAccount ? arweaveAccount.deposit_address : null;

  const containerColor = `${rgbaToHexWithBackground(getRootStyle('--color-background'), getRootStyle('--color-header-button'))}`;
  const primaryColor = rgbaToHex(getRootStyle('--color-primary'));
  const primaryTextColor = getRootStyle('--color-text').slice(1);
  const secondaryColor = rgbaToHex(getRootStyle('--color-background'));
  const secondaryTextColor = getRootStyle('--color-text').slice(1);
  const cardColor = rgbaToHex(getRootStyle('--color-background'));
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const params = {
    apiKey,
    enableCountrySelector: 'true',
    partnerContext: 'Odysee',
    mode,
    ...(mode === 'buy'
      ? {
          defaultCrypto: 'usdc_base',
        }
      : {
          sell_defaultCrypto: 'usdc_base',
        }),
    ...(mode === 'buy'
      ? {
          onlyCryptos: 'usdc_bsc,usdc_base,usdc_ethereum',
        }
      : {
          sell_onlyCryptos: 'usdc_bsc,usdc_base,usdc_ethereum',
        }),
    ...(mode === 'buy'
      ? {
          defaultFiat: 'USD',
        }
      : {
          sell_defaultFiat: 'USD',
        }),
    // $FlowIgnore
    ...(mode === 'buy' && {
      defaultAmount: '30',
    }),
    // $FlowIgnore
    ...(mode === 'buy' && {
      // $FlowIgnore
      networkWallets: `bsc:${depositAddress},base:${depositAddress},ethereum:${depositAddress}`,
    }),
    ...(mode === 'buy'
      ? {
          onlyCryptoNetworks: `base,bsc,ethereum`,
        }
      : {
          sell_onlyCryptoNetworks: `base,bsc,ethereum`,
        }),
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

  const getSignContentSubsetFromParams = (params: any): string => {
    const subsetParams = {};
    const subsetKeys = Object.keys(params).filter(
      (key) => key === 'networkWallets' || key === 'wallets' || key === 'walletAddressTags'
    );
    subsetKeys.forEach((key) => {
      subsetParams[key] = params[key];
    });
    return buildParamString(subsetParams);
  };

  let signContent = '';

  if (mode === 'buy') {
    signContent = arrangeStringAlphabetically(getSignContentSubsetFromParams(params));
  }

  const [isSigning, setIsSigning] = React.useState(false);
  const [onRamperSignature, setOnRamperSignature] = React.useState(null);
  const [onRamperError, setOnRamperError] = React.useState('');
  React.useEffect(() => {
    async function fetchSignature(sc) {
      setOnRamperError('');
      setIsSigning(true);

      try {
        const response = await Lbryio.call(
          'or',
          'sign',
          {
            url: `${signContent}`,
          },
          'post'
        );
        setOnRamperSignature(response.signature);
      } catch (error) {
        setOnRamperError(`Failed to sign OnRamper url: ${error.message}`);
      } finally {
        setIsSigning(false);
      }
    }

    if (signContent && mode === 'buy' && depositAddress) {
      fetchSignature(signContent);
    }
  }, [signContent, mode, depositAddress]);
  const iframeUri = `https://buy.onramper.dev?${new URLSearchParams(params).toString()}${onRamperSignature ? `&signature=${onRamperSignature}` : ''}`;
  // const everpayUri = 'https://fast-deposit.everpay.io/depositAddress/OI6lHBmLWMuD8rvWv7jmbESefKxZB3zFge_8FdyTqVs/evm';
  React.useEffect(() => {
    if (theme) {
      setTimeout(() => {
        const iframe = iframeRef.current;

        if (iframe) {
          iframe.contentWindow.postMessage(
            {
              type: 'change-theme',
              id: 'change-theme',
              theme: {
                containerColor: `#${rgbaToHexWithBackground(getRootStyle('--color-background'), getRootStyle('--color-header-button'))}`,
                primaryColor: `#${rgbaToHex(getRootStyle('--color-primary'))}`,
                primaryTextColor: getRootStyle('--color-text'),
                secondaryColor: `#${rgbaToHex(getRootStyle('--color-background'))}`,
                secondaryTextColor: getRootStyle('--color-text'),
                cardColor: `#${rgbaToHex(getRootStyle('--color-background'))}`,
                primaryBtnTextColor: '#ffffff',
                borderRadius: '0rem',
                widgetBorderRadius: '0rem',
              },
            },
            '*'
          );
        }
      }, 1000);
    }
  }, [theme]);
  return (
    <Card
      className={!arWalletStatus ? `card--buyusdc card--disabled` : `card--buyusdc`}
      title={cardHeader()}
      background
      actions={
        onRamperError ? (
          <div className="error">{onRamperError}</div>
        ) : isSigning || (mode === 'buy' && !onRamperSignature) ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className={`iframe-wrapper${!arWalletStatus ? ' iframe--disabled' : ''}`}>
            <iframe
              ref={iframeRef}
              src={iframeUri}
              title="Onramper Widget"
              allow="accelerometer; autoplay; camera; gyroscope; payment; microphone"
            />
          </div>
        )
      }
    />
  );
}
