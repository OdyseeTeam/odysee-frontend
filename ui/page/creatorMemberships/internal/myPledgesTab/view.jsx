/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import React from 'react';
import Button from 'component/button';
import moment from 'moment';
import { formatLbryUrlForWeb } from 'util/url';
import { getThumbnailFromClaim } from 'util/claim';

// eslint-disable-next-line flowtype/no-types-missing-file-annotation
type Props = {
  openModal: (string, {}) => void,
  activeChannelClaim: ?ChannelClaim,
  myActiveMemberships: any,
  claimsById: any,
  doMembershipMine: () => Promise<MembershipTiers>,
  doResolveClaimIds: (a: any) => void,
};

// eslint-disable-next-line flowtype/no-types-missing-file-annotation
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

  React.useEffect(() => {
    if (myActiveMemberships) {
      const claimIds = myActiveMemberships.map((membership) => membership[0].MembershipDetails.channel_id);

      doResolveClaimIds(claimIds).then(() => setResolved(true));
    }
  }, [doResolveClaimIds, myActiveMemberships]);

  React.useEffect(() => {
    if (myActiveMemberships && resolved) {
      const allPledges = myActiveMemberships.map((active) => {
        const membership = active[0];
        const pledgeData = {};
        const fullClaim = claimsById[membership.MembershipDetails.channel_id];

        if (fullClaim?.short_url) {
          pledgeData.url = formatLbryUrlForWeb(fullClaim.short_url);
        }
        pledgeData.thumbnail = getThumbnailFromClaim(fullClaim);
        pledgeData.currency = membership.Subscription.plan.currency.toUpperCase();
        pledgeData.supportAmount = membership.Subscription.plan.amount; // in cents or 1/100th EUR
        pledgeData.period = membership.Subscription.plan.interval;

        const startDate = membership.Subscription.current_period_start * 1000;
        const endDate = membership.Subscription.current_period_end * 1000;
        const amountOfMonths = moment(endDate).diff(moment(startDate), 'months', true);
        pledgeData.timeAgo = amountOfMonths === 1 ? '1 Month' : amountOfMonths + ' Months';

        return pledgeData;
      });

      setPledges(allPledges);
    }
  }, [claimsById, myActiveMemberships, resolved]);

  return (
    <>
      {pledges?.length > 0 && (
        <div className="table__wrapper">
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
              {myActiveMemberships?.map((active, i) => {
                const membership = active[0];
                return (
                  <tr key={i}>
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
                    <td>{pledges[i].timeAgo}</td>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {myActiveMemberships?.length === 0 && (
        <>
          <h1 style={{ marginTop: '10px' }}> You are not currently supporting any creators </h1>

          {/* <h1 style={{ marginTop: '10px' }}> You can find some creators to support on the membership page here </h1> */}
        </>
      )}
    </>
  );
}

export default MyPledgesTab;
/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
