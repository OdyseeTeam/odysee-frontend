// @flow
import React from 'react';
import CopyableText from 'component/copyableText';
import ButtonToggle from 'component/buttonToggle';
import Card from 'component/common/card';
import Symbol from 'component/common/symbol';
import './style.scss';

function Overview(props: Props) {
  const { cardHeader, arWalletStatus } = props;
  const [transactions, setTransactions] = React.useState([]);

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

  const address = '';
  return (
    <Card
      className={!arWalletStatus ? `card--overview card--disabled` : `card--overview`}
      title={cardHeader()}
      background
      actions={
        <>
          <h2 className="section__title--small">{__('Connected wallet')}</h2>
          <div className="payment-options">
            <div className="payment-option">
              <CopyableText copyable={address} />
            </div>
            <div className="payment-option">
              <div className="payment-option__monetization">
                {__('Allow monetization')} <ButtonToggle status />
              </div>
            </div>
          </div>
          <h2 className="section__title--small">{__('Transaction history')}</h2>
          <div className="transaction-history">
            {transactions.map((transaction, index) => {
              return (
                <div className="transaction-history__row" key={index}>
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
                    <Symbol token="usdc" />
                    USDC
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
