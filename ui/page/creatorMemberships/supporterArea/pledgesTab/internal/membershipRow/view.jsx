// @flow
import React from 'react';
import { buildURI } from 'util/lbryURI';
import Spinner from 'component/spinner';
import { formatLbryUrlForWeb } from 'util/url';
import ChannelThumbnail from 'component/channelThumbnail';
import UriIndicator from 'component/uriIndicator';
import { toCapitalCase } from 'util/string';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import * as moment from 'moment';

type Props = {
  membershipSub: MembershipSub,
  creatorChannelClaim: string,
  activeChannelClaim: string,
  doOpenModal: (id: string, {}) => void,
  doMembershipList: (params: MembershipListParams) => void,
  membershipIndex: number,
  memberChannelUri: string,
}
export default function MembershipRow(props: Props) {
  const { membershipSub, creatorChannelClaim, activeChannelClaim, doOpenModal, membershipIndex,
    memberChannelUri, doMembershipList } = props;
  function monthsDiff(date1, date2) {
    let d1 = new Date(date1);
    let d2 = new Date(date2);
    return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  }
  const memberChannelName = activeChannelClaim.name;
  const creatorChannelId = membershipSub.membership.channel_claim_id;
  const creatorChannelUri = creatorChannelClaim ?buildURI({
    channelName: creatorChannelClaim.name,
    channelClaimId: creatorChannelId,
  }) : null;
  const creatorChannelPath = creatorChannelUri ? formatLbryUrlForWeb(creatorChannelUri) : '';

  const currency = membershipSub.subscription.current_price
    ? membershipSub.subscription.current_price.currency.toUpperCase() : '';
  const supportAmount = membershipSub.subscription.current_price ? membershipSub.subscription.current_price.amount : ''; // in cents or 1/100th EUR
  const interval = membershipSub.subscription.current_price ? membershipSub.subscription.current_price.frequency : '';

  const startDate = new Date(membershipSub.subscription.started_at);
  const endDate = membershipSub.subscription.ends_at === '0001-01-01T00:00:00Z' ? new Date(Date.now()).toISOString() : new Date(membershipSub.subscription.ends_at);
  const canRenew = membershipSub.subscription.earliest_renewal_at && new Date() > new Date(membershipSub.subscription.earliest_renewal_at);

  const amountOfMonths = monthsDiff(startDate, endDate);

  const paidMonths = membershipSub.payments.filter(m => m.status && (m.status === 'paid' || m.status === 'submitted')).length
  const timeAgoInMonths =
    paidMonths === 1 ? __('1 Month') : __('%time_ago% Months', { time_ago: amountOfMonths });
  React.useEffect(() => {
    if (membershipIndex === -1) {
      doMembershipList({ channel_claim_id: creatorChannelId });
    }
  }, [creatorChannelId, doMembershipList, membershipIndex]);
  if (!creatorChannelClaim || !membershipSub || membershipIndex === -1) {
    return (
      <tr>
        <td colSpan="7">
          <Spinner />
        </td>
      </tr>
    );
  }
  return (
    <tr key={`${membershipSub.membership.channel_claim_id}${membershipSub.membership.name}`}>
      <td className="channelThumbnail">
        <ChannelThumbnail xsmall uri={creatorChannelUri} />
        <ChannelThumbnail
          xxsmall
          uri={memberChannelUri === '' ? undefined : memberChannelUri}
          tooltipTitle={memberChannelName === '' ? __('Anonymous') : memberChannelName}
        />
      </td>

      <td>
        <UriIndicator uri={creatorChannelUri} link />
      </td>

      <td>{membershipSub.membership.name}</td>
      <td>{moment(membershipSub.subscription.ends_at).format('L')}</td>

      <td>{timeAgoInMonths}</td>

      <td>
        {supportAmount ? `$${(supportAmount / 100).toFixed(2)} ${currency} / ${__(toCapitalCase(interval))}` : null}
      </td>
      <td>
        {membershipSub.subscription.status === 'active'
          ? canRenew
            ? (<Button
                icon={ICONS.MEMBERSHIP}
                button="primary"
                label={__('Renew', {
                  membership_price: (membershipSub.subscription.current_price.amount / 100).toFixed(
                    membershipSub?.subscription.current_price.amount < 100 ? 2 : 0
                  ), // tiers
                })}
                onClick={() => {
                  doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri: creatorChannelUri, membershipIndex: membershipIndex, passedTierIndex: membershipIndex, isChannelTab: true, isRenewal: true });
                }}
                disabled={false}
            />)
            : __('Active')
          : membershipSub.subscription.status === 'past_due'
            ? __('Past Due')
            : membershipSub.subscription.status === 'pending'
              ? __('Pending')
              : __('Cancelled')}
      </td>
      <td>
        <span dir="auto" className="button__label">
          <Button
            button="alt"
            icon={ICONS.MEMBERSHIP}
            navigate={creatorChannelPath + '?view=membership'}
          />
        </span>
      </td>
    </tr>
  );
}
