// @flow
import React from 'react';
import classnames from 'classnames';

import { v4 as uuid } from 'uuid';

import * as ICONS from 'constants/icons';

import Button from 'component/button';

import MembershipTier from './internal/membershipTier';
import EditingTier from './internal/editingTier';
import HelpHub from 'component/common/help-hub';

type Props = {
  // -- redux --
  bankAccountConfirmed: boolean,
  channelMemberships: CreatorMemberships,
  activeChannelClaim: ?ChannelClaim,
  membershipOdyseePermanentPerks: MembershipOdyseePerks,
  doGetMembershipPerks: (params: MembershipListParams) => Promise<MembershipOdyseePerks>,
  exchangeRate: { [key: string]: number },
};

function TiersTab(props: Props) {
  const {
    // -- redux --
    channelMemberships: fetchedMemberships,
    activeChannelClaim,
    membershipOdyseePermanentPerks,
    doGetMembershipPerks,
    exchangeRate,
  } = props;

  const fetchedMembershipsStr = fetchedMemberships && JSON.stringify(fetchedMemberships);

  const [editingIds, setEditingIds] = React.useState(() => []);
  const [channelMemberships, setChannelMemberships] = React.useState<any>(fetchedMemberships || []);

  function addEditingForMembershipId(membershipId) {
    setEditingIds((previousEditingIds) => {
      const newEditingIds = new Set(previousEditingIds);
      newEditingIds.add(membershipId);

      return Array.from(newEditingIds);
    });
  }

  function removeEditingForMembershipId(membershipId) {
    setEditingIds((previousEditingIds) => {
      const newEditingIds = new Set(previousEditingIds);
      newEditingIds.delete(membershipId);

      return Array.from(newEditingIds);
    });
  }

  function addChannelMembership(membership) {
    setChannelMemberships((previousMemberships) => {
      const newChannelMemberships = new Set(previousMemberships);
      newChannelMemberships.add(membership);

      // sort by price lowest to highest
      return Array.from(newChannelMemberships).sort((a, b) => a.prices[0].amount - b.prices[0].amount);
    });
  }

  function removeChannelMembershipForId(membershipId) {
    setChannelMemberships((previousMemberships) => {
      const newChannelMemberships = previousMemberships.filter(
        (membership) => membership.membership_id !== membershipId
      );

      return newChannelMemberships;
    });
  }

  React.useEffect(() => {
    if (activeChannelClaim) {
      doGetMembershipPerks({ channel_name: activeChannelClaim.name, channel_id: activeChannelClaim.claim_id });
    }
  }, [activeChannelClaim, doGetMembershipPerks]);

  React.useEffect(() => {
    const fetchedMemberships = fetchedMembershipsStr && JSON.parse(fetchedMembershipsStr);
    setChannelMemberships((previousMemberships) => {
      const newEditingIds = new Set(editingIds);
      const newFetchedMemberships = new Set(fetchedMemberships);

      previousMemberships.forEach((membership) => {
        if (newEditingIds.has(membership.membership_id) && typeof membership.membership_id === 'string') {
          // after membership/list fetch, in case there are still local editing ids (clicked create tier twice but
          // only published one for ex) keep the unpublished memberships on the state instead of replacing for the
          // new fetched values which would erase them
          newFetchedMemberships.add(membership);
        }
      });

      return Array.from(newFetchedMemberships);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps -- no need to listen for editing ids
  }, [fetchedMembershipsStr]);

  // if (!bankAccountConfirmed) {
  //   return (
  //     <>
  //       <div className="bank-account-status">
  //         <div>
  //           <label>{__('Bank Account Status')}</label>
  //           <span>{__('You have to connect a bank account before you can create tiers.')}</span>
  //         </div>
  //         <Button
  //           button="primary"
  //           label={__('Connect a bank account')}
  //           icon={ICONS.FINANCE}
  //           navigate={`$/${PAGES.SETTINGS_STRIPE_ACCOUNT}`}
  //         />
  //       </div>
  //     </>
  //   );
  // }

  return (
    <div className={classnames('tier-edit-functionality')}>
      {channelMemberships &&
        channelMemberships
          .filter((m) => m.enabled === true || m.saved === false)
          .map((membershipTier, membershipIndex) => {
            const membershipId = membershipTier.membership_id;
            const isEditing = new Set(editingIds).has(membershipId);
            const hasSubscribers = membershipTier.has_subscribers;

            return (
              <div className="membership-tier__wrapper" key={membershipIndex}>
                {isEditing ? (
                  <EditingTier
                    membership={membershipTier}
                    hasSubscribers={hasSubscribers}
                    removeEditing={() => removeEditingForMembershipId(membershipId)}
                    addChannelMembership={(newMembership) => {
                      removeChannelMembershipForId(membershipId);
                      addChannelMembership(newMembership);
                    }}
                    onCancel={() => {
                      removeEditingForMembershipId(membershipId);

                      if (typeof membershipId === 'string') {
                        removeChannelMembershipForId(membershipId);
                      }
                    }}
                  />
                ) : (
                  <MembershipTier
                    membership={membershipTier}
                    index={membershipIndex}
                    hasSubscribers={hasSubscribers}
                    addEditingId={() => addEditingForMembershipId(membershipId)}
                    removeMembership={() => removeChannelMembershipForId(membershipId)}
                    exchangeRate={exchangeRate}
                  />
                )}
              </div>
            );
          })}

      {(!channelMemberships || channelMemberships.length < 100) /* todo change back to 6? */ && (
        <Button
          button="primary"
          onClick={(e) => {
            const newestId = uuid(); // --> this will only be used locally when creating a new tier

            const newestMembership = {
              has_subscribers: false,
              membership_id: newestId,
              name: __('Example Plan'),
              description: '',
              prices: [{ amount: 1, currency: 'usd', address: '' }],
              perks: membershipOdyseePermanentPerks,
              saved: false,
            };

            addEditingForMembershipId(newestId);
            addChannelMembership(newestMembership);
          }}
          className="add-membership__button"
          label={__('Add Tier for %channel_name%', { channel_name: activeChannelClaim?.name || '' })}
          icon={ICONS.ADD}
        />
      )}

      <HelpHub
        href="https://help.odysee.tv/category-memberships/category-creatorportal/creatingtiers/"
        image="h264"
        text={__('Need some ideas on what tiers to make? Ms. H.264 has lots of ideas in the %help_hub%.')}
      />
    </div>
  );
}

export default TiersTab;
