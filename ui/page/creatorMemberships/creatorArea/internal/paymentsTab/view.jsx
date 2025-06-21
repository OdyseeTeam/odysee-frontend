// @flow
import React from 'react';
import PaymentRow from './internal/paymentRow';

interface IProps {
  doMembershipFetchIncomingPayments: () => void,
  txsFetching: boolean,
  channelsToList?: [],
}

function PaymentsTab(props: IProps) {
  const {
    doMembershipFetchIncomingPayments,
    transactions,
    txsFetching,
    channelsToList,
  } = props;
  React.useEffect(() => {
    doMembershipFetchIncomingPayments();
  }, [doMembershipFetchIncomingPayments]);
  const channelIdsToList = channelsToList && channelsToList.map(c => c.claim_id);

  const transactionsToList = (channelIdsToList && channelIdsToList.length
    ? transactions.filter(t => channelIdsToList.includes(t.creator_channel_claim_id))
    : transactions
  ).sort((a, b) => new Date(b.initiated_at) - new Date(a.initiated_at));

  return (
    <>
      <div className="membership-payments-table__wrapper">
        <table className="table">
          <thead>
          <tr>
            <th className="date-header">{__('Date')}</th>
            <th className="channelName-header">{<>{__('Receiving Channel')}</>}</th>
            <th className="channelName-header">{<>{__('Sending Channel')}</>}</th>
            <th>{__('Membership')} </th>
            <th className="payment-txid">{__('Transaction')} </th>
            <th className="amount-header">{__('Amount')} </th>
            <th className="amount-header">{__('Status')} </th>
          </tr>
          </thead>
          <tbody>
          {transactionsToList &&
            transactionsToList.map((transaction) => {
              return (
                <PaymentRow key={transaction.transaction_id} transaction={transaction} longList={transactionsToList.length > 100} />
              );
            })}
          </tbody>
        </table>
        {!txsFetching && transactions.length === 0 && <p className="wallet__fiat-transactions">{__('No Membership Payments')}</p>}
        {txsFetching && transactions.length === 0 && <p className="wallet__fiat-transactions">{__('Fetching Membership Payments')}</p>}
      </div>
    </>
  );
}

export default PaymentsTab;
