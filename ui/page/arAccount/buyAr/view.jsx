// @flow
import React from 'react';
import { Menu, MenuList, MenuButton, MenuItem } from '@reach/menu-button';
import Button from 'component/button';
import Card from 'component/common/card';

import './style.scss';

function BuyAr(props: Props) {
  const { cardHeader, arWalletStatus, wallet } = props;
  const fiatAmountRef = React.useRef(null);
  const paymentOptionRef = React.useRef(null);
  const [fiatAmount, setFiatAmount] = React.useState(0);
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

  //console.log('fiats: ', fiats)

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
    fiats.length && (
      <Card
        className={!arWalletStatus ? `card--buyAr card--disabled` : `card--buyAr`}
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
              {/* <div className="buyAr-card">
              <h3>{__('You get')}</h3>
              <div className="buyAr-input buyAr-input--fixed">
                <input
                  placeholder={`0 AR`}
                />
              </div>              
            </div> */}
              <div className="buyAr-card">
                <h3>{__('Pay with')}</h3>
                <select ref={paymentOptionRef} onChange={handleSelectPaymentOption}>
                  {paymentOptions.map((option: any) => {
                    return <option value={option.id}>{option.name}</option>;
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

            {/*
          <p>The easiest way to buy AR is by using your Wander browser extension or die Wander mobile app.</p>          
          <div className="buyAr-instructions">
            <img src="https://thumbs.odycdn.com/f094a003f417470c2a5ded257fa0eca9.webp" />
            <img src="https://thumbs.odycdn.com/fbff76ee4df58a6fcde7a23d0761e66d.webp" />
            <img src="https://thumbs.odycdn.com/e916597b969323c07621baa4ead51f30.webp" />
          </div>
          */}
          </>
        }
      />
    )
  );
}

export default BuyAr;
