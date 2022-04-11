/* eslint-disable no-console */
// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import Button from 'component/button';
import { useHistory } from 'react-router';
import { FormField } from 'component/common/form';
import moment from 'moment';
import { URL } from '../../../../config';
import ChannelSelector from 'component/channelSelector';
import { formatLbryUrlForWeb } from 'util/url';
import CopyableText from 'component/copyableText';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
import { getThumbnailFromClaim } from 'util/claim';

let stripeEnvironment = getStripeEnvironment();

type Props = {
  openModal: (string, {}) => void,
  activeChannelClaim: ?ChannelClaim,
};

function MyPledgesTab(props: Props) {
  const {
    openModal,
    activeChannelClaim,
    doToast,
    claim,
    doResolveClaimIds,
    claimsById,
  } = props;

  const {
    location: { search },
    push,
  } = useHistory();

  const [myMemberships, setMyMemberships] = React.useState([]);

  React.useEffect(() => {
    (async function() {
      const response = await Lbryio.call(
        'membership',
        'mine',
        {
          environment: stripeEnvironment,
        },
        'post'
      );

      let pledges = [];

      let channelIdsToResolve = [];

      for (const membership of response) {
        const receivedMembership = {
          channelName: membership.Membership.channel_name,
          tierName: membership.MembershipDetails.name,
          currency: membership.Subscription.plan.currency.toUpperCase(),
          supportAmount: membership.Subscription.plan.amount, // in cents or 1/100th EUR
          period: membership.Subscription.plan.interval,
          channelId: membership.MembershipDetails.channel_id,
        };

        console.log(receivedMembership);
        pledges.push(receivedMembership);
        channelIdsToResolve.push(membership.MembershipDetails.channel_id);
      }

      await doResolveClaimIds(channelIdsToResolve);

      console.log('running here');

      // add the full url from the claim
      pledges = pledges.map(function(pledge) {
        const fullClaim = claimsById[pledge.channelId];
        console.log(fullClaim);
        if (fullClaim.short_url) {
          pledge.url = formatLbryUrlForWeb(fullClaim.short_url);
        }
        pledge.thumbnail = getThumbnailFromClaim(fullClaim);
        return pledge;
      });

      setMyMemberships(pledges);
    })();
  }, []);

  // TODO: replace with API call
  const yourPledges = myMemberships;

  return (
    <>
      { myMemberships.length > 0 && (
        <table className="table table--transactions">
          <thead>
          <tr>
            <th className="date-header">Channel You're Supporting</th>
            <th className="channelName-header">Membership Tier</th>
            <th className="channelName-header">Total Supporting Time</th>
            <th className="location-header">Support Amount</th>
            <th className="amount-header">Details</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            {myMemberships.map((pledge, i) => (
              <>
                <td>
                  <Button button="link" navigate={pledge.url + '?view=membership'}>
                    <img src={pledge.thumbnail} style={{ maxHeight: '70px', marginRight: '13px' }}/>
                    <span dir="auto" className="button__label">{pledge.channelName}</span>
                  </Button>
                </td>
                <td>{pledge.tierName}</td>
                <td>{pledge.channelName}</td>
                <td>${pledge.supportAmount / 100} {pledge.currency} / {capitalizeFirstLetter(pledge.period)}</td>
                <td><span dir="auto" className="button__label"><Button button="primary" label={__('See Details')} navigate={pledge.url + '?view=membership'} /></span></td>
              </>
            ))}
          </tr>
          </tbody>
        </table>
      )}

      { yourPledges.length === 0 && (
        <>
          <h1 style={{ marginTop: '10px' }}> You are not currently supporting any creators </h1>

          <h1 style={{ marginTop: '10px' }}> When you do join a membership you will be able to see it here </h1>

          {/* <h1 style={{ marginTop: '10px' }}> You can find some creators to support on the membership page here </h1> */}
        </>
      )}
    </>
  );
};

export default MyPledgesTab;
