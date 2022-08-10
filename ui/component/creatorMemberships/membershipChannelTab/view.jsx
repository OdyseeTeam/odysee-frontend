// @flow
import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import Card from 'component/common/card';
import React from 'react';
import Button from 'component/button';
import JoinMembershipCard from 'component/creatorMemberships/joinMembershipCard';
import { formatDateToMonthAndDay } from 'util/time';
import moment from 'moment';
import { getStripeEnvironment } from 'util/stripe';
import BalanceText from 'react-balance-text';
import { doMembershipClearData } from 'util/memberships';

let stripeEnvironment = getStripeEnvironment();

const isDev = stripeEnvironment === 'test';

type Props = {
  uri: string,
  testMembership: { displayName: string, description: string, perks: Array<string> },
  isModal: boolean,
  // -- redux --
  channelId: string,
  activeChannelMembership: any,
  myActiveMemberships: any,
  doMembershipMine: () => void,
  openModal: (id: string, {}) => void,
  purchasedChannelMembership: any,
};

export default function MembershipChannelTab(props: Props) {
  const {
    uri,
    testMembership,
    isModal,
    channelId,
    // -- redux --
    myActiveMemberships,
    doMembershipMine,
    openModal,
    purchasedChannelMembership,
  } = props;

  React.useEffect(() => {
    if (myActiveMemberships === undefined) {
      doMembershipMine();
    }
  }, [doMembershipMine, myActiveMemberships]);

  if (!purchasedChannelMembership) {
    return <JoinMembershipCard uri={uri} isChannelTab />;
  }

  const { Membership, MembershipDetails, Subscription, Perks } = purchasedChannelMembership;
  const { channel_name: channelName } = Membership;

  const startDate = Subscription.current_period_start * 1000;
  const endDate = Subscription.current_period_end * 1000;
  const amountOfMonths = moment(endDate).diff(moment(startDate), 'months', true);
  const timeAgo = amountOfMonths === 1 ? '1 month' : amountOfMonths + ' months';
  const formattedEndOfMembershipDate = formatDateToMonthAndDay(Subscription.current_period_end * 1000);

  const membershipisActive = Membership.auto_renew;

  const supportingPeriodString =
    membershipisActive ? 'You\'ve been supporting %channel_name% for %membership_duration%'
    : 'You supported %channel_name% for %membership_duration%';

  return (
    <>
      <Card
        title={__('Your %channel_name% membership', { channel_name: channelName })}
        className="membership membership-tab"
        subtitle={
          <>
            <h1 className="join-membership-support-time__header">
              {__(supportingPeriodString, {
                channel_name: channelName,
                membership_duration: timeAgo,
              })}
            </h1>
            <h1 className="join-membership-support-time__header">{__('I\'m sure they appreciate it!')}</h1>
          </>
        }
        body={
          <>
            <div className="membership__body">
              <h1 className="membership__plan-header">{MembershipDetails.name}</h1>

              <h1 className="membership__plan-description">
                <BalanceText>
                  {MembershipDetails.description}
                </BalanceText>
              </h1>

              { Perks && (<div className="membership__plan-perks">
                <h1 style={{ marginTop: '30px' }}>{isModal ? 'Perks:' : 'Perks'}</h1>{' '}
                {Perks.map((
                  tierPerk,
                  i // TODO: need this to come from API
                ) => (
                  <p key={tierPerk}>
                    <ul>
                      <li className="membership__perk-item">{tierPerk.name}</li>
                    </ul>
                  </p>
                ))}
              </div>)}

              <h1 className="join-membership-tab-renewal-date__header">
                {__('Your %active_or_cancelled% membership will %renew_or_end% on %renewal_date%', {
                  renewal_date: formattedEndOfMembershipDate,
                  renew_or_end: membershipisActive ? 'renew' : 'end',
                  active_or_cancelled: membershipisActive ? '' : 'cancelled',
                })}
              </h1>

              <h1>{}</h1>

              <div className="section__actions--centered">
                <Button
                  className="join-membership-modal-purchase__button"
                  icon={ICONS.FINANCE}
                  button="secondary"
                  type="submit"
                  disabled={false}
                  label={`View Membership History`}
                  navigate={`/${channelId}/membership_history`}
                />

                {membershipisActive && <Button
                  className="join-membership-modal-purchase__button"
                  style={{ 'margin-left': '1rem' }}
                  icon={ICONS.DELETE}
                  button="secondary"
                  type="submit"
                  disabled={false}
                  label={`Cancel Membership`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openModal(MODALS.CANCEL_CREATOR_MEMBERSHIP, {
                      endOfMembershipDate: formattedEndOfMembershipDate,
                      membershipId: Membership.membership_id,
                    });
                  }}
                />}
              </div>

              {/** clear membership data (only available on dev) **/}
              {isDev && (
                <section
                  style={{
                    display: 'flex',
                    'flex-direction': 'column',
                    'align-items': 'center',
                  }}
                >
                  <h1 style={{ marginTop: '30px', fontSize: '20px' }}>Clear Membership Data (Only Available On Dev)</h1>
                  <div>
                    <Button
                      button="primary"
                      label="Clear Membership Data"
                      icon={ICONS.SETTINGS}
                      className="membership_button"
                      onClick={doMembershipClearData}
                    />
                  </div>
                </section>
              )}
            </div>
          </>
        }
      />
    </>
  );
}
