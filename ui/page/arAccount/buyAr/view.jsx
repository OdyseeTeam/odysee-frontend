// @flow
import React from 'react';
import { Menu, MenuList, MenuButton, MenuItem } from '@reach/menu-button';
import Button from 'component/button';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';

import './style.scss';

function BuyAr(props: Props) {
  const { cardHeader, wallet, activeArStatus } = props;
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

  return (
    fiats.length > 0 && (
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
              label={__('Review')}
              onClick={() =>
                window.open(
                  `https://global.transak.com/?apiKey=${apiKey}&defaultCryptoCurrency=AR&defaultFiatAmount=${fiatAmount}&defaultFiatCurrency=${activeFiat.symbol}&walletAddress=${wallet.address}&defaultPaymentMethod=${paymentOption}`,
                  '_blank'
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
                Odysee uses Wander's payment provider, Transak, to faciliate this purchase. You will need to go through
                a Know Your Customer (KYC) process in order to purchase AR. Odysee cannot help with any KYC or payment
                related issues, please reach out to Transak directly. You may also acquire and cash out AR on
                Cryptocurrency exchanges. %learnMore%
              </I18nMessage>
            </p>
          </>
        }
      />
    )
  );
}

export default BuyAr;
