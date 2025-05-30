// @flow
import React from 'react';
import PaymentRow from './internal/paymentRow';

interface IProps {
  doMembershipFetchOutgoingPayments: () => void,
}

function PaymentsTab(props: IProps) {
  const {
    doMembershipFetchOutgoingPayments,
    transactions,
  } = props;

  React.useEffect(() => {
    doMembershipFetchOutgoingPayments();
  }, [doMembershipFetchOutgoingPayments]);

  return (
    <>
      <div className="table__wrapper">
        <table className="table">
          <thead>
          <tr>
            <th className="date-header">{__('Date')}</th> {/* completed_at */}
            <th className="channelName-header">{<>{__('Receiving Channel')}</>}</th> {/* */}
            <th className="channelName-header">{<>{__('Sending Channel')}</>}</th> {/* */}
            <th>{__('Membership')} </th> {/* */}
            <th className="amount-header">{__('Amount')} </th> {/* */}
            <th className="amount-header">{__('Status')} </th> {/* */}
          </tr>
          </thead>
          <tbody>
          {transactions &&
            transactions.map((transaction) => {
              return (
                <PaymentRow key={transaction.transaction_id} transaction={transaction} />
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
