// @flow
import { Form } from 'component/common/form';
import * as ICONS from 'constants/icons';
import Card from 'component/common/card';
import React from 'react';
import Button from 'component/button';
import { Lbryio } from 'lbryinc';

import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

const isDev = process.env.NODE_ENV !== 'production';

type Props = {
  channel: string,
  duration: string,
  membership: { displayName: string, description: string, perks: Array<string> },
};

export default function JoinMembership(props: Props) {
  const { channel, duration, membership, isModal } = props;

  const [activeMemberships, setActiveMemberships] = React.useState();

  const areSubscribed = true;

  const perkDescriptions = window.created_tiers || [
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

  async function populateMembershipData() {
    try {
      // show the memberships the user is subscribed to
      const response = await Lbryio.call(
        'membership',
        'mine',
        {
          environment: stripeEnvironment,
        },
        'post'
      );

      for (const membership of response) {
        // if it's autorenewing it's considered 'active'
        const isActive = membership?.Membership?.auto_renew;
        if (isActive) {
          setActiveMemberships(membership);
        } else {
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  // clear membership data
  const deleteData = async function () {
    await Lbryio.call(
      'membership',
      'clear',
      {
        environment: 'test',
      },
      'post'
    );
    // $FlowFixMe
    location.reload();
  };

  React.useEffect(() => {
    populateMembershipData();
  }, []);

  return (
    <Form style={{ maxHeight: '475px' }}>
      <Card
        title={
          activeMemberships?.Membership?.channel_name !== `@${channel}`
            ? 'No purchased membership'
            : `Your ${activeMemberships?.Membership?.channel_name} membership`
        }
        className={'join-membership-modal'}
        subtitle={
          <>
            {/*{activeMemberships?.Membership?.channel_name !== `@${channel}` ? (*/}
              {1 == 2 ? (
              <></>
            ) : (
              <>
                <div className="join-membership-modal-information__div">
                  <h1 className="join-membership-support-time__header">
                    You have been supporting {activeMemberships?.Membership?.channel_name} for 2 months
                  </h1>
                  <h1 className="join-membership-support-time__header">I am sure they appreciate it!</h1>
                  <h1 className="join-membership-modal-plan__header">
                    Your tier: {activeMemberships?.MembershipDetails?.name}
                  </h1>
                  <h1 className="join-membership-modal-plan__description">
                    {activeMemberships?.MembershipDetails?.description}
                  </h1>
                  <div className="join-membership-modal-perks">
                    <h1 style={{ marginTop: '30px' }}>{isModal ? 'Perks:' : 'Perks'}</h1>{' '}
                    {membership.perks.map((tierPerk, i) => (
                      <p key={tierPerk}>
                        {perkDescriptions.map(
                          (globalPerk, i) =>
                            tierPerk === globalPerk.perkName && (
                              <ul>
                                <li className="join-membership-modal-perks__li">{globalPerk.perkDescription}</li>
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
                    className="join-membership-modal-purchase__button"
                    icon={ICONS.FINANCE}
                    button="secondary"
                    type="submit"
                    disabled={false}
                    label={`View Membership History`}
                  />

                  <Button
                    className="join-membership-modal-purchase__button"
                    style={{ 'margin-left': '1rem' }}
                    icon={ICONS.DELETE}
                    button="secondary"
                    type="submit"
                    disabled={false}
                    label={`Cancel Membership`}
                  />
                </div>
              </>
            )}

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
                    onClick={deleteData}
                  />
                </div>
              </>
            )}
          </>
        }
      />
    </Form>
  );
}
