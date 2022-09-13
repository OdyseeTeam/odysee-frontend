// @flow
import React from 'react';
import classnames from 'classnames';

import { v4 as uuid } from 'uuid';

import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';

import MembershipTier from './internal/membershipTier';
import EditingTier from './internal/editingTier';

type Props = {
  channelsToList: ?Array<ChannelClaim>,
  // -- redux --
  bankAccountConfirmed: boolean,
  membershipsByChannelId: CreatorMemberships,
  doGetMembershipPerks: (params: MembershipListParams) => Promise<MembershipPerks>,
  doMembershipList: (params: MembershipListParams) => Promise<CreatorMemberships>,
};

function TiersTab(props: Props) {
  const {
    channelsToList,
    // -- redux --
    bankAccountConfirmed,
    membershipsByChannelId: fetchedMemberships,
    doGetMembershipPerks,
    doMembershipList,
  } = props;

  const channelsToListStr = channelsToList && JSON.stringify(channelsToList);
  const fetchedMembershipsStr = fetchedMemberships && JSON.stringify(fetchedMemberships);

  const [editingIds, setEditingIds] = React.useState(() => []);
  const [membershipsByChannelId, setMembershipsByChannelId] = React.useState(fetchedMemberships || {});

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

  function addMembershipForChannelId(channelId, membership) {
    setMembershipsByChannelId((previousMembershipsByChannelId) => {
      const newChannelMemberships = new Set(previousMembershipsByChannelId[channelId]);
      newChannelMemberships.add(membership);

      const newMembershipsByChannelId = Object.assign({}, previousMembershipsByChannelId);
      newMembershipsByChannelId[channelId] = Array.from(newChannelMemberships);

      return newMembershipsByChannelId;
    });
  }

  function removeChannelMembershipForId(channelId, membershipId) {
    setMembershipsByChannelId((previousMembershipsByChannelId) => {
      const newChannelMemberships = previousMembershipsByChannelId[channelId];
      const filtered = newChannelMemberships.filter((membership) => membership.Membership.id !== membershipId);

      const newMembershipsByChannelId = Object.assign({}, previousMembershipsByChannelId);
      newMembershipsByChannelId[channelId] = filtered;

      return newMembershipsByChannelId;
    });
  }

  React.useEffect(() => {
    if (channelsToListStr) {
      const channelsToList = JSON.parse(channelsToListStr);

      channelsToList.forEach((channel) => {
        doGetMembershipPerks({ channel_name: channel.name, channel_id: channel.claim_id });
        doMembershipList({ channel_name: channel.name, channel_id: channel.claim_id });
      });
    }
  }, [channelsToListStr, doGetMembershipPerks, doMembershipList]);

  React.useEffect(() => {
    if (fetchedMembershipsStr) {
      const fetchedMemberships = JSON.parse(fetchedMembershipsStr);
      setMembershipsByChannelId(fetchedMemberships);
    }
  }, [fetchedMembershipsStr]);

  if (!bankAccountConfirmed) {
    return (
      <>
        <div className="bank-account-status">
          <div>
            <label>{__('Bank Account Status')}</label>
            <span>{__('You have to connect a bank account before you can create tiers.')}</span>
          </div>
          <Button
            button="primary"
            label={__('Connect a bank account')}
            icon={ICONS.FINANCE}
            navigate={`$/${PAGES.SETTINGS_STRIPE_ACCOUNT}`}
          />
        </div>
      </>
    );
  }

  return (
    <div className={classnames('tier-edit-functionality', { 'edit-functionality-disabled': !bankAccountConfirmed })}>
      {Object.values(channelsToList).map((channel) => {
        const channelId = channel.claim_id;
        const channelMemberships = membershipsByChannelId[channelId];
        const channelName = channelsToList.find((channel) => channel.claim_id === channelId)?.name;

        return (
          <>
            {/*<h1>{channelMemberships && channelName}</h1>*/}

            {channelMemberships
              ? channelMemberships.map((membershipTier, membershipIndex) => {
                  const membershipId = membershipTier.Membership.id;
                  const isEditing = new Set(editingIds).has(membershipId);
                  const hasSubscribers = membershipTier.HasSubscribers;

                  return (
                    <div className="membership-tier__wrapper" key={membershipIndex}>
                      {isEditing ? (
                        <EditingTier
                          channelsToList={channelsToList}
                          channelId={channelId}
                          membership={membershipTier}
                          hasSubscribers={hasSubscribers}
                          removeEditing={() => removeEditingForMembershipId(membershipId)}
                          onCancel={() => {
                            removeEditingForMembershipId(membershipId);

                            if (typeof membershipId === 'string') {
                              removeChannelMembershipForId(channelId, membershipId);
                            }
                          }}
                        />
                      ) : (
                        <MembershipTier
                          membership={membershipTier}
                          index={membershipIndex}
                          hasSubscribers={hasSubscribers}
                          addEditingId={() => addEditingForMembershipId(membershipId)}
                          removeMembership={() => removeChannelMembershipForId(channelId, membershipId)}
                        />
                      )}
                    </div>
                  );
                })
              : Object.values(channelsToList).length === 1 && (
                  <Button
                    button="primary"
                    onClick={(e) => {
                      const newestId = uuid(); // --> this will only be used locally when creating a new tier

                      const newestMembership = {
                        Membership: { id: newestId, name: 'Example Plan', description: '' },
                        NewPrices: [{ Price: { amount: 500 } }],
                        saved: false,
                      };

                      addEditingForMembershipId(newestId);
                      addMembershipForChannelId(Object.values(channelsToList)[0].claim_id, newestMembership);
                    }}
                    className="add-membership__button"
                    label={__('Create Tier for %channel_name%', { channel_name: channelName })}
                    icon={ICONS.ADD}
                  />
                )}

            {channelMemberships && channelMemberships.length < 6 && (
              <Button
                button="primary"
                onClick={(e) => {
                  const newestId = uuid(); // --> this will only be used locally when creating a new tier

                  const newestMembership = {
                    Membership: { id: newestId, name: 'Example Plan', description: '' },
                    NewPrices: [{ Price: { amount: 500 } }],
                    saved: false,
                  };

                  addEditingForMembershipId(newestId);
                  addMembershipForChannelId(channelId, newestMembership);
                }}
                className="add-membership__button"
                label={__('Add Tier for %channel_name%', { channel_name: channelName })}
                icon={ICONS.ADD}
              />
            )}
          </>
        );
      })}

      {/* ** show additional info checkboxes, activate memberships button ***/}
      {/* ** disabling until the backend is ready ** */}
      {/* /!** additional options checkboxes **!/ */}
      {/* <div className="show-additional-membership-info__div"> */}
      {/*  <h2 className="show-additional-membership-info__header">Additional Info</h2> */}
      {/*  <FormField */}
      {/*    type="checkbox" */}
      {/*    defaultChecked={false} */}
      {/*    label={'Show the amount of supporters on your Become A Member page'} */}
      {/*    name={'showSupporterAmount'} */}
      {/*  /> */}
      {/*  <FormField */}
      {/*    type="checkbox" */}
      {/*    defaultChecked={false} */}
      {/*    label={'Show the amount you make monthly on your Become A Member page'} */}
      {/*    name={'showMonthlyIncomeAmount'} */}
      {/*  /> */}
      {/* </div> */}

      {/* /!* activate memberships button *!/ */}
      {/* <div className="activate-memberships-button__div"> */}
      {/*  <Button */}
      {/*    button="primary" */}
      {/*    onClick={(e) => openActivateMembershipsModal()} */}
      {/*    className="activate-memberships__button" */}
      {/*    label={__('Activate Memberships')} */}
      {/*    icon={ICONS.ADD} */}
      {/* /> */}
      {/* {/*</div> */}
    </div>
  );
}

export default TiersTab;
