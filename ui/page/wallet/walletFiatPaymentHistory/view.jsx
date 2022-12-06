// @flow
import React from 'react';
import Button from 'component/button';
import moment from 'moment';
import * as STRIPE from 'constants/stripe';
import { toCapitalCase } from 'util/string';

type Props = {
  transactions: StripeTransactions,
  lastFour: ?any,
  doGetCustomerStatus: () => void,
  transactionType: string,
};

const WalletFiatPaymentHistory = (props: Props) => {
  // receive transactions from parent component
  let { transactions: accountTransactions, lastFour, doGetCustomerStatus, transactionType } = props;

  const tipsBranch = transactionType === 'tips';
  const rentalsAndPurchasesBranch = transactionType === 'rentals-purchases';

  function getMatch(transactionType) {
    switch (transactionType) {
      case 'tip':
        return tipsBranch;
      case 'rental':
        return rentalsAndPurchasesBranch;
      case 'purchase':
        return rentalsAndPurchasesBranch;
    }
  }

  accountTransactions =
    accountTransactions &&
    accountTransactions.filter((transaction) => {
      return getMatch(transaction.type);
    });

  React.useEffect(() => {
    doGetCustomerStatus();
  }, [doGetCustomerStatus]);

  return (
    <>
      <div className="section card-stack">
        <div className="table__wrapper">
          <table className="table table--transactions">
            {/* table header */}
            <thead>
              <tr>
                <th className="date-header">{__('Date')}</th>
                <th className="channelName-header">{<>{__('Receiving Channel')}</>}</th>
                <th className="transactionType-header">{<>{__('Type')}</>}</th>
                <th className="location-header">{__('Location')}</th>
                <th className="amount-header">{__('Amount')} </th>
                <th className="card-header">{__('Card Last 4')}</th>
                <th className="anonymous-header">{__('Anonymous')}</th>
              </tr>
            </thead>
            {/* list data for transactions */}
            <tbody>
              {accountTransactions &&
                accountTransactions.map((transaction) => (
                  <tr key={transaction.name + transaction.created_at}>
                    {/* date */}
                    <td>{moment(transaction.created_at).format('LLL')}</td>
                    {/* receiving channel name */}
                    <td>
                      <Button
                        navigate={'/' + transaction.channel_name + ':' + transaction.channel_claim_id}
                        label={transaction.channel_name}
                        button="link"
                      />
                    </td>
                    <td>{toCapitalCase(transaction.type)}</td>
                    {/* link to content or channel */}
                    <td>
                      <Button
                        navigate={'/' + transaction.channel_name + ':' + transaction.source_claim_id}
                        label={
                          transaction.channel_claim_id === transaction.source_claim_id ? __('Channel') : __('Content')
                        }
                        button="link"
                      />
                    </td>
                    {/* how much tipped */}
                    <td>
                      {STRIPE.CURRENCY[transaction.currency.toUpperCase()]?.symbol}
                      {transaction.tipped_amount / 100} {STRIPE.CURRENCIES[transaction.currency.toUpperCase()]}
                    </td>
                    {/* TODO: this is incorrect need it per transactions not per user */}
                    {/* last four of credit card  */}
                    <td>{lastFour}</td>
                    {/* whether tip is anonymous or not */}
                    <td>{transaction.private_tip ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {/* show some markup if there's no transactions */}
          {(!accountTransactions || accountTransactions.length === 0) && (
            <p className="wallet__fiat-transactions">{__('No Tips')}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default WalletFiatPaymentHistory;
