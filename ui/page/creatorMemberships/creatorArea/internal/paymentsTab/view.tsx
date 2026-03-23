import React from 'react';
import PaymentRow from './internal/paymentRow';
import { useLocation } from 'react-router-dom';
import Paginate from 'component/common/paginate';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doMembershipFetchIncomingPayments } from 'redux/actions/memberships';
import {
  selectMembershipTxIncoming,
  selectMembershipTxIncomingFetching,
  selectMembershipTxIncomingError,
} from 'redux/selectors/memberships';
interface IProps {
  channelsToList?: Array<any>;
}
const PAGINATE_PARAM = 'page';
const PAGE_SIZE = 25;

function PaymentsTab(props: IProps) {
  const { channelsToList } = props;
  const dispatch = useAppDispatch();
  const transactions = useAppSelector(selectMembershipTxIncoming);
  const txsFetching = useAppSelector(selectMembershipTxIncomingFetching);
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const urlParamPage = Number(urlParams.get(PAGINATE_PARAM)) || 1;
  const pageStart = (urlParamPage - 1) * PAGE_SIZE;
  const pageEnd = urlParamPage * PAGE_SIZE;
  React.useEffect(() => {
    dispatch(doMembershipFetchIncomingPayments());
  }, [dispatch]);
  const channelIdsToList = channelsToList && channelsToList.map((c) => c.claim_id);
  const transactionsToList = (
    channelIdsToList && channelIdsToList.length
      ? transactions.filter((t) => channelIdsToList.includes(t.creator_channel_claim_id))
      : transactions
  ).toSorted((a, b) => new Date(b.initiated_at) - new Date(a.initiated_at));
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
              transactionsToList.slice(pageStart, pageEnd).map((transaction) => {
                return (
                  <PaymentRow
                    key={transaction.transaction_id}
                    transaction={transaction}
                    longList={transactionsToList.length > 100}
                  />
                );
              })}
          </tbody>
        </table>
        <Paginate totalPages={Math.ceil(transactionsToList.length / PAGE_SIZE)} />
        {!txsFetching && transactions.length === 0 && (
          <p className="wallet__fiat-transactions">{__('No Membership Payments')}</p>
        )}
        {txsFetching && transactions.length === 0 && (
          <p className="wallet__fiat-transactions">{__('Fetching Membership Payments')}</p>
        )}
      </div>
    </>
  );
}

export default PaymentsTab;
