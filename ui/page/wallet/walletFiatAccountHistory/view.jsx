// @flow
import React from 'react';
import Button from 'component/button';
import Paginate from 'component/common/paginate';
import moment from 'moment/min/moment-with-locales';
import PAGES from 'constants/pages';
import * as STRIPE from 'constants/stripe';
import { toCapitalCase } from 'util/string';

type Props = {
  page: number,
  pageSize: number,
  fetchDataOnMount?: boolean, // Option to fetch it ourselves, or not if parent or someone else has done it
  // --- redux ---
  incomingHistory: StripeTransactions,
  transactionType: string,
  appLanguage: string,
  doListAccountTransactions: () => void,
};

const WalletFiatAccountHistory = (props: Props) => {
  const { appLanguage } = props;
  const {
    page = 1,
    pageSize = 5,
    fetchDataOnMount,
    incomingHistory,
    transactionType,
    doListAccountTransactions,
  } = props;

  const transactionsRaw = incomingHistory ? incomingHistory.filter((x) => typeFilterCb(x)) : [];
  const transactions = transactionsRaw.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(transactionsRaw.length / pageSize);

  // **************************************************************************
  // **************************************************************************

  function typeFilterCb(s: StripeTransaction) {
    switch (transactionType) {
      case 'tips':
        return s.type === 'tip';
      case 'rentals-purchases':
        return s.type === 'rental' || s.type === 'purchase';
      default:
        return false;
    }
  }

  function createColumn(value: any) {
    return <td>{value}</td>;
  }

  function getDate(transaction) {
    return moment(transaction.created_at).locale(appLanguage).format('LLL');
  }

  function getReceivingChannelName(transaction) {
    return (
      <Button
        navigate={'/' + transaction.channel_name + ':' + transaction.channel_claim_id}
        label={transaction.channel_name}
        button="link"
      />
    );
  }

  function getSendingChannelName(transaction) {
    return (
      <Button
        navigate={'/' + transaction.tipper_channel_name + ':' + transaction.tipper_channel_claim_id}
        label={transaction.tipper_channel_name}
        button="link"
      />
    );
  }

  function getTransactionType(transaction) {
    return toCapitalCase(transaction.type);
  }

  function getClaimLink(transaction) {
    return (
      <Button
        navigate={transaction.target_claim_id ? `/$/${PAGES.SEARCH}?q=${transaction.target_claim_id}` : undefined}
        label={transaction.channel_claim_id === transaction.source_claim_id ? __('Channel') : __('Content')}
        button="link"
        target="_blank"
      />
    );
  }

  function getTipAmount(transaction, currencySymbol) {
    return (
      <>
        {currencySymbol}
        {transaction.tipped_amount / 100} {STRIPE.CURRENCIES[transaction.currency.toUpperCase()]}
      </>
    );
  }

  function getProcessingFee(transaction, currencySymbol) {
    return (
      <>
        {currencySymbol}
        {(transaction.transaction_fee + transaction.application_fee) / 100}
      </>
    );
  }

  function getReceivedAmount(transaction, currencySymbol) {
    return (
      <>
        {currencySymbol}
        {transaction.received_amount / 100}
      </>
    );
  }

  // **************************************************************************
  // **************************************************************************

  React.useEffect(() => {
    if (fetchDataOnMount) {
      doListAccountTransactions();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
              <th className="processingFee-header">{__('Processing Fee')}</th>
              <th className="receivedAmount-header">{__('Received Amount')}</th>
            </tr>
          </thead>
          <tbody>
            {transactions &&
              transactions.map((transaction) => {
                const { symbol: currencySymbol } = STRIPE.CURRENCY[transaction.currency.toUpperCase()] || {};
                return (
                  <tr key={transaction.name + transaction.created_at}>
                    {createColumn(getDate(transaction))}
                    {createColumn(getReceivingChannelName(transaction))}
                    {createColumn(getSendingChannelName(transaction))}
                    {createColumn(getTransactionType(transaction))}
                    {createColumn(getClaimLink(transaction))}
                    {createColumn(getTipAmount(transaction, currencySymbol))}
                    {createColumn(getProcessingFee(transaction, currencySymbol))}
                    {createColumn(getReceivedAmount(transaction, currencySymbol))}
                  </tr>
                );
              })}
          </tbody>
        </table>
        {transactions.length === 0 && <p className="wallet__fiat-transactions">{__('No Tips')}</p>}
      </div>
      <Paginate totalPages={totalPages} />
    </>
  );
};

export default WalletFiatAccountHistory;
