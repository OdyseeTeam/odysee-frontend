// @flow
import React from 'react';
import ChannelThumbnail from 'component/channelThumbnail';
import { Lbryio } from 'lbryinc';
import moment from 'moment';

import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

type Props = {
  // -- redux --
  activeChannelClaim: ?ChannelClaim,
  bankAccountConfirmed: ?boolean,
  doTipAccountStatus: (any) => void,
};

const SupportersTab = (props: Props) => {
  const { activeChannelClaim } = props;

  const [supportersResponse, setSupportersResponse] = React.useState();

  React.useEffect(() => {
    (async function() {
      const response = await Lbryio.call('membership', 'supporters_list', {
        environment: stripeEnvironment,
      });

      l(response);
      setSupportersResponse(response)

    })();
  }, [activeChannelClaim]);

  l(activeChannelClaim);

  return (
    <div className="membership-table__wrapper">
      <table className="table">
        <thead>
          <tr>
            <th className="date-header">{__('Channel Name')}</th>
            <th className="channelName-header">{__('Tier')}</th>
            <th className="location-header">{__('Amount')}</th>
            <th className="amount-header">{__('Joined On')}</th>
            <th className="channelName-header">{__('Months Supporting')}</th>
          </tr>
        </thead>
        <tbody>
            {supportersResponse && supportersResponse.map((supporter, i) => (
              <tr>
                <td>
                  <span dir="auto" className="button__label">
                    {false && <ChannelThumbnail xsmall uri={channelClaim.canonical_url} />}
                    {supporter.ChannelName}
                  </span>
                </td>
                <td>{supporter.MembershipName}</td>
                <td>${supporter.Price / 100} USD / Month</td>
                <td>{moment(new Date(supporter.JoinedAtTime)).format('MMMM Do YYYY')}</td>
                <td>{Math.ceil(moment(new Date()).diff(new Date(supporter.JoinedAtTime), 'months', true))}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default SupportersTab;
