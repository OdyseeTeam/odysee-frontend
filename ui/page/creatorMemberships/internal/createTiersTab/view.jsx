// @flow
import React from 'react';
import classnames from 'classnames';

import { FormField } from 'component/common/form';

import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';

import Card from 'component/common/card';
import Button from 'component/button';

type Props = {
  bankAccountConfirmed: boolean,
  activeChannel: Claim,
  membershipPerks: MembershipOptions,
  creatorMemberships: MembershipOptions,
  doMembershipAddTier: (params: MembershipAddTierParams) => void,
  doGetMembershipPerks: (params: MembershipListParams) => void,
  doMembershipList: (params: MembershipListParams) => void,
  doOpenModal: (modalId: string, {}) => void,
};

const CreateTiersTab = (props: Props) => {
  const {
    bankAccountConfirmed,
    activeChannel,
    membershipPerks,
    creatorMemberships: fetchedMemberships,
    doMembershipAddTier,
    doGetMembershipPerks,
    doMembershipList,
    doOpenModal,
  } = props;

  const { name: activeChannelName, claim_id: activeChannelId } = activeChannel || {};

  const [isEditing, setIsEditing] = React.useState(false);
  const [creatorMemberships, setCreatorMemberships] = React.useState(fetchedMemberships || []);
  const [editTierDescription, setEditTierDescription] = React.useState('');
  const [pendingTier, setPendingTier] = React.useState(false);

  React.useEffect(() => {
    if (activeChannelName && activeChannelId) {
      doGetMembershipPerks({ channel_name: activeChannelName, channel_id: activeChannelId });
    }
  }, [activeChannelName, activeChannelId, doGetMembershipPerks]);

  React.useEffect(() => {
    if (activeChannelName && activeChannelId) {
      doMembershipList({ channel_name: activeChannelName, channel_id: activeChannelId });
    }
  }, [activeChannelId, activeChannelName, doMembershipList]);

  // focus name when you create a new tier
  React.useEffect(() => {
    document.querySelector("input[name='tier_name']")?.focus();
  }, [pendingTier]);

  // when someone hits the 'Save' button from the edit functionality
  async function saveMembership(tierIndex) {
    const copyOfMemberships = creatorMemberships;

    // grab the tier name, description, monthly amount and perks
    // $FlowFixMe
    const newTierName = document.querySelectorAll('input[name=tier_name]')[0]?.value;
    const newTierDescription = editTierDescription;
    // $FlowFixMe
    const newTierMonthlyContribution = document.querySelectorAll('input[name=tier_contribution]')[0]?.value;

    let selectedPerks = [];

    for (const perk of membershipPerks) {
      // $FlowFixMe
      const odyseePerkSelected = document.querySelector(`input#perk_${perk.id}.membership_perks`).checked;
      // const odyseePerkSelected = document.getElementById(perkDescription.perkName)?.checked;
      if (odyseePerkSelected) {
        selectedPerks.push(perk.id);
      }
    }

    const selectedPerksAsArray = selectedPerks.toString();

    const newObject = {
      // displayName: newTierName,
      // description: newTierDescription,
      // amount: Number(newTierMonthlyContribution) * 100,
      // monthlyContributionInUSD: Number(newTierMonthlyContribution),
      // perks: selectedPerks,
      Membership: {
        name: newTierName,
        description: newTierDescription,
      },
      Prices: [
        {
          unit_amount: Number(newTierMonthlyContribution) * 100,
        },
      ],
      Perks: [], // TODO: list these dynamically
    };

    const oldObject = creatorMemberships[tierIndex];

    console.log('old object');
    console.log(oldObject);

    let oldStripePrice = oldObject?.Prices;
    if (oldStripePrice.length) {
      oldStripePrice = oldStripePrice[0].id;
    }
    console.log('old stripe price');
    console.log(oldStripePrice);

    const oldMembershipId = oldObject?.Membership.id;

    // only hit backend if there is a difference between the current state
    // if (1 == 1) {
    copyOfMemberships[tierIndex] = newObject;

    // setCreatorMemberships(copyOfMemberships);

    const response = await doMembershipAddTier({
      channel_name: activeChannelName,
      channel_id: activeChannelId,
      name: newTierName,
      description: newTierDescription,
      amount: Number(newTierMonthlyContribution) * 100, // multiply to turn into cents
      currency: 'usd', // hardcoded for now
      perks: selectedPerksAsArray,
      // oldStripePrice,
      // oldMembershipId,
      // perks: selectedPerks,
    });
    console.log(response);

    // getExistingTiers();

    setIsEditing(false);
    // }

    // TODO: better way than setTimeout
    setTimeout(function () {
      document.getElementsByClassName('membership-tier__div')[tierIndex].scrollIntoView({ behavior: 'smooth' });
    }, 15);
  }

  const containsPerk = (perkId, tier) => {
    if (!tier.Perks) return false;

    let perkIds = [];
    for (const tierPerk of tier.Perks) {
      perkIds.push(tierPerk.id);
    }

    return perkIds.includes(perkId);
  };

  function createEditTier(tier, membershipIndex) {
    // TODO: better way than setTimeout
    setTimeout(function () {
      document.getElementById('edit-div').scrollIntoView({ behavior: 'smooth' });
    }, 15);

    console.log('tier ');
    console.log(tier);

    return (
      <div className="edit-div" style={{ marginBottom: '45px' }}>
        <FormField type="text" name="tier_name" label={__('Tier Name')} defaultValue={tier.Membership.name} />
        {/* could be cool to have markdown */}
        {/* <FormField */}
        {/*  type="markdown" */}
        {/* /> */}
        <FormField
          type="textarea"
          rows="10"
          name="tier_description"
          label={__('Tier Description (You can also add custom benefits here)')}
          placeholder={__('Description of your tier')}
          value={editTierDescription}
          onChange={(e) => setEditTierDescription(e.target.value)}
        />
        <label htmlFor="tier_name" style={{ marginTop: '15px', marginBottom: '8px' }}>
          Odysee Perks
        </label>
        {membershipPerks.map((tierPerk, i) => (
          <>
            <FormField
              type="checkbox"
              defaultChecked={containsPerk(tierPerk.id, tier)}
              label={tierPerk.description}
              name={'perk_' + tierPerk.id}
              className="membership_perks"
            />
          </>
        ))}
        <FormField
          className="form-field--price-amount"
          type="number"
          name="tier_contribution"
          step="1"
          label={__('Monthly Contribution ($/Month)')}
          defaultValue={tier.Prices[0].unit_amount / 100}
          onChange={(event) => parseFloat(event.target.value)}
          disabled={tier.HasSubscribers}
        />
        {tier.HasSubscribers && (
          <h4 className="header--cant_change_price">
            This membership has subscribers, you can't update the price currently
          </h4>
        )}
        <div className="section__actions">
          <Button button="primary" label={'Save Tier'} onClick={() => saveMembership(membershipIndex)} />
          <Button
            button="link"
            label={__('Cancel')}
            onClick={() => {
              setIsEditing(false);
              // tier was just added, if canceled then 'delete' the tier
              if (pendingTier) {
                let membershipsBeforeDeletion = creatorMemberships;
                const membershipsAfterDeletion = membershipsBeforeDeletion.filter(
                  (tiers, index) => index !== membershipIndex
                );
                setCreatorMemberships(membershipsAfterDeletion);
                setPendingTier(false);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <Card
      className="create-tiers__div"
      title={__('Create Your Membership Tiers')}
      subtitle={__('Define the tiers that your viewers can subscribe to')}
    >
      <div className="create-tiers__header">
        <h2 style={{ fontSize: '15px' }}>
          You are editing your tiers for {activeChannelName}, you can change the channel on the Basics tab
        </h2>
      </div>

      {!bankAccountConfirmed && (
        <h1 className="confirm-account-to-create-tiers-header">
          Please confirm your bank account before you can create tiers
        </h1>
      )}

      <div className={classnames('tier-edit-functionality', { 'edit-functionality-disabled': !bankAccountConfirmed })}>
        {/* list through different tiers */}
        {creatorMemberships?.length > 0 &&
          creatorMemberships.map((membershipTier, membershipIndex) => (
            <div className="create-tier__card" key={membershipIndex}>
              {/* if the membership tier is marked as editing, show the edit functionality */}
              {isEditing === membershipIndex && <>{createEditTier(membershipTier, membershipIndex)}</>}
              {/* display info for the tier */}
              {/* this long conditional isnt fully necessary but some test environment data is bad atm */}
              {isEditing !== membershipIndex && membershipTier.NewPrices && membershipTier.NewPrices.length && (
                <div className="membership-tier__div">
                  <div style={{ marginBottom: 'var(--spacing-s)', fontSize: '1.1rem' }}>
                    {membershipIndex + 1}) Tier Name: {membershipTier.Membership.name}
                  </div>
                  <h1 style={{ marginBottom: 'var(--spacing-s)' }}>{membershipTier.Membership.description}</h1>
                  <h1 style={{ marginBottom: 'var(--spacing-s)' }}>
                    Monthly Pledge: ${membershipTier.NewPrices[0].unit_amount / 100}
                  </h1>
                  {membershipTier.Perks &&
                    membershipTier.Perks.map((tierPerk, i) => (
                      <>
                        <p>
                          <ul>
                            <li>{tierPerk.description}</li>
                          </ul>
                        </p>
                      </>
                    ))}
                  <div className="buttons-div" style={{ marginTop: '13px' }}>
                    {/* cancel membership button */}
                    <Button
                      button="alt"
                      onClick={(e) => {
                        setEditTierDescription(membershipTier.Membership.description);
                        setIsEditing(membershipIndex);
                        // setPendingTier(true);
                      }}
                      className="edit-membership-button"
                      label={__('Edit Tier')}
                      icon={ICONS.EDIT}
                    />
                    {/* cancel membership button */}
                    <Button
                      button="alt"
                      onClick={(e) => {
                        let membershipsBeforeDeletion = creatorMemberships;

                        // const amountOfMembershipsCurrently = creatorMemberships.length;
                        // if (amountOfMembershipsCurrently === 1) {
                        //   const displayString = __('You must have at least one tier for your membership options');
                        //   return doToast({ message: displayString, isError: true });
                        // }

                        doOpenModal(MODALS.CONFIRM_DELETE_MEMBERSHIP, {
                          setCreatorMemberships,
                          membershipsBeforeDeletion,
                          membershipIndex,
                        });
                      }}
                      className="cancel-membership-button"
                      label={__('Delete Tier')}
                      icon={ICONS.DELETE}
                      disabled={membershipTier.HasSubscribers}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

        {creatorMemberships?.length < 5 && (
          <Button
            button="primary"
            onClick={(e) => {
              const amountOfMembershipsCurrently = creatorMemberships.length;

              const newestMembership = {
                Membership: {
                  name: 'Example Plan',
                  description: 'You can describe extra perks here',
                },
                Prices: [
                  {
                    unit_amount: 500,
                  },
                ],
                saved: false,
              };

              setEditTierDescription(newestMembership.Membership.description);
              setCreatorMemberships([...creatorMemberships, newestMembership]);
              setPendingTier(true);
              setIsEditing(amountOfMembershipsCurrently);
            }}
            className="add-membership__button"
            label={__('Add Tier')}
            icon={ICONS.ADD}
          />
        )}

        <div className="show-additional-membership-info__div">
          <h2 className="show-additional-membership-info__header">Additional Info</h2>
          <FormField
            type="checkbox"
            defaultChecked={false}
            label={'Show the amount of supporters on your Become A Member page'}
            name={'showSupporterAmount'}
          />
          <FormField
            type="checkbox"
            defaultChecked={false}
            label={'Show the amount you make monthly on your Become A Member page'}
            name={'showMonthlyIncomeAmount'}
          />
        </div>

        <div className="activate-memberships-button__div">
          <Button
            button="primary"
            onClick={(e) => doOpenModal(MODALS.ACTIVATE_CREATOR_MEMBERSHIPS, { bankAccountConfirmed })}
            className="activate-memberships__button"
            label={__('Activate Memberships')}
            icon={ICONS.ADD}
          />
        </div>
      </div>
    </Card>
  );
};

export default CreateTiersTab;
