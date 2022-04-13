// @flow
import { Form } from 'component/common/form';
import * as ICONS from 'constants/icons';
import Card from 'component/common/card';
import React from 'react';
import Button from 'component/button';
import JoinMembershipCard from 'component/creatorMemberships/joinMembershipCard';

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
  activeMembershipName: any,
  doMembershipMine: () => void,
  doMembershipDeleteData: () => void,
};

export default function MembershiPChannelTab(props: Props) {
  const {
    uri,
    testMembership,
    isModal,
    // -- redux --
    activeMembershipName,
    doMembershipMine,
    doMembershipDeleteData,
  } = props;

  React.useEffect(() => {
    doMembershipMine();
  }, [doMembershipMine]);

  return (
    <Form style={{ maxHeight: '475px' }}>
      <Card
        title={
          activeMembershipName
            ? __('Your %channel_name% membership', { channel_name: activeMembershipName.Membership.channel_name })
            : undefined
        }
        className={'membership-join'}
        subtitle={
          activeMembershipName ? (
            <>
              <div className="membership__body">
                <h1 className="join-membership-support-time__header">
                  You have been supporting {activeMembershipName?.Membership?.channel_name} for 2 months
                </h1>
                <h1 className="join-membership-support-time__header">I am sure they appreciate it!</h1>
                <h1 className="membership-join__plan-header">
                  Your tier: {activeMembershipName?.MembershipDetails?.name}
                </h1>
                <h1 className="membership-join__plan-description">
                  {activeMembershipName?.MembershipDetails?.description}
                </h1>
                <div className="membership__plan-perks">
                  <h1 style={{ marginTop: '30px' }}>{isModal ? 'Perks:' : 'Perks'}</h1>{' '}
                  {testMembership.perks.map((tierPerk, i) => (
                    <p key={tierPerk}>
                      {perkDescriptions.map(
                        (globalPerk, i) =>
                          tierPerk === globalPerk.perkName && (
                            <ul>
                              <li className="membership-join__perk-item">{globalPerk.perkDescription}</li>
                            </ul>
                          )
                      )}
                    </p>
                  ))}
                </div>

                <h1 className="join-membership-tab-renewal-date__header">
                  Your membership will renew on April 15, 2022 (15 days)
                </h1>

                <Button
                  className="membership-join-purchase__button"
                  icon={ICONS.FINANCE}
                  button="secondary"
                  type="submit"
                  disabled={false}
                  label={`View Membership History`}
                />

                <Button
                  className="membership-join-purchase__button"
                  style={{ 'margin-left': '1rem' }}
                  icon={ICONS.DELETE}
                  button="secondary"
                  type="submit"
                  disabled={false}
                  label={`Cancel Membership`}
                />
              </div>

              {/** clear membership data (only available on dev) **/}
              {isDev && (
                <>
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
                </>
              )}
            </>
          ) : (
            <JoinMembershipCard uri={uri} />
          )
        }
      />
    </Form>
  );
}
