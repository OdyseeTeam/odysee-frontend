// @flow
import React from 'react';
import { NavLink } from 'react-router-dom';
import QRCode from 'component/common/qr-code';
import CopyableText from 'component/copyableText';
import ButtonToggle from 'component/buttonToggle';
import Card from 'component/common/card';
import Symbol from 'component/common/symbol';
import Button from 'component/button';
import Spinner from 'component/spinner';
import { LocalStorage } from 'util/storage';
import './style.scss';

function Overview(props: Props) {
  const { 
    account, 
    cardHeader, 
    wallet, 
    balance, 
    arWalletStatus, 
    doUpdateArweaveAddressStatus, 
    accountUpdating,
    activeArStatus,
    doArSend,
  } = props;

  const [transactions, setTransactions] = React.useState(null);
  const [canSend, setCanSend] = React.useState(false);
  const [showQR, setShowQR] = React.useState(LocalStorage.getItem('WANDER_QR') === 'true' ? true : false);
  const inputAmountRef = React.useRef();
  const inputReceivingAddressRef = React.useRef();

  React.useEffect(() => {    
    (async () => {      
      if (window.arweaveWallet && activeArStatus === 'connected') {
        try {
          const address = await window.arweaveWallet.getActiveAddress();
          const senderTransactions = await fetch('https://arweave-search.goldsky.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `{
                transactions(
                  owners: ["${address}"],
                ) { 
                  edges { 
                    node { 
                      id
                      recipient
                      quantity { ar }
                      owner { address }
                      block { timestamp height }
                      tags { name, value }
                    }
                  }
                }
              }`,
            }),
          });

          const receiverTransactions = await fetch('https://arweave-search.goldsky.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `{
                transactions(
                  recipients: ["${address}"],
                ) { 
                  edges { 
                    node { 
                      id
                      recipient
                      quantity { ar }
                      owner { address }
                      block { timestamp height }
                      tags { name, value }
                    }
                  }
                }
              }`,
            }),
          });

          const receivedDataA = await senderTransactions.json();
          const receivedDataB = await receiverTransactions.json();          

          const transactionsA = receivedDataA.data?.transactions?.edges || [];
          const transactionsB = receivedDataB.data?.transactions?.edges || [];

          const transactions = [...transactionsA, ...transactionsB];
          console.log('Fetched transactions: ', transactions)

          if (
            transactions
          ) {
            const newTransactions = [];
            for (let entry of transactions) {
              const transaction = entry.node;
              const row = {
                txId: transaction.id,
                date: transaction.block.timestamp,
                action: transaction.recipient === address ? 'receiveTip' : 'sendTip',
                amount: Number(transaction.quantity.ar),
                target: transaction.recipient === address ? transaction.owner.address : transaction.recipient,
              };
              if (row.target && row.amount > 0) newTransactions.push(row);
            }
            const sortByDateDesc = (txs) => [...txs].sort((a, b) => b.date - a.date);

            setTransactions(sortByDateDesc(newTransactions));
          }
        } catch (e) {
          console.error(e);
        }
      }
    })();
  }, [activeArStatus, balance, activeArStatus]);
  console.log('arWalletStatus: ', arWalletStatus)

  React.useEffect(() => {
    LocalStorage.setItem('WANDER_QR', showQR);
  }, [showQR]);

  function handleCheckForm() {
    const isValidArweaveAddress = (address) => /^[A-Za-z0-9_-]{43}$/.test(address);
    const check =
      inputAmountRef.current.value &&
      Number(inputAmountRef.current.value) <= Number(balance.ar) &&
      isValidArweaveAddress(inputReceivingAddressRef.current.value);
    setCanSend(check);
  }

  function handleSetMaxAmount() {
    inputAmountRef.current.value = balance.ar;
    handleCheckForm();
  }

  const handlemonetizationToggle = () => {
    doUpdateArweaveAddressStatus(account.id, account.status === 'active' ? 'inactive' : 'active');
  };

  const handleSendClick = () => {
    const recipientAddress = inputReceivingAddressRef.current.value.trim();
    const amountAr = Number(inputAmountRef.current.value);
    if (!recipientAddress || !amountAr) return;
    doArSend(recipientAddress, amountAr);
  };

  return (
    <Card
      className={activeArStatus !== 'connected' ? `card--overview card--disabled` : `card--overview`}
      title={cardHeader()}
      background
      actions={
        <>
          <div className="payment-options-wrapper">
            <div className="payment-options-card">
              <div className="payment-options">
                <h2 className="section__title--small">{__('Connected wallet')}</h2>
                <div className="payment-options-content">
                  <div className="payment-option">
                    <div className="sendArLabel">{__('Address')}</div>
                    <CopyableText copyable={wallet?.address} />
                  </div>
                  <div className="payment-option__monetization">
                    {__('Show QR code')} <ButtonToggle status={showQR} setStatus={() => setShowQR(!showQR)} />
                  </div>
                </div>
              </div>
              <div className="payment-options">
                <h2 className="section__title--small">{__('Settings')}</h2>
                <div className="payment-options-content">
                  <div className="payment-option">
                    <div className="payment-option__monetization">
                      <div className="payment-option__labels">
                        <h3>{__('Allow monetization')}</h3>
                        <span>{__('Turning this on enables your account(s) to receive tips and setup memberships.')}</span>
                      </div>
                      <ButtonToggle
                        status={account?.status === 'active'}
                        setStatus={handlemonetizationToggle}
                        busy={accountUpdating}
                      />
                    </div>                    
                  </div>
                </div>
              </div>
            </div>

            {showQR && (
              <div className="payment-options">
                <h2 className="section__title--small">{__('Receive')}</h2>
                <div className="payment-options-content">
                  <div className="payment-option" style={{ alignItems: 'center' }}>
                    {wallet && wallet.address && <QRCode value={wallet.address} />}
                  </div>
                </div>
              </div>
            )}

            <div className="payment-options">
              <h2 className="section__title--small">{__('Send')}</h2>
              <div className="payment-options-content">
                <div className="payment-option">
                  <div className="sendAr-row">
                    <div className="sendAr-row__amount">
                      <div className="sendArLabel">{__('Amount')}</div>
                      <input
                        ref={inputAmountRef}
                        type="number"
                        step="0.00000001"
                        placeholder={Number(0).toFixed(8)}
                        onChange={handleCheckForm}
                      />
                    </div>
                    <div className="sendAr__total" onClick={handleSetMaxAmount}>
                      <span>
                        {__('Totally available: ')} {balance.ar.toFixed(8)}
                      </span>
                    </div>

                    <div className="sendAr-row__receiver">
                      <div className="sendArLabel">{__('Receiving address')}</div>
                      <input
                        ref={inputReceivingAddressRef}
                        type="text"
                        placeholder={`00000000000000000000000000000000000000000`}
                        onChange={handleCheckForm}
                      />
                    </div>
                    <div className="sendAr-row__send">
                      <Button
                        button="primary" 
                        title={__('Send')} 
                        label={__('Send')} 
                        disabled={!canSend || arWalletStatus?.sending} 
                        onClick={handleSendClick}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="section__title--small">
            {__('Transaction history')}
            <NavLink to={`wallet?tab=fiat-payment-history&currency=fiat&transactionType=tips`}>Tip history</NavLink>
          </h2>
          <div className="transaction-history">
            {!transactions 
              ? <Spinner type="small" />
              : transactions.map((transaction, index) => (
                  <div key={index} className="transaction-history__row">
                    <div className="transaction-history__date">
                      {new Date(transaction.date * 1000).toLocaleString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      }).replace(',', '')}
                    </div>
                    <div className="transaction-history__action">
                      {transaction.action === 'sendTip' ? __('Send') : __('Receive')}
                    </div>
                    <div className="transaction-history__amount">{transaction.amount.toFixed(6)}</div>
                    <div className="transaction-history__token">
                      <Symbol token="ar" />
                    </div>
                    <div className="transaction-history__direction">
                      {transaction.action === 'sendTip' ? __('to') : __('from')}
                    </div>
                    <div className="transaction-history__target">{transaction.target}</div>
                    <div className="transaction-history__viewblock">
                      <a href={`https://viewblock.io/arweave/tx/${transaction.txId}`} target="_blank" rel="noreferrer">
                        <img src="https://thumbs.odycdn.com/ea5d40b35d7355f25d0199ed4832f77b.webp" />
                      </a>
                    </div>
                  </div>
                ))
            }
          </div>
        </>
      }
    />
  );
}

export default Overview;
