// @flow
import React from 'react';
import QRCode from 'component/common/qr-code';
import CopyableText from 'component/copyableText';
import I18nMessage from 'component/i18nMessage';
import Card from 'component/common/card';
import Symbol from 'component/common/symbol';
import './style.scss';

function ReceiveAr(props: Props) {
  const { cardHeader, wallet, arWalletStatus } = props;

  return (
    <Card
      className={!arWalletStatus ? `card--receiveAr card--disabled` : `card--receiveAr`}
      title={cardHeader()}
      background
      actions={
        <div className="section__flex">
          <div className="qr__wrapper">
            <QRCode value={wallet?.address} />
            <div className="address__wrapper">
              <CopyableText copyable={wallet?.address} />
            </div>
          </div>
          <div className="section-content__wrapper">
            <h2 className="section__title--small">
              <I18nMessage
                tokens={{
                  ar: (
                    <>
                      <Symbol token="ar" />
                      AR
                    </>
                  ),
                }}
              >
                This is your %ar% deposit address.
              </I18nMessage>
            </h2>
          </div>
        </div>
      }
    />
  );
}

export default ReceiveAr;
