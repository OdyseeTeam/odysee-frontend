// @flow
import { Form } from 'component/common/form';
import * as ICONS from 'constants/icons';
import Card from 'component/common/card';
import React from 'react';
import Button from 'component/button';

type Props = {
  channel: string,
  duration: string,
  membership: { displayName: string, description: string, perks: Array<string> },
};

export default function JoinMembership(props: Props) {
  const { channel, duration, membership, isModal } = props;

  const areSubscribed = true;

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

  return (
    <Form style={{ maxHeight: '475px' }}>
      <Card
        title={`Your ${channel} membership`}
        className={'join-membership-modal'}
        subtitle={
          <>
            <div className="join-membership-modal-information__div">
              <h1 className="join-membership-support-time__header">You have been supporting {channel} for 2 months</h1>
              <h1 className="join-membership-support-time__header">I am sure they appreciate it!</h1>
              <h1 className="join-membership-modal-plan__header">Your tier: {membership.displayName}</h1>
              <h1 className="join-membership-modal-plan__description">{membership.description}</h1>
              <div className="join-membership-modal-perks">
                <h1 style={{ marginTop: '30px' }}>{ isModal ? 'Perks:' : 'Perks' }</h1>                {membership.perks.map((tierPerk, i) => (
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

              <h1 className="join-membership-tab-renewal-date__header">Your membership will renew on April 15, 2022 (15 days)</h1>

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
        }
      />
    </Form>
  );
}
