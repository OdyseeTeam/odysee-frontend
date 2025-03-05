// @flow
import React from 'react';
import Card from 'component/common/card';
import ButtonToggle from 'component/buttonToggle';
import './style.scss';

function ArWallets(props: Props) {
  const { cardHeader, arweaveWallets, arWalletStatus, activeAddress } = props;

  console.log('activeAddress: ', activeAddress);

  return (
    <Card
      className={!arWalletStatus ? `card--arwalllets card--disabled` : `card--arwalllets`}
      title={cardHeader()}
      background
      actions={
        <>
          <div className="wallet-table">
            <div className="wallet-table-row wallet-table-row--header">
              <div className="wallet-table-row__id">#</div>
              <div className="wallet-table-row__address">{__('Arweave Address')}</div>
              <div className="wallet-table-row__deposit">{__('Deposit Address')}</div>
              <div className="wallet-table-row__status">{__('Status')}</div>
              <div className="wallet-table-row__default">{__('Connected')}</div>
            </div>
            {arweaveWallets.map((wallet, index) => {
              return (
                <div
                  className={
                    wallet.address === activeAddress
                      ? `wallet-table-row`
                      : `wallet-table-row wallet-table-row--disconnected`
                  }
                >
                  <div className="wallet-table-row__id">{index + 1}</div>
                  <div className="wallet-table-row__address">{wallet.address}</div>
                  <div className="wallet-table-row__deposit">{wallet.deposit_address}</div>
                  <div className="wallet-table-row__status">
                    <ButtonToggle status={wallet.status === 'active' ? true : false} />
                  </div>
                  <div className="wallet-table-row__default">{wallet.default.toString()}</div>
                </div>
              );
            })}
          </div>
        </>
      }
    />
  );
}

export default ArWallets;
