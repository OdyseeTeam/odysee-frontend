// @flow
import React from 'react';
import Button from 'component/button';
import moment from 'moment';
import { formatLbryUrlForWeb } from 'util/url';
import { getThumbnailFromClaim } from 'util/claim';
import { buildURI } from 'util/lbryURI';
import ChannelThumbnail from 'component/channelThumbnail';
import * as ICONS from 'constants/icons';

type Props = {
  openModal: (string, {}) => void,
  activeChannelClaim: ?ChannelClaim,
  myPurchasedMemberships: any,
  claimsById: any,
  doMembershipMine: () => Promise<MembershipTiers>,
  doResolveClaimIds: (a: any) => Promise<any>,
};

function PledgesTab(props: Props) {
  const { myPurchasedMemberships, claimsById, doMembershipMine, doResolveClaimIds } = props;
  // TODO: this should probably be fixed in the selector
  let formattedMemberships = [];
  if (myPurchasedMemberships.length) {
    for (const creator of myPurchasedMemberships) {
      // filter out odysee, probably also to be fixed in selector
      if (creator[0].MembershipDetails.channel_name !== '@odysee') {
        formattedMemberships.push(creator[0]);
      }
    }
  }

  const [pledges, setPledges] = React.useState([]);
  const [resolved, setResolved] = React.useState();

  function capitalizeFirstLetter(string) {
    if (string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  }

  React.useEffect(() => {
    if (myPurchasedMemberships === undefined) {
      doMembershipMine();
    }
  }, [doMembershipMine, myPurchasedMemberships]);

  React.useEffect(() => {
    if (myPurchasedMemberships) {
      const claimIds = myPurchasedMemberships.map((membership) => membership[0].MembershipDetails.channel_id);
      doResolveClaimIds(claimIds).then(() => setResolved(true));
    }
  }, [doResolveClaimIds, myPurchasedMemberships]);

  React.useEffect(() => {
    if (myPurchasedMemberships && resolved) {
      const allPledges = myPurchasedMemberships.map((active) => {
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
        pledgeData.timeAgoInMonths = amountOfMonths === 1 ? '1 Month' : amountOfMonths + ' Months';

        return pledgeData;
      });

      setPledges(allPledges);
    }
  }, [claimsById, myPurchasedMemberships, resolved]);

  return (
    <div className="membership__mypledges-wrapper">
      <div className="membership__mypledges-header">
        <div />
        {/* <label>Donor Portal</label> */}
      </div>

      <div className="membership__mypledges-content">
        {pledges && pledges.length > 0 && (
          <div className="membership-table__wrapper">
            <table className="table table--pledges">
              <thead>
                <tr>
                  <th>Channel Name</th>
                  <th>Tier</th>
                  <th>Time Total</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Page</th>
                </tr>
              </thead>
              <tbody>
                {/* this logic looks strange, selector should probably be improved */}
                {formattedMemberships &&
                  formattedMemberships.map((membership, i) => (
                    <tr key={i}>
                      <td>
                        <ChannelThumbnail xsmall uri={'lbry:/' + pledges[i].url} />
                        <ChannelThumbnail
                          xxsmall
                          uri={
                            membership.Membership.channel_id === ''
                              ? undefined
                              : buildURI({
                                  channelName: membership.Membership.channel_name,
                                  channelClaimId: membership.Membership.channel_id,
                                })
                          }
                          tooltipTitle={
                            membership.Membership.channel_name === ''
                              ? __('Anonymous')
                              : membership.Membership.channel_name
                          }
                        />
                        <Button
                          button="link"
                          navigate={pledges[i].url + '?view=membership'}
                          label={membership.MembershipDetails.channel_name}
                        />
                      </td>
                      <td>{membership.MembershipDetails.name}</td>
                      <td>{pledges[i].timeAgoInMonths}</td>
                      <td>
                        ${pledges[i].supportAmount / 100} {pledges[i].currency} /{' '}
                        {capitalizeFirstLetter(pledges[i].period)}
                      </td>
                      <td>{membership.Subscription.status === 'active' ? __('Active') : __('Cancelled')}</td>
                      <td>
                        <span dir="auto" className="button__label">
                          <Button
                            button="primary"
                            icon={ICONS.UPGRADE}
                            navigate={pledges[i].url + '?view=membership'}
                          />
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {formattedMemberships?.length === 0 && (
          <div className="bank-account-status">
            <div>
              <label>{__('You are not currently supporting any creators')}</label>
              <span>{__(`Find creators that you like and support them. Your pledges will show up on this page.`)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default PledgesTab;
