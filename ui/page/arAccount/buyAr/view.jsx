// @flow
import React from 'react';
import Card from 'component/common/card';
import './style.scss';

function BuyAr(props: Props) {
  const { cardHeader, arWalletStatus } = props;

  return (
    <Card
      className={!arWalletStatus ? `card--receiveusdc card--disabled` : `card--receiveusdc`}
      title={cardHeader()}
      background
      actions={
        <div className="section__flex">
          The easiest way to buy AR is by using your Wander browser extension or die Wander mobile app.
        </div>
      }
    />
  );
}

export default BuyAr;
