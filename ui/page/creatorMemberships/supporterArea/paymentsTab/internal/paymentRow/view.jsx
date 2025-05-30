// @flow
import React from 'react';
import UriIndicator from 'component/uriIndicator';
import ChannelThumbnail from 'component/channelThumbnail';
import { buildURI } from 'util/lbryURI';
import moment from 'moment';

interface IProps {
  transaction: MembershipPayment,
  recipientChannel?: ChannelClaim,
  senderChannel?: ChannelClaim,
  membership: CreatorMembership,
}

// takes a claimId, selects the claim for it
// renders the name, thumb, etc, waits for it
function View(props: IProps) {
  const { membership, transaction, recipientChannel, senderChannel } = props;
  const { name: recipientName, claim_id: recipientClaimId } =  recipientChannel || {};
  const { name: senderName, claim_id: senderClaimId } =  senderChannel || {};
  const recipientUri = recipientChannel
    ? buildURI({
      channelName: recipientName,
      channelClaimId: recipientClaimId })
    : null;

  const senderUri = senderChannel
  ? buildURI({
      channelName: senderName,
      channelClaimId: senderClaimId })
    : null;

  return (
    <tr key={transaction.transaction_id}>
      <td>{moment(new Date(transaction.initiated_at)).format('LLL')}</td>
      <td className="channelThumbnail">
        {recipientUri ? (
          <UriIndicator focusable={false} uri={recipientUri} link>
            <ChannelThumbnail xsmall link uri={recipientUri} />
            <label>{recipientChannel.name}</label>
          </UriIndicator>
        ) : (
          <div>Anon</div>
        )}
      </td>
      <td className="channelThumbnail">
        {senderUri ? (
          <UriIndicator focusable={false} uri={senderUri} link>
            <ChannelThumbnail xsmall link uri={senderUri} />
            <label>{senderChannel.name}</label>
          </UriIndicator>
        ) : (
          <div>Anon</div>
        )}
      </td>
      <td>{membership && membership.name}</td>
      <td>{transaction.usd_amount}</td>
      <td>{transaction.status}</td>
    </tr>
  );
}

export default View;
