// @flow
import React from 'react';

interface IProps {
  doMembershipFetchIncomingPayments: () => void,
}

function PaymentsTab(props: IProps) {
  const {
    doMembershipFetchIncomingPayments,
    transactions,
    txsFetching,
    txsError,
  } = props;
  console.log('incoming: ', txsError || 'no-error', txsFetching, transactions);
  React.useEffect(() => {
    doMembershipFetchIncomingPayments();
  }, [doMembershipFetchIncomingPayments]);

  return (
    <>
      <div className="table__wrapper">
        <table className="table table--transactions">
          <thead>
          <tr>
            <th className="date-header">{__('Date')}</th>
            <th className="channelName-header">{<>{__('Receiving Channel')}</>}</th>
            <th className="channelName-header">{<>{__('Sending Channel')}</>}</th>
            <th className="transactionType-header">{<>{__('Type')}</>}</th>
            <th className="location-header">{__('Location')}</th>
            <th className="amount-header">{__('Amount')} </th>
            <th className="receivedAmount-header">{__('Received Amount')}</th>
          </tr>
          </thead>
          <tbody>
          {transactions &&
            transactions.map((transaction) => {
              return (
                <tr key={transaction.name + transaction.created_at}>
                  <td>a</td>
                  <td>b</td>
                  <td>c</td>
                  <td>d</td>
                  <td>e</td>
                  <td>f</td>
                  <td>g</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {transactions.length === 0 && <p className="wallet__fiat-transactions">{__('No Tips')}</p>}
      </div>
    </>
  );
}

export default PaymentsTab;
