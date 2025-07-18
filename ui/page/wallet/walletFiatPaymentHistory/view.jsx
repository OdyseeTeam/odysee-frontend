// @flow
import React from 'react';
import Button from 'component/button';
import Paginate from 'component/common/paginate';
import CopyableText from 'component/copyableText';
import moment from 'moment';
import PAGES from 'constants/pages';
import * as STRIPE from 'constants/stripe';
import { toCapitalCase } from 'util/string';

type Props = {
  page: number,
  pageSize: number,
  fetchDataOnMount?: boolean, // Option to fetch it ourselves, or not if parent or someone else has done it
  // --- redux ---
  paymentHistory: StripeTransactions,
  lastFour: ?any,
  doCustomerListPaymentHistory: () => void,
  doGetCustomerStatus: () => void,
  transactionType: 'tips' | 'rentals-purchases',
};

const WalletFiatPaymentHistory = (props: Props) => {
  const {
    page = 1,
    pageSize = 5,
    fetchDataOnMount,
    paymentHistory,
    doCustomerListPaymentHistory,
    doGetCustomerStatus,
    transactionType,
  } = props;

  const transactionsRaw = paymentHistory ? paymentHistory.filter(typeFilterCb) : [];
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
    return moment(transaction.created_at).format('LLL');
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

  function getTipAmount(transaction) {
    const symbol = transaction.currency !== 'AR' ? STRIPE.CURRENCY[transaction.currency.toUpperCase()]?.symbol : '$';
    const currency = transaction.currency !== 'AR' ? STRIPE.CURRENCIES[transaction.currency.toUpperCase()] : 'USD';
    return (
      <>
        {symbol}
        {transaction.tipped_amount / 100} {currency}
      </>
    );
  }

  function getIsAnon(transaction) {
    return transaction.private_tip ? __('Yes') : __('No');
  }

  function getTransactionTx(transaction) {
    return (
      <>
        {transaction?.currency === 'AR' ? (
          <CopyableText
            hideValue
            linkTo={`https://viewblock.io/arweave/tx/`}
            copyable={transaction.payment_intent_id}
          />
        ) : null}
      </>
    );
  }

  // **************************************************************************
  // **************************************************************************

  React.useEffect(() => {
    if (fetchDataOnMount) {
      doCustomerListPaymentHistory();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    doGetCustomerStatus();
  }, [doGetCustomerStatus]);

  return (
    <>
      <div className="section card-stack">
        <div className="table__wrapper">
          <table className="table table--transactions">
            <thead>
              <tr>
                <th className="date-header">{__('Date')}</th>
                <th className="channelName-header">{<>{__('Receiving Channel')}</>}</th>
                <th className="transactionType-header">{<>{__('Type')}</>}</th>
                <th className="location-header">{__('Location')}</th>
                <th className="amount-header">{__('Amount')} </th>
                <th className="anonymous-header">{__('Anonymous')}</th>
                <th className="transactionId-header">{__('Transaction')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions &&
                transactions.map((t) => (
                  <tr key={t.name + t.created_at}>
                    {createColumn(getDate(t))}
                    {createColumn(getReceivingChannelName(t))}
                    {createColumn(getTransactionType(t))}
                    {createColumn(getClaimLink(t))}
                    {createColumn(getTipAmount(t))}
                    {/* TODO: this is incorrect need it per transactions not per user */}
                    {createColumn(getIsAnon(t))}
                    {createColumn(getTransactionTx(t))}
                  </tr>
                ))}
            </tbody>
          </table>
          {(!transactions || transactions.length === 0) && <p className="wallet__fiat-transactions">{__('No Tips')}</p>}
        </div>
        <Paginate totalPages={totalPages} />
      </div>
    </>
  );
};

export default WalletFiatPaymentHistory;
