// @flow
import React from 'react';
import { buildURI } from 'util/lbryURI';
import Spinner from 'component/spinner';
import { formatLbryUrlForWeb } from 'util/url';
import ChannelThumbnail from 'component/channelThumbnail';
import UriIndicator from 'component/uriIndicator';
import JoinMembershipButton from 'component/joinMembershipButton';
import { toCapitalCase } from 'util/string';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import * as moment from 'moment';

type Props = {
  membershipSub: MembershipSub,
  creatorChannelClaim: string,
  activeChannelClaim: string,
  doOpenModal: (id: string, {}) => void,
  doMembershipList: (params: MembershipListParams) => void,
  membershipIndex: number,
  creatorChannelUri: string,
}
export default function MembershipRow(props: Props) {
  const { membershipSub, creatorChannelClaim, activeChannelClaim, doOpenModal, membershipIndex, doMembershipList } = props;


  const memberChannelName = activeChannelClaim.name;
  const creatorChannelId = membershipSub.membership.channel_claim_id;
  const creatorChannelUri = creatorChannelClaim ? buildURI({
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

  const paidMonths = membershipSub.payments.filter(m => m.status && (m.status === 'paid' || m.status === 'submitted')).length;
  const monthsSupported =
    paidMonths === 1 ? __('1 Month') : __('%paid_months% Months', { paid_months: paidMonths });
  React.useEffect(() => {
    if (membershipIndex === -1) {
      doMembershipList({ channel_claim_id: creatorChannelId });
    }
  }, [creatorChannelId, doMembershipList, membershipIndex]);

  // TODO refactor status content
  // let buttonContent;
  //
  // const status = membershipSub.subscription.status;
  // if (status === 'active' || status === 'lapsed') {
  //   if (canRenew) {
  //     buttonContent = (<Button
  //       icon={ICONS.MEMBERSHIP}
  //       button="primary"
  //       label={__('Renew', {
  //         membership_price: (membershipSub.subscription.current_price.amount / 100).toFixed(
  //           membershipSub?.subscription.current_price.amount < 100 ? 2 : 0
  //         ), // tiers
  //       })}
  //       onClick={() => {
  //         doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri: creatorChannelUri, membershipIndex: membershipIndex, passedTierIndex: membershipIndex, isChannelTab: true, isRenewal: true });
  //       }}
  //       disabled={false}
  //     />)
  //   } else {
  //     buttonContent = __('Active');
  //   }
  // }
  //
  // if (status === 'pending') {
  //   // check if payment status is submitted...
  // }
  //
  // if (status === 'canceled') {
  //   buttonContent = __('Canceled');
  // }
  //
  //
  //
  //
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
          uri={creatorChannelUri === '' ? undefined : creatorChannelUri}
          tooltipTitle={memberChannelName === '' ? __('Anonymous') : memberChannelName}
        />
      </td>

      <td>
        <UriIndicator uri={creatorChannelUri} link />
      </td>

      <td>{membershipSub.membership.name}</td>
      <td>{moment(membershipSub.subscription.ends_at).format('L')}</td>

      <td>{monthsSupported}</td>

      <td>
        {supportAmount ? `$${(supportAmount / 100).toFixed(2)} ${currency} / ${__(toCapitalCase(interval))}` : null}
      </td>
      <td>
        {membershipSub.subscription.status === 'active'
          ? canRenew
            ? (<JoinMembershipButton uri={creatorChannelUri} />)
            : __('Active')
          : membershipSub.subscription.status === 'lapsed'
            ? __('Past Due')
            : membershipSub.subscription.status === 'pending'
              ? __('Pending')
              : __('Canceled')}
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
