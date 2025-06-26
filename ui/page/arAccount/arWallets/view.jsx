// @flow
import React from 'react';
import Card from 'component/common/card';
import ButtonToggleAddressActive from 'component/buttonToggleAddressActive';
import './style.scss';

type Props = {
  cardHeader: any,
  arweaveWallets: any,
  activeAddress: string,
  activeArStatus: any,
};

function ArWallets(props: Props) {
  const { cardHeader, arweaveWallets, activeAddress, activeArStatus } = props;

  return (
    <Card
      className={activeArStatus !== 'connected' ? `card--arwalllets card--disabled` : `card--arwalllets`}
      title={cardHeader()}
      background
      actions={
        <>
          <div className="wallet-table">
            <div className="wallet-table-row wallet-table-row--header">
              <div className="wallet-table-row__id">#</div>
              <div className="wallet-table-row__address">{__('Arweave Address')}</div>
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
                  key={wallet.address}
                >
                  <div className="wallet-table-row__id">{index + 1}</div>
                  <div className="wallet-table-row__address">{wallet.address}</div>
                  <div className="wallet-table-row__status">
                    <ButtonToggleAddressActive address={wallet?.address} />
                  </div>
                  <div className="wallet-table-row__default">
                    {wallet.default
                      ? <img src="https://thumbs.odycdn.com/8ee966185b537b147fb7be4412b6bc68.webp" />
                      : <img src="https://thumbs.odycdn.com/bd2adbec2979b00b1fcb6794e118d5db.webp" />
                    }
                  </div>
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
