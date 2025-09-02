// @flow
import React from 'react';
import { Menu, MenuList, MenuButton, MenuItem } from '@reach/menu-button';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import CopyableText from 'component/copyableText';
import Button from 'component/button';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';

import './style.scss';

function BuyAr(props: Props) {
  const { cardHeader, wallet, activeArStatus, doToast } = props;
  const fiatAmountRef = React.useRef(null);
  const paymentOptionRef = React.useRef(null);
  const [fiatAmount, setFiatAmount] = React.useState(10);
  const [fiats, setFiats] = React.useState([]);
  const [activeFiat, setActiveFiat] = React.useState(null);
  const [paymentOptions, setPaymentOptions] = React.useState(null);
  const [paymentOption, setPaymentOption] = React.useState(null);
  const apiKey = '718a6195-8d9b-4e06-b0b3-dfccc8b14876';

  React.useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('https://api-stg.transak.com/fiat/public/v1/currencies/fiat-currencies', {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
      });
      const json = await res.json();
      const active = json.response.find((fiat) => fiat.symbol === 'USD');
      const payment = active.paymentOptions.filter(
        (paymentOption) => paymentOption.isActive !== false && paymentOption.name !== ''
      );
      const allowedFiat = json.response.filter((fiat) => fiat.isAllowed !== false);

      setActiveFiat(active);
      setPaymentOptions(payment);
      setPaymentOption(payment[0].id);
      setFiats(allowedFiat);
    };

    fetchData();
  }, []);

  const onFiatAmountChange = async () => {
    const res = await fetch(
      `https://api-stg.transak.com/api/v1/pricing/public/quotes?partnerApiKey=${apiKey}&fiatCurrency=GBP&cryptoCurrency=ETH&isBuyOrSell=BUY&network=ethereum&paymentMethod=credit_debit_card&fiatAmount=100`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
      }
    );
    const json = await res.json();
    console.log('res: ', json);

    setFiatAmount(fiatAmountRef.current.value);
  };

  const handleSetActiveFiat = (fiat: any) => {
    setActiveFiat(fiat);
    const payment = fiat.paymentOptions.filter(
      (paymentOption) => paymentOption.isActive !== false && paymentOption.name !== ''
    );
    setPaymentOptions(payment);
  };

  const handleSelectPaymentOption = () => {
    setPaymentOption(paymentOptionRef.current.value);
  };

  const FiatOption = ({ fiat }: any) => {
    return (
      <div className="fiatOption">
        <div className="fiatOption-wrapper" dangerouslySetInnerHTML={{ __html: fiat.icon }} />
        <div className="fiatOption-text">
          <div className="fiatOption-symbol">{fiat.symbol}</div>
          <div className="fiatOption-name">{fiat.name}</div>
        </div>
      </div>
    );
  };

  // Credit card providers data
  const creditCardProviders = [
    {
      name: 'Onramp.money',
      url: `https://onramp.money/main/buy/?appId=390678${wallet?.address ? `&walletAddress=${wallet.address}` : ''}`,
      note: 'Select Arweave (AR) as your cryptocurrency',
    },
    {
      name: 'Ramp (Alchemy Pay)',
      url: `https://ramp.alchemypay.org/#/${wallet?.address ? `?userAddress=${wallet.address}` : ''}`,
      note: 'Select Arweave (AR) as your asset',
    },
    {
      name: 'OnRamper',
      url: `https://www.onramper.com/widget${wallet?.address ? `?walletAddress=${wallet.address}` : ''}`,
      note: 'Search for and select Arweave (AR)',
    },
    {
      name: 'ChangeNOW',
      url: 'https://changenow.io/buy/ar?amount=10',
      note: 'Pre-configured for AR purchase',
    },
  ];

  // Crypto swap services data
  const cryptoSwapServices = [
    {
      name: 'ChangeNOW',
      url: 'https://changenow.io/?from=btc&to=ar',
    },
    {
      name: 'SimpleSwap',
      url: 'https://simpleswap.io/coins/ar',
    },
    {
      name: 'SwapSpace',
      url: 'https://swapspace.co/?to=ar&toNetwork=ar&from=btc&fromNetwork=btc&amount=0.01&direction=direct',
    },
    {
      name: 'LetsExchange',
      url: 'https://letsexchange.io/exchange/btc-to-ar',
    },
  ];

  // Exchange platforms data
  const exchanges = [
    {
      name: 'Binance',
      url: 'https://www.binance.com/en/trade/AR_USDT',
      icon: ICONS.EXTERNAL,
    },
    {
      name: 'KuCoin',
      url: 'https://www.kucoin.com/trade/AR-USDT',
      icon: ICONS.EXTERNAL,
    },
    {
      name: 'MEXC',
      url: 'https://www.mexc.com/exchange/AR_USDT',
      icon: ICONS.EXTERNAL,
    },
    {
      name: 'Kraken',
      url: 'https://www.kraken.com/prices/arweave',
      icon: ICONS.EXTERNAL,
    },
    {
      name: 'Bitget',
      url: 'https://www.bitget.com/spot/ARUSDT',
      icon: ICONS.EXTERNAL,
    },
    {
      name: 'Crypto.com',
      url: 'https://crypto.com/price/arweave',
      icon: ICONS.EXTERNAL,
    },
    {
      name: 'Uphold',
      url: 'https://uphold.com/en-us/assets/crypto/buy-arweave',
      icon: ICONS.EXTERNAL,
    },
  ];

  return (
    fiats.length > 0 && (
      <>
        <Card
          className={activeArStatus !== 'connected' ? `card--buyAr card--disabled` : `card--buyAr`}
          title={cardHeader()}
          background
          actions={
            <>
              <div className="buyAr-wrapper">
                <div className="buyAr-card">
                  <h3>{__('You spend')}</h3>
                  <div className="buyAr-input">
                    <input ref={fiatAmountRef} onChange={onFiatAmountChange} placeholder={`0 ${activeFiat.symbol}`} />
                    <Menu>
                      <MenuButton className="">
                        <FiatOption fiat={activeFiat} />
                      </MenuButton>

                      <MenuList className="menu__list channel-selector">
                        {fiats &&
                          fiats.map((fiat: any) => (
                            <MenuItem key={fiat.symbol} onSelect={() => handleSetActiveFiat(fiat)}>
                              <FiatOption fiat={fiat} />
                            </MenuItem>
                          ))}
                      </MenuList>
                    </Menu>
                  </div>
                </div>
                <div className="buyAr-card">
                  <h3>{__('Pay with')}</h3>
                  <select ref={paymentOptionRef} onChange={handleSelectPaymentOption}>
                    {paymentOptions.map((option: any) => {
                      return (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <Button
                button="primary"
                label={__('Review Purchase on Transak')}
                onClick={() =>
                  window.open(
                    `https://global.transak.com/?apiKey=${apiKey}&defaultCryptoCurrency=AR&defaultFiatAmount=${fiatAmount}&defaultFiatCurrency=${activeFiat.symbol}&walletAddress=${wallet.address}&defaultPaymentMethod=${paymentOption}`,
                    '_blank',
                    'noopener,noreferrer'
                  )
                }
                disabled={!fiatAmount}
              />
              <p className="help">
                <I18nMessage
                  tokens={{
                    learnMore: (
                      <Button
                        button="link"
                        href="https://help.odysee.tv/category-monetization/exchanges"
                        label={__('Learn more')}
                      />
                    ),
                  }}
                >
                  To purchase AR on Odysee you’ll use Transak, Wander’s payment provider. Transak will prompt you to
                  complete a Know Your Customer (KYC) identity-verification step before the transaction can go through.
                  If you run into problems with KYC or payment, please contact Transak directly—Odysee can’t assist with
                  those issues. You can also buy or cash-out AR on most major cryptocurrency exchanges. %learnMore%
                </I18nMessage>
              </p>
            </>
          }
        />

        {/* Additional Purchase Options */}
        <Card
          className="card--buyAr-alternatives"
          title={
            <div className="buyAr-alternatives-header">
              <span>{__('Alternative Purchase Options')}</span>
              {wallet?.address && (
                <div className="buyAr-header-address">
                  <span className="buyAr-address-label">Your AR Address:</span>
                  <CopyableText copyable={wallet.address} />
                </div>
              )}
            </div>
          }
          background
          actions={
            <>
              <div className="buyAr-disclaimer">
                <div className="buyAr-disclaimer-icon">
                  <Icon icon={ICONS.WARNING} />
                </div>
                <p className="buyAr-disclaimer-text">
                  {__('Availability varies by country and region. Some services may require identity verification.')}
                </p>
              </div>

              {/* Credit Card Providers */}
              <div className="buyAr-section">
                <h3 className="buyAr-section-title">
                  <Icon icon={ICONS.CREDITCARD} size={20} />
                  {__('Credit & Debit Card Providers')}
                </h3>
                <div className="buyAr-providers-grid">
                  {creditCardProviders.map((provider, index) => (
                    <a
                      key={index}
                      href={provider.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="buyAr-provider-card"
                    >
                      <div className="buyAr-provider-content">
                        <h4 className="buyAr-provider-name">
                          {provider.name}
                          <Icon icon={ICONS.EXTERNAL} />  
                        </h4>
                        {provider.note && <p className="buyAr-provider-note">{__(provider.note)}</p>}
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Crypto Swap Services */}
              <div className="buyAr-section">
                <h3 className="buyAr-section-title">
                  <Icon icon={ICONS.SWAP} size={20} />
                  {__('Crypto Swap Services')}
                </h3>
                <p className="buyAr-section-subtitle">{__('Exchange your existing cryptocurrencies for AR tokens.')}</p>
                <div className="buyAr-providers-grid">
                  {cryptoSwapServices.map((service, index) => (
                    <a
                      key={index}
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="buyAr-provider-card"
                    >
                      <div className="buyAr-provider-content">
                        <h4 className="buyAr-provider-name">
                          {service.name}
                          <Icon icon={ICONS.EXTERNAL} />
                        </h4>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Cryptocurrency Exchanges */}
              <div className="buyAr-section">
                <h3 className="buyAr-section-title">
                  <Icon icon={ICONS.EXCHANGE} size={20} />
                  {__('Cryptocurrency Exchanges')}
                </h3>
                <p className="buyAr-section-subtitle">
                  {__(
                    'Trade AR on established cryptocurrency exchanges. Requires account registration. Withdraw to your AR Address after purchase.'
                  )}
                </p>
                <div className="buyAr-exchanges-grid">
                  {exchanges.map((exchange, index) => (
                    <a
                      key={index}
                      href={exchange.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="buyAr-exchange-link"
                    >
                      {exchange.name}
                      <Icon icon={ICONS.EXTERNAL} />
                    </a>
                  ))}
                </div>
              </div>

              <div className="buyAr-footer-note">
                <p>
                  {__(
                    'Odysee does not endorse any specific provider or exchange. Please do your own research and ensure you understand the risks before making any purchase.'
                  )}
                </p>
              </div>
            </>
          }
        />
      </>
    )
  );
}

export default BuyAr;
