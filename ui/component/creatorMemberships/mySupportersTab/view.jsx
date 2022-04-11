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


let stripeEnvironment = getStripeEnvironment();

type Props = {
  openModal: (string, {}) => void,
  activeChannelClaim: ?ChannelClaim,
};

function CreatorMembershipsTab(props: Props) {
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

  // TODO: replace with API call
  const yourSupporters = [{
    channelName: '@test35234',
    tierName: 'Community MVP',
    supportAmountPerMonth: '20',
    currency: 'USD',
    monthsOfSupport: 2,
  }];

  return (
    <table className="table table--transactions">
      <thead>
      <tr>
        <th className="date-header">Supporter Channel Name</th>
        <th className="channelName-header">Membership Tier</th>
        <th className="location-header">Support Amount</th>
        <th className="channelName-header">Total Supporting Time</th>
        <th className="amount-header">Details</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        {yourSupporters.map((supporter, i) => (
          <>
            <td><span dir="auto" className="button__label">@test35234</span></td>
            <td>Community MVP</td>
            <td>$20 USD / Month</td>
            <td>2 Months</td>
            <td><span dir="auto" className="button__label">See Details</span></td>
          </>
        ))}
      </tr>
      </tbody>
    </table>
  );
};

export default CreatorMembershipsTab;
