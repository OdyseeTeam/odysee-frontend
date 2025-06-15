// @flow
import React from 'react';
import PaymentRow from './internal/paymentRow';

interface IProps {
  doMembershipFetchOutgoingPayments: () => void,
  channelsToList?: Array<string>,
}

function PaymentsTab(props: IProps) {
  const {
    doMembershipFetchOutgoingPayments,
    transactions,
    channelsToList,
  } = props;

  React.useEffect(() => {
    doMembershipFetchOutgoingPayments();
  }, [doMembershipFetchOutgoingPayments]);

  const channelIdsToList = channelsToList && channelsToList.map(c => c.claim_id);

  const transactionsToList = (channelIdsToList && channelIdsToList.length
    ? transactions.filter(t => channelIdsToList.includes(t.subscriber_channel_claim_id))
    : transactions
  ).sort((a, b) => new Date(b.initiated_at).getTime() - new Date(a.initiated_at).getTime());

  return (
    <>
      <div className="membership-payments-table__wrapper">
        <table className="table">
          <thead>
          <tr>
            <th className="date-header">{__('Date')}</th> {/* completed_at */}
            <th className="channelName-header">{<>{__('Receiving Channel')}</>}</th> {/* */}
            <th className="channelName-header">{<>{__('Sending Channel')}</>}</th> {/* */}
            <th>{__('Membership')} </th> {/* */}
            <th className="payment-txid">{__('Transaction')} </th>
            <th className="amount-header">{__('Amount')} </th> {/* */}
            <th className="amount-header">{__('Status')} </th> {/* */}
          </tr>
          </thead>
          <tbody>
          {transactionsToList &&
            transactionsToList.map((transaction) => {
              return (
                <PaymentRow key={transaction.transaction_id} transaction={transaction} />
              );
            })}
          </tbody>
        </table>
        {transactions.length === 0 && <p className="wallet__fiat-transactions">{__('No Membership Payments')}</p>}
      </div>
    </>
  );
}

export default PaymentsTab;
