// @flow
import React from 'react';
import QRCode from 'component/common/qr-code';
import CopyableText from 'component/copyableText';
import ButtonToggle from 'component/buttonToggle';
import Card from 'component/common/card';
import Symbol from 'component/common/symbol';
import Button from 'component/button';
import './style.scss';

function Overview(props: Props) {
  const { cardHeader, wallet, balance, arWalletStatus } = props;
  const [transactions, setTransactions] = React.useState([]);

  const [canSend, setCanSend] = React.useState(false);
  const inputAmountRef = React.useRef();
  const inputReceivingAddressRef = React.useRef();

  const [arBalance, setArBalance] = React.useState(0);
  console.log('arwstat', arWalletStatus);
  React.useEffect(() => {
    (async () => {
      if (window.arweaveWallet) {
        try {
          const address = await window.arweaveWallet.getActiveAddress();
          const sent = await fetch(`https://arweave-search.goldsky.com/graphql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `{
              transactions(
                first: 10,
                owners: ["${address}"],
                tags: [
                  { name: "Data-Protocol", values: ["ao"] },
                  { name: "Action", values: ["Transfer"] }
                  { name: "Tip_Type" } 
                ]
              ) {
                edges {
                  node {
                    id
                    recipient
                    owner { address }
                    block { timestamp height }
                    tags { name, value }
                  }
                }
              }
            }`,
            }),
          });

          const sentData = await sent.json();
          if (sentData && sentData.data && sentData.data.transactions && sentData.data.transactions.edges) {
            const transactions = sentData.data.transactions.edges;
            console.log('sent: ', transactions);
            const newTransactions = [];
            for (let entry of transactions) {
              const transaction = entry.node;
              const row = {
                date: transaction.block.timestamp,
                action: 'sendTip',
                amount: Number(transaction.tags.find((tag) => tag.name === 'Quantity')?.value) / 1000000,
                target: transaction.tags.find((tag) => tag.name === 'Claim_ID')?.value,
              };
              newTransactions.push(row);
            }
            setTransactions(newTransactions);
          }

          const received = await fetch(`https://arweave-search.goldsky.com/graphql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `{
              transactions(
                first: 10,
                tags: [
                  { name: "Data-Protocol", values: ["ao"] },
                  { name: "Action", values: ["Transfer"] },
                  { name: "Recipient", values: ["${address}"] }
                  { name: "Tip_Type" } 
                ]
              ) {
                edges {
                  node {
                    id
                    recipient
                    owner { address }
                    block { timestamp height }
                    tags { name, value }
                  }
                }
              }
            }`,
            }),
          });

          const receivedData = await received.json();
          if (
            receivedData &&
            receivedData.data &&
            receivedData.data.transactions &&
            receivedData.data.transactions.edges
          ) {
            const transactions = receivedData.data.transactions.edges;
            console.log('received: ', transactions);
          }
        } catch (e) {
          console.error(e);
        }
      }
    })();
  }, []);

  function handleCheckForm() {
    const isValidEthAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);
    const check =
      inputAmountRef.current.value &&
      Number(inputAmountRef.current.value) <= Number(balance.ar) &&
      isValidEthAddress(inputReceivingAddressRef.current.value);
    setCanSend(check);
  }

  function handleSetMaxAmount() {
    inputAmountRef.current.value = balance.ar.toFixed(8);
    handleCheckForm();
  }

  return (
    <Card
      className={!arWalletStatus ? `card--overview card--disabled` : `card--overview`}
      title={cardHeader()}
      background
      actions={
        <>
          <div className="payment-options-wrapper">
            <div className="payment-options">
              <h2 className="section__title--small">{__('Connected wallet')}</h2>
              <div className="payment-options-content">
                <div className="payment-option">
                  <div className="sendArLabel">{__('Address')}</div>
                  <CopyableText copyable={wallet?.address} />
                </div>
                <div className="payment-option">
                  <div className="sendArLabel">{__('Settings')}</div>
                  <div className="payment-option__monetization">
                    {__('Allow monetization')} <ButtonToggle status={true} />
                  </div>
                </div>
              </div>
            </div>

            <div className="payment-options">
              <h2 className="section__title--small">{__('Receive')}</h2>
              <div className="payment-options-content">
                <div className="payment-option" style={{ alignItems: 'center' }}>
                  {wallet && wallet.address && <QRCode value={wallet.address} />}
                </div>
              </div>
            </div>

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
                      <Button button="primary" title={__('Send')} label={__('Send')} disabled={!canSend} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="section__title--small">{__('Transaction history')}</h2>
          <div className="transaction-history">
            {transactions.map((transaction, index) => {
              return (
                <div className="transaction-history__row">
                  <div className="transaction-history__date">
                    {new Date(transaction.date * 1000)
                      .toLocaleString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })
                      .replace(',', '')}
                  </div>
                  <div className="transaction-history__action">
                    {transaction.action === 'sendTip' ? __('Send Tip') : __('Receive Tip')}
                  </div>
                  <div className="transaction-history__amount">{transaction.amount.toFixed(2)}</div>
                  <div className="transaction-history__token">
                    <Symbol token="ar" />
                    Ar
                  </div>
                  <div className="transaction-history__direction">
                    {transaction.action === 'sendTip' ? __('to') : __('from')}
                  </div>
                  <div className="transaction-history__target">{transaction.target}</div>
                </div>
              );
            })}
          </div>
        </>
      }
    />
  );
}

export default Overview;
