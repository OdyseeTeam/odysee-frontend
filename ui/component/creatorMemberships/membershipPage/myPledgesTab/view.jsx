/* eslint-disable no-console */
// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import Button from 'component/button';
import { useHistory } from 'react-router';
import { FormField } from 'component/common/form';
import moment from 'moment';
import { URL } from '../../../../../config';
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
  myActiveMemberships: any,
  claimsById: any,
  doMembershipMine: () => void,
  doResolveClaimIds: (a: any) => void,
};

function MyPledgesTab(props: Props) {
  const { myActiveMemberships, claimsById, doMembershipMine, doResolveClaimIds } = props;

  const [pledges, setPledges] = React.useState();
  const [resolved, setResolved] = React.useState();

  function capitalizeFirstLetter(string) {
    return string?.charAt(0).toUpperCase() + string?.slice(1);
  }

  React.useEffect(() => {
    if (myActiveMemberships === undefined) {
      doMembershipMine();
    }
  }, [doMembershipMine, myActiveMemberships]);

  console.log(myActiveMemberships);

  React.useEffect(() => {
    if (myActiveMemberships) {
      const claimIds = myActiveMemberships.map((membership) => membership.Membership.channel_id);

      doResolveClaimIds(claimIds).then(() => setResolved(true));
    }
  }, [doResolveClaimIds, myActiveMemberships]);

  React.useEffect(() => {
    if (myActiveMemberships && resolved) {
      const allPledges = myActiveMemberships.map((membership) => {
        const pledgeData = {};
        const fullClaim = claimsById[membership.Membership.channel_id];

        if (fullClaim?.short_url) {
          pledgeData.url = formatLbryUrlForWeb(fullClaim.short_url);
        }
        pledgeData.thumbnail = getThumbnailFromClaim(fullClaim);
        pledgeData.currency = membership.Subscription.plan.currency.toUpperCase();
        pledgeData.supportAmount = membership.Subscription.plan.amount; // in cents or 1/100th EUR
        pledgeData.period = membership.Subscription.plan.interval;

        return pledgeData;
      });

      setPledges(allPledges);
    }
  }, [claimsById, myActiveMemberships, resolved]);

  return (
    <>
      {pledges?.length > 0 && (
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
              {myActiveMemberships?.map((membership, i) => {
                return (
                  <>
                    <td>
                      <Button button="link" navigate={pledges[i].url + '?view=membership'}>
                        <img src={pledges[i].thumbnail} style={{ maxHeight: '70px', marginRight: '13px' }} />
                        <span dir="auto" className="button__label">
                          {membership.Membership.channel_name}
                        </span>
                      </Button>
                    </td>
                    <td>{membership.MembershipDetails.name}</td>
                    {/* TODO: add moment logic here to calculate number of months */}
                    <td>2 Months</td>
                    <td>
                      ${pledges[i].supportAmount / 100} {pledges[i].currency} /{' '}
                      {capitalizeFirstLetter(pledges[i].period)}
                    </td>
                    <td>
                      <span dir="auto" className="button__label">
                        <Button
                          button="primary"
                          label={__('See Details')}
                          navigate={pledges[i].url + '?view=membership'}
                        />
                      </span>
                    </td>
                  </>
                );
              })}
            </tr>
          </tbody>
        </table>
      )}

      {myActiveMemberships?.length === 0 && (
        <>
          <h1 style={{ marginTop: '10px' }}> You are not currently supporting any creators </h1>

          <h1 style={{ marginTop: '10px' }}> When you do join a membership you will be able to see it here </h1>

          {/* <h1 style={{ marginTop: '10px' }}> You can find some creators to support on the membership page here </h1> */}
        </>
      )}
    </>
  );
}

export default MyPledgesTab;
