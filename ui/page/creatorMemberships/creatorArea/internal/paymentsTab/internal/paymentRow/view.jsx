// @flow
import React from 'react';
import UriIndicator from 'component/uriIndicator';
import ChannelThumbnail from 'component/channelThumbnail';
import { buildURI } from 'util/lbryURI';
import moment from 'moment';
import CopyableText from 'component/copyableText';
import Tooltip from 'component/common/tooltip';
import { toCapitalCase } from 'util/string';
import Button from 'component/button';
interface IProps {
  transaction: MembershipPayment;
  recipientChannel?: ChannelClaim;
  senderChannel?: ChannelClaim;
  membership: CreatorMembership;
  longList: boolean;
}

// takes a claimId, selects the claim for it
// renders the name, thumb, etc, waits for it
function View(props: IProps) {
  const { longList, membership, transaction, recipientChannel, senderChannel } = props;
  const { name: recipientName, claim_id: recipientClaimId } = recipientChannel || {};
  const { name: senderName, claim_id: senderClaimId } = senderChannel || {};

  const recipientUri = recipientChannel
    ? buildURI({
        channelName: recipientName,
        channelClaimId: recipientClaimId,
      })
    : null;

  const senderUri = senderChannel
    ? buildURI({
        channelName: senderName,
        channelClaimId: senderClaimId,
      })
    : null;

  return (
    <tr key={transaction.transaction_id}>
      <td>
        <Tooltip title={moment(new Date(transaction.initiated_at)).format('LLL')}>
          <div>{moment(new Date(transaction.initiated_at)).format('LL')}</div>
        </Tooltip>
      </td>
      <td className="channelThumbnail">
        {recipientUri ? (
          longList ? (
            <Button button={'link'} label={recipientName} navigate={recipientUri} />
          ) : (
            <UriIndicator focusable={false} uri={recipientUri} link>
              <ChannelThumbnail xsmall link uri={recipientUri} />
              <label>{recipientChannel?.name}</label>
            </UriIndicator>
          )
        ) : (
          <div>Anon</div>
        )}
      </td>
      <td className="channelThumbnail">
        {senderUri ? (
          longList ? (
            <Button button={'link'} label={senderName} navigate={senderUri} />
          ) : (
            <UriIndicator focusable={false} uri={senderUri} link>
              <ChannelThumbnail xsmall link uri={senderUri} />
              <label>{senderChannel?.name}</label>
            </UriIndicator>
          )
        ) : (
          <div>Anon</div>
        )}
      </td>
      <td>{membership && membership.name}</td>
      <td className="payment-txid">
        {!transaction.transaction_id.startsWith('in_') && (
          <CopyableText hideValue linkTo={`https://viewblock.io/arweave/tx/`} copyable={transaction.transaction_id} />
        )}
      </td>
      <td>${(transaction.usd_amount / 100).toFixed(2)} USD</td>
      <td>{transaction.status ? toCapitalCase(transaction.status) : '...'}</td>
    </tr>
  );
}

export default View;
