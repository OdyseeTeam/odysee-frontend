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
};

function MyPledgesTab(props: Props) {
  const { myActiveMemberships, claimsById, doMembershipMine } = props;

  function capitalizeFirstLetter(string) {
    return string?.charAt(0).toUpperCase() + string?.slice(1);
  }

  React.useEffect(() => {
    if (myActiveMemberships === undefined) {
      doMembershipMine();
    }
  }, [doMembershipMine, myActiveMemberships]);
;
  return (
    <>
      {myActiveMemberships?.length > 0 && (
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
              {myActiveMemberships?.map((pledge, i) => {
  console.log(pledge);
                return (
                  <>
                    <td>
                      <Button button="link" navigate={pledge.url + '?view=membership'}>
                        <img src={pledge.thumbnail} style={{ maxHeight: '70px', marginRight: '13px' }} />
                        <span dir="auto" className="button__label">
                          {pledge.Membership.channel_name}
                        </span>
                      </Button>
                    </td>
                    <td>{pledge.MembershipDetails.name}</td>
                    {/* TODO: add moment logic here to calculate number of months */}
                    <td>2 Months</td>
                    <td>
                      ${pledge.supportAmount / 100} {pledge.currency} / {capitalizeFirstLetter(pledge.period)}
                    </td>
                    <td>
                      <span dir="auto" className="button__label">
                        <Button button="primary" label={__('See Details')} navigate={pledge.url + '?view=membership'} />
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
