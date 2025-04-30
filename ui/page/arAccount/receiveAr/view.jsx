// @flow
import React from 'react';
import Card from 'component/common/card';
import './style.scss';

function ReceiveAr(props: Props) {
  const { cardHeader, arWalletStatus } = props;

  return (
    <Card
      className={!arWalletStatus ? `card--receiveusdc card--disabled` : `card--receiveusdc`}
      title={cardHeader()}
      background
      actions={
        <div className="section__flex">
          Buy Info
        </div>
      }
    />
  );
}

export default ReceiveAr;
