// @flow
import React from 'react';
import QRCode from 'component/common/qr-code';
import CopyableText from 'component/copyableText';
import I18nMessage from 'component/i18nMessage';
import Card from 'component/common/card';
import Symbol from 'component/common/symbol';
import './style.scss';

function ReceiveUsdc(props: Props) {
  const { cardHeader, arWalletStatus } = props;

  return (
    <Card
      className={!arWalletStatus ? `card--receiveusdc card--disabled` : `card--receiveusdc`}
      title={cardHeader()}
      background
      actions={
        <div className="section__flex">
          <div className="qr__wrapper">
            <QRCode value="0x67b573D3dA11E21Af9993c5a94C7c5cD88638F33" />
            <div className="address__wrapper">
            <CopyableText copyable={`0x67b573D3dA11E21Af9993c5a94C7c5cD88638F33`} />
            </div>
          </div>
          <div className="section-content__wrapper">
            <h2 className="section__title--small">
              <I18nMessage
                tokens={{
                  usdc: <><Symbol token="usdc" />USDC</>,
                  bnb: <><Symbol token="bnb" />BNB</>,
                  base: <><Symbol token="base" />Base</>,
                  eth: <><Symbol token="eth" />ETH</>,
                }}
              >
                This is your %usdc% deposit address on the %bnb%, %base%, and %eth% chains. You can use this address to deposit %usdc% into your account directly from your own wallet.
              </I18nMessage>

            </h2>
            <div className="section__warning">
              <I18nMessage
                tokens={{
                  usdc: <><Symbol token="usdc" />USDC</>,
                  bnb: <><Symbol token="bnb" />BNB</>,
                  base: <><Symbol token="base" />Base</>,
                  eth: <><Symbol token="eth" />Ethereum</>,
                }}
              >
                Be aware that at this moment, we only support %usdc% on the %bnb%, %base% and %eth% chains. Sending %usdc% on any other chain will result in a loss of funds.
              </I18nMessage>
            </div>
          </div>
        </div>
      }
    />
  )
}

export default ReceiveUsdc;

