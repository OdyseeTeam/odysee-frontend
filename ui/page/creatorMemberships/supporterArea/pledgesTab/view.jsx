// @flow
import React from 'react';
import Button from 'component/button';
import moment from 'moment';

import { formatLbryUrlForWeb } from 'util/url';
import { toCapitalCase } from 'util/string';
import { buildURI } from 'util/lbryURI';

import ChannelThumbnail from 'component/channelThumbnail';
import * as ICONS from 'constants/icons';
import Yrbl from 'component/yrbl';
import Spinner from 'component/spinner';
import UriIndicator from 'component/uriIndicator';

type Props = {
  // -- redux --
  myMembershipSubs: Array<MembershipTiers>,
  isFetchingMembershipSubs: boolean,
  doMembershipMine: () => Promise<MembershipTiers>,
};

function PledgesTab(props: Props) {
  const { myMembershipSubs, isFetchingMembershipSubs, doMembershipMine } = props;

  React.useEffect(() => {
    if (myMembershipSubs === undefined) {
      doMembershipMine();
    }
  }, [doMembershipMine, myMembershipSubs]);

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
                <th>{__('Total Supporting Time')}</th>
                <th>{__('Amount')}</th>
                <th>{__('Status')}</th>
                <th className="membership-table__page">{__('Page')}</th>
              </tr>
            </thead>
            <tbody>
              {myMembershipSubs.map((membershipSubs) =>
                membershipSubs.map((membershipSub) => {
                  const memberChannelName = membershipSub.Membership.channel_name;
                  const memberChannelUri =
                    memberChannelName === ''
                      ? ''
                      : buildURI({ channelName: memberChannelName, channelClaimId: membershipSub.Membership.channel_id });

                  const creatorChannelId = membershipSub.MembershipDetails.channel_id;
                  const creatorChannelUri = buildURI({
                    channelName: membershipSub.MembershipDetails.channel_name,
                    channelClaimId: creatorChannelId,
                  });
                  const creatorChannelPath = formatLbryUrlForWeb(creatorChannelUri);

                  const currency = membershipSub.current_price.currency.toUpperCase();
                  const supportAmount = membershipSub.current_price.amount; // in cents or 1/100th EUR
                  const interval = membershipSub.current_price.frequency;

                  const startDate = membershipSub.subscription.started_at * 1000;
                  const endDate = membershipSub.subscription.ends_at * 1000 || Date.now();
                  const amountOfMonths = Math.ceil(moment(endDate).diff(moment(startDate), 'months', true));
                  const timeAgoInMonths =
                    amountOfMonths === 1 ? __('1 Month') : __('%time_ago% Months', { time_ago: amountOfMonths });

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

                      <td>{timeAgoInMonths}</td>

                      <td>
                        ${supportAmount / 100} {currency} / {__(toCapitalCase(interval))}
                      </td>

                      <td>
                        {membershipSub.subscription.status === 'active'
                          ? __('Active')
                          : membershipSub.subscription.status === 'past_due'
                          ? __('Past Due')
                          : __('Cancelled')}
                      </td>

                      <td>
                        <span dir="auto" className="button__label">
                          <Button
                            button="primary"
                            icon={ICONS.MEMBERSHIP}
                            navigate={creatorChannelPath + '?view=membership'}
                          />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default PledgesTab;
