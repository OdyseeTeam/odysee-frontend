// @flow
import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import Card from 'component/common/card';
import React from 'react';
import Button from 'component/button';
import JoinMembershipCard from 'component/creatorMemberships/joinMembershipCard';
import { formatDateToMonthAndDay, getTimeAgoStr } from 'util/time';
import moment from 'moment';

const isDev = process.env.NODE_ENV !== 'production';

const perkDescriptions = [
  {
    perkName: 'exclusiveAccess',
    perkDescription: 'You have exclusive access to members-only content',
  },
  {
    perkName: 'earlyAccess',
    perkDescription: 'You have early access to this creators content',
  },
  {
    perkName: 'badge',
    perkDescription: 'You have a generic badge showing you are a supporter of this creator',
  },
  {
    perkName: 'emojis',
    perkDescription: 'You have access to custom members-only emojis offered by the creator',
  },
  {
    perkName: 'custom-badge',
    perkDescription: 'You can choose a custom badge showing you are an MVP supporter',
  },
];

type Props = {
  uri: string,
  testMembership: { displayName: string, description: string, perks: Array<string> },
  isModal: boolean,
  // -- redux --
  channelId: string,
  activeChannelMembership: any,
  myActiveMemberships: any,
  doMembershipMine: () => void,
  doMembershipDeleteData: () => void,
  openModal: (id: string, {}) => void,
};

export default function MembershipChannelTab(props: Props) {
  const {
    uri,
    testMembership,
    isModal,
    channelId,
    // -- redux --
    activeChannelMembership,
    myActiveMemberships,
    doMembershipMine,
    doMembershipDeleteData,
    openModal,
  } = props;

  React.useEffect(() => {
    if (myActiveMemberships === undefined) {
      doMembershipMine();
    }
  }, [doMembershipMine, myActiveMemberships]);

  if (!activeChannelMembership) {
    return <JoinMembershipCard uri={uri} isChannelTab />;
  }

  const { Membership, MembershipDetails, Subscription } = activeChannelMembership;
  const { channel_name: channelName } = Membership;

  const startDate = Subscription.current_period_start * 1000;
  const endDate = Subscription.current_period_end * 1000;
  const amountOfMonths = moment(endDate).diff(moment(startDate), 'months', true);
  const timeAgo = amountOfMonths === 1 ? '1 month' : amountOfMonths + ' months';

  return (
    <Card
      title={__('Your %channel_name% membership', { channel_name: channelName })}
      className="membership membership-tab"
      subtitle={
        <>
          <h1 className="join-membership-support-time__header">
            {__('You have been supporting %channel_name% for %membership_duration%', {
              channel_name: channelName,
              membership_duration: timeAgo,
            })}
          </h1>
          <h1 className="join-membership-support-time__header">{__('I am sure they appreciate it!')}</h1>
        </>
      }
      body={
        <>
          <div className="membership__body">
            <h1 className="membership__plan-header">{MembershipDetails.name}</h1>

            <h1 className="membership__plan-description">{MembershipDetails.description}</h1>

            <div className="membership__plan-perks">
              <h1 style={{ marginTop: '30px' }}>{isModal ? 'Perks:' : 'Perks'}</h1>{' '}
              {testMembership.perks.map((
                tierPerk,
                i // TODO: need this to come from API
              ) => (
                <p key={tierPerk}>
                  {perkDescriptions.map(
                    (globalPerk, i) =>
                      tierPerk === globalPerk.perkName && (
                        <ul>
                          <li className="membership__perk-item">{globalPerk.perkDescription}</li>
                        </ul>
                      )
                  )}
                </p>
              ))}
            </div>

            <h1 className="join-membership-tab-renewal-date__header">
              {__('Your membership will renew on %renewal_date%', {
                renewal_date: formatDateToMonthAndDay(Subscription.current_period_end * 1000),
              })}
            </h1>

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

              <Button
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
                  openModal(MODALS.CANCEL_CREATOR_MEMBERSHIP, {});
                }}
              />
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
                    onClick={doMembershipDeleteData}
                  />
                </div>
              </section>
            )}
          </div>
        </>
      }
    />
  );
}
