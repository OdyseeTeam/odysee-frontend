// @flow
import React from 'react';

import { formatDateToMonthAndDay } from 'util/time';

import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';

import Card from 'component/common/card';
import Button from 'component/button';
import JoinMembershipCard from 'component/joinMembershipCard';
import moment from 'moment';
import BalanceText from 'react-balance-text';
import ClearMembershipDataButton from 'component/common/clear-membership-data';

type Props = {
  uri: string,
  // -- redux --
  purchasedChannelMembership: MembershipTier,
  doOpenCancelationModalForMembership: (membership: MembershipTier) => void,
};

const MembershipChannelTab = (props: Props) => {
  const {
    uri,
    // -- redux --
    purchasedChannelMembership,
    doOpenCancelationModalForMembership,
  } = props;

  if (!purchasedChannelMembership) {
    return <JoinMembershipCard uri={uri} />;
  } else {
    delete window.pendingMembership;
  }

  const { Membership, MembershipDetails, Subscription, Perks } = purchasedChannelMembership;

  const { channel_name: creatorChannel } = Membership;
  const { name: membershipName, description: membershipDescription } = MembershipDetails;
  const {
    current_period_start: subscriptionStartDate,
    current_period_end: subscriptionEndDate,
    canceled_at: dateCanceled,
  } = Subscription;

  const membershipIsActive = dateCanceled === 0;
  const startDate = subscriptionStartDate * 1000;
  const endDate = subscriptionEndDate * 1000;

  const amountOfMonths = moment(endDate).diff(moment(startDate), 'months', true);
  const timeAgo = amountOfMonths === 1 ? '1 month' : amountOfMonths + ' months';
  const formattedEndOfMembershipDate = formatDateToMonthAndDay(subscriptionEndDate * 1000);

  return (
    <Card
      title={__('Your %creator_channel_name% membership', { creator_channel_name: creatorChannel })}
      className="membership membership-tab"
      subtitle={
        <p>
          {__(
            membershipIsActive
              ? "You've been supporting %channel_name% for %membership_duration%. "
              : 'You supported %channel_name% for %membership_duration%. ',
            { channel_name: creatorChannel, membership_duration: timeAgo }
          )}
          {__("I'm sure they appreciate it!")}
        </p>
      }
      body={
        <>
          <div className="membership__wrapper">
            <label>{membershipName}</label>

            <p className="subtitle">
              <BalanceText>{membershipDescription}</BalanceText>
            </p>

            {Perks && (
              <div className="membership__tier-perks">
                <label>{__('Perks')}</label>

                <ul>
                  {Perks.map((tierPerk, i) => (
                    <li key={i} className="membership__perk-item">
                      {tierPerk.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <label>
            {membershipIsActive
              ? __('Your membership will renew on %renewal_date%', { renewal_date: formattedEndOfMembershipDate })
              : __('Your cancelled membership will end on %end_date%', { end_date: formattedEndOfMembershipDate })}
          </label>

          <div className="section__actions--centered">
            <Button
              icon={ICONS.FINANCE}
              button="secondary"
              type="submit"
              label={__('View Membership History')}
              navigate={`/$/${PAGES.MEMBERSHIP_BILLING_HISTORY}`}
            />

            {membershipIsActive && (
              <Button
                icon={ICONS.DELETE}
                button="secondary"
                type="submit"
                label={__('Cancel Membership')}
                onClick={() => doOpenCancelationModalForMembership(purchasedChannelMembership)}
              />
            )}
          </div>

          <ClearMembershipDataButton />
        </>
      }
    />
  );
};

export default MembershipChannelTab;
