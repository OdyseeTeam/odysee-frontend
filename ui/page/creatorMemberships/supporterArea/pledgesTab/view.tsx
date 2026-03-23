import React from 'react';
import Yrbl from 'component/yrbl';
import Spinner from 'component/spinner';
import MembershipRow from './internal/membershipRow';
import ButtonSort from 'component/buttonSort';
import { getRenewByMoment } from 'util/memberships';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectMembershipMineFetching, selectMyPurchasedMembershipsFromCreators } from 'redux/selectors/memberships';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { doMembershipMine } from 'redux/actions/memberships';
import { doResolveClaimIds } from 'redux/actions/claims';
type Props = {};

function PledgesTab(props: Props) {
  const dispatch = useAppDispatch();
  const myMembershipSubs = useAppSelector(selectMyPurchasedMembershipsFromCreators);
  const isFetchingMembershipSubs = useAppSelector(selectMembershipMineFetching);
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  React.useEffect(() => {
    if (myMembershipSubs === undefined) {
      dispatch(doMembershipMine());
    }
  }, [dispatch, myMembershipSubs]);
  const subChannelIds = React.useMemo(() => {
    return myMembershipSubs ? myMembershipSubs.map((sub) => sub.membership.channel_claim_id) : [];
  }, [myMembershipSubs]);
  const [resolved, setResolved] = React.useState(false);
  React.useEffect(() => {
    if (!resolved && subChannelIds && subChannelIds.length) {
      setResolved(true);
      dispatch(doResolveClaimIds(subChannelIds));
    }
  }, [subChannelIds, dispatch, resolved]);
  const [sortKey, setSortKey] = React.useState(null);
  const [order, setOrder] = React.useState('desc');
  const RENEW_KEY = 'renewBy';
  // const STARTED_AT_KEY = 'startedAt';
  const AMOUNT_KEY = 'amount';
  const ORDER_ASC = 'asc';
  // const ORDER_DESC = 'desc';
  const sortedMembershipSubs = React.useMemo(() => {
    // let startedAtSort = (a, b) => new Date(b.subscription.started_at).getTime() - new Date(a.subscription.started_at).getTime();
    let amountSortAsc = (a, b) => a.subscription.current_price.amount - b.subscription.current_price.amount;

    let amountSortDesc = (a, b) => b.subscription.current_price.amount - a.subscription.current_price.amount;

    let renewBySortAsc = (a, b) => getRenewByMoment(a) - (getRenewByMoment(b) || 999999999999999); // if null, make it really big so it's last

    let renewBySortDesc = (a, b) => (getRenewByMoment(b) || 999999999999999) - getRenewByMoment(a); // if null, make it really big so it's last

    const defaultSort = renewBySortAsc;
    let sortFn;

    if (!sortKey) {
      sortFn = defaultSort;
    } else if (sortKey === RENEW_KEY) {
      if (order === ORDER_ASC) {
        sortFn = renewBySortAsc;
      } else {
        sortFn = renewBySortDesc;
      }
    } else if (sortKey === AMOUNT_KEY) {
      if (order === ORDER_ASC) {
        sortFn = amountSortAsc;
      } else {
        sortFn = amountSortDesc;
      }
    }

    return myMembershipSubs
      ? myMembershipSubs.filter((sub) => sub.subscription.is_active === true).toSorted(sortFn)
      : [];
  }, [myMembershipSubs, sortKey, order]);

  if (myMembershipSubs === undefined && isFetchingMembershipSubs) {
    return (
      <div className="main--empty">
        <Spinner />
      </div>
    );
  } else if (myMembershipSubs === undefined && !isFetchingMembershipSubs) {
    return (
      <div className="main--empty">
        <p>{__('Failed to fetch memberships')}</p>
      </div>
    );
  }

  if (!myMembershipSubs || myMembershipSubs.length === 0) {
    return (
      <div className="membership__mypledges-wrapper">
        <div className="membership__mypledges-content">
          <Yrbl
            type="happy"
            subtitle={__('Find creators that you like and support them. Your pledges will show up on this page.')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="membership__mypledges-wrapper">
      <div className="membership__mypledges-content">
        <div className="membership-table__wrapper">
          <table className="table table--pledges">
            <thead>
              <tr>
                <th className="channelName-header" colSpan="2">
                  {__('Channel Name')}
                </th>
                <th>{__('Tier')}</th>
                <th>{__('Paid Until')}</th>
                <th>{__('Months Supported')}</th>
                <ButtonSort
                  label={'Amount'}
                  sortKey={sortKey}
                  ownKey={AMOUNT_KEY}
                  setKey={setSortKey}
                  setOrder={setOrder}
                  order={order}
                />
                <ButtonSort
                  label={'Renew By'}
                  sortKey={sortKey}
                  ownKey={RENEW_KEY}
                  setKey={setSortKey}
                  setOrder={setOrder}
                  order={order}
                />
                <th>{__('Status')}</th>
                <th className="membership-table__page">{__('Page')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembershipSubs.map((membershipSub, index) => {
                return <MembershipRow membershipSub={membershipSub} key={index} />;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PledgesTab;
