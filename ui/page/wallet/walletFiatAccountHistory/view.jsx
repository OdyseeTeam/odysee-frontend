// @flow
import React from 'react';
import Button from 'component/button';
import moment from 'moment/min/moment-with-locales';
import PAGES from 'constants/pages';
import * as STRIPE from 'constants/stripe';
import { toCapitalCase } from 'util/string';

type Props = {
  fetchDataOnMount?: boolean, // Option to fetch it ourselves, or not if parent or someone else has done it
  incomingHistory: StripeTransactions,
  transactionType: string,
  appLanguage: string,
  doListAccountTransactions: () => void,
};

const WalletFiatAccountHistory = (props: Props) => {
  const { appLanguage } = props;
  const { fetchDataOnMount, incomingHistory, transactionType, doListAccountTransactions } = props;

  const tipsBranch = transactionType === 'tips';
  const rentalsAndPurchasesBranch = transactionType === 'rentals-purchases';

  // filter transactions by type
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

  const transactions =
    incomingHistory &&
    incomingHistory.filter((transaction) => {
      return getMatch(transaction.type);
    });

  // TODO: should add pagination here
  // if there are more than 10 transactions, limit it to 10 for the frontend
  // if (transactions && transactions.length > 10) {
  //   transactions.length = 10;
  // }

  React.useEffect(() => {
    if (fetchDataOnMount) {
      doListAccountTransactions();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
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
            <th className="processingFee-header">{__('Processing Fee')}</th>
            <th className="receivedAmount-header">{__('Received Amount')}</th>
          </tr>
        </thead>
        <tbody>
          {transactions &&
            transactions.map((transaction) => {
              const { symbol: currencySymbol } = STRIPE.CURRENCY[transaction.currency.toUpperCase()] || {};
              const targetClaimId = transaction.target_claim_id;

              return (
                <tr key={transaction.name + transaction.created_at}>
                  <td>{moment(transaction.created_at).locale(appLanguage).format('LLL')}</td>
                  <td>
                    <Button
                      navigate={'/' + transaction.channel_name + ':' + transaction.channel_claim_id}
                      label={transaction.channel_name}
                      button="link"
                    />
                  </td>
                  <td>
                    <Button
                      navigate={'/' + transaction.tipper_channel_name + ':' + transaction.tipper_channel_claim_id}
                      label={transaction.tipper_channel_name}
                      button="link"
                    />
                  </td>
                  <td>{toCapitalCase(transaction.type)}</td>
                  <td>
                    <Button
                      navigate={targetClaimId ? `/$/${PAGES.SEARCH}?q=${targetClaimId}` : undefined}
                      label={
                        transaction.channel_claim_id === transaction.source_claim_id ? __('Channel') : __('Content')
                      }
                      button="link"
                      target="_blank"
                    />
                  </td>
                  <td>
                    {currencySymbol}
                    {transaction.tipped_amount / 100} {STRIPE.CURRENCIES[transaction.currency.toUpperCase()]}
                  </td>
                  <td>
                    {currencySymbol}
                    {(transaction.transaction_fee + transaction.application_fee) / 100}
                  </td>
                  <td>
                    {currencySymbol}
                    {transaction.received_amount / 100}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
      {!transactions && <p className="wallet__fiat-transactions">{__('No Tips')}</p>}
    </div>
  );
};

export default WalletFiatAccountHistory;
