/* eslint-disable no-console */
// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import Button from 'component/button';
import { FormField } from 'component/common/form';
import moment from 'moment';
import classnames from 'classnames';
import { membershipTiers, perkDescriptions } from './defaultMembershipTiers'
import { getStripeEnvironment } from 'util/stripe';
import { Lbryio } from 'lbryinc';
const stripeEnvironment = getStripeEnvironment();

async function addTierToStripeAndDatabase({
  channelName,
  channelClaimId,
  name,
  description,
  currency,
  amount,
  perks,
  oldStripePrice,
  oldMembershipId,
}) {
  // show the memberships the user is subscribed to
  const response = await Lbryio.call(
    'membership',
    'add',
    {
      environment: stripeEnvironment,
      channel_name: channelName,
      channel_id: channelClaimId,
      name,
      description,
      amount,
      currency,
      perks,
      old_stripe_price: oldStripePrice,
      membership_id: oldMembershipId,
    },
    'post'
  );

  return response;
}

type Props = {
  openModal: (string, {}) => void,
  doToast: ({ message: string }) => void,
  bankAccountConfirmed: boolean,
  activeChannel: Claim,
};

function CreateTiersTab(props: Props) {
  const { openModal, doToast, bankAccountConfirmed, activeChannel } = props;

  let channelName, channelClaimId;
  if (activeChannel) {
    channelName = activeChannel.name;
    channelClaimId = activeChannel.claim_id;
  }

  console.log(activeChannel);

  const [isEditing, setIsEditing] = React.useState(false);
  const [creatorMemberships, setCreatorMemberships] = React.useState([]);
  const [editTierDescription, setEditTierDescription] = React.useState('');

  // if pending tier is true, when cancel button is hit the membership is not saved
  // (edited membership just came from the add button)
  const [pendingTier, setPendingTier] = React.useState(false);

  const [membershipPerks, setMembershipParks] = React.useState(false);

  // focus name when you create a new tier
  React.useEffect(() => {
    (async function() {
      getMembershipPerks();
    })();
  }, []);

  async function getMembershipPerks() {
    const response = await Lbryio.call(
      'membership_perk',
      'list',
      {
        environment: stripeEnvironment,
        channel_name: channelName,
        channel_id: channelClaimId,
      },
      'post'
    );

    console.log(response);

    if (response === null) {
      setMembershipParks([]);
    } else {
      setMembershipParks(response);
    }

    return response;
  }

  async function getExistingTiers() {
    const response = await Lbryio.call(
      'membership',
      'list',
      {
        environment: stripeEnvironment,
        channel_name: channelName,
        channel_id: channelClaimId,
      },
      'post'
    );

    console.log(response);

    if (response === null) {
      setCreatorMemberships([]);
    } else {
      setCreatorMemberships(response);
    }

    return response;
  }

  // focus name when you create a new tier
  React.useEffect(() => {
    (async function() {
      if (channelClaimId) {
        getExistingTiers();
      }
    })();
  }, [channelClaimId]);

  // focus name when you create a new tier
  React.useEffect(() => {
    document.querySelector("input[name='tier_name']")?.focus();
  }, [pendingTier]);

  const editMembership = (e, tierIndex, tierDescription) => {
    setEditTierDescription(tierDescription);
    setIsEditing(tierIndex);
    // setPendingTier(true);
  };

  const deleteMembership = (tierIndex) => {
    let membershipsBeforeDeletion = creatorMemberships;

    // const amountOfMembershipsCurrently = creatorMemberships.length;
    // if (amountOfMembershipsCurrently === 1) {
    //   const displayString = __('You must have at least one tier for your membership options');
    //   return doToast({ message: displayString, isError: true });
    // }

    openModal(MODALS.CONFIRM_DELETE_MEMBERSHIP, {
      setCreatorMemberships,
      membershipsBeforeDeletion,
      tierIndex,
      getExistingTiers,
    });
  };

  const openActivateMembershipsModal = () => {
    openModal(MODALS.ACTIVATE_CREATOR_MEMBERSHIPS, {
      bankAccountConfirmed,
    });
  };

  const addMembership = () => {
    const amountOfMembershipsCurrently = creatorMemberships.length;

    const newestMembership = {
      Membership: {
        name: 'Example Plan',
        description: 'You can describe extra perks here',
      },
      Prices: [{
        StripePrice: {
          unit_amount: 500,
        },
      }],
      saved: false,
    };

    setEditTierDescription(newestMembership.Membership.description);
    setCreatorMemberships([...creatorMemberships, newestMembership]);
    setPendingTier(true);
    setIsEditing(amountOfMembershipsCurrently);
  };

  const handleChange = (event) => {
    setEditTierDescription(event.target.value);
  };

  const cancelEditingMembership = (membershipIndex) => {
    setIsEditing(false);
    // tier was just added, if canceled then 'delete' the tier
    if (pendingTier) {
      let membershipsBeforeDeletion = creatorMemberships;
      const membershipsAfterDeletion = membershipsBeforeDeletion.filter((tiers, index) => index !== membershipIndex);
      setCreatorMemberships(membershipsAfterDeletion);
      setPendingTier(false);
    }
  };

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
      Prices: [{
        StripePrice: {
          unit_amount: Number(newTierMonthlyContribution) * 100,
        },
      }],
      Perks: [], // TODO: list these dynamically
    };

    const oldObject = creatorMemberships[tierIndex];

    console.log('old object');
    console.log(oldObject);

    let oldStripePrice = oldObject?.Prices;
    if (oldStripePrice.length) {
      oldStripePrice = oldStripePrice[0].StripePrice.id;
    }
    console.log('old stripe price')
    console.log(oldStripePrice)

    const oldMembershipId = oldObject?.Membership.id;

    const objectsAreDifferent = JSON.stringify(newObject) !== JSON.stringify(oldObject)

    // only hit backend if there is a difference between the current state
    if (1 == 1) {
      copyOfMemberships[tierIndex] = newObject;

      // setCreatorMemberships(copyOfMemberships);

      const response = await addTierToStripeAndDatabase({
        channelName,
        channelClaimId,
        name: newTierName,
        description: newTierDescription,
        amount: Number(newTierMonthlyContribution) * 100, // multiply to turn into cents
        currency: 'usd', // hardcoded for now
        perks: selectedPerksAsArray,
        oldStripePrice,
        oldMembershipId,
        // perks: selectedPerks,
      });
      console.log(response);

      getExistingTiers();

      setIsEditing(false);
    }

    // TODO: better way than setTimeout
    setTimeout(function() {
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
    setTimeout(function() {
      document.getElementById('edit-div').scrollIntoView({ behavior: 'smooth' });
    }, 15);
    return (
      <div id="edit-div" className="edit-div" style={{ marginBottom: '45px' }}>
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
          onChange={handleChange}
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
          defaultValue={tier.Prices[0].StripePrice.unit_amount / 100}
          onChange={(event) => parseFloat(event.target.value)}
        />
        <div className="section__actions">
          <Button button="primary" label={'Save Tier'} onClick={() => saveMembership(membershipIndex)} />
          <Button button="link" label={__('Cancel')} onClick={() => cancelEditingMembership(membershipIndex)} />
        </div>
      </div>
    );
  }

  return (
    <div className="create-tiers__div">
      {/* page header */}
      <div className="create-tiers__header">
        <h1 style={{ fontSize: '24px', marginBottom: 'var(--spacing-s)' }}>Create Your Membership Tiers</h1>
        <h2 style={{ fontSize: '18px', marginBottom: 'var(--spacing-s)' }}>Define the tiers that your viewers can subscribe to </h2>
        <h2 style={{ fontSize: '15px' }}>You are editing your tiers for {channelName}, you can change the channel on the Basics tab</h2>
      </div>

      {!bankAccountConfirmed && <h1 className="confirm-account-to-create-tiers-header">Please confirm your bank account before you can create tiers </h1>}

      <div className={classnames('tier-edit-functionality', { 'edit-functionality-disabled': !bankAccountConfirmed })}>
        {/* list through different tiers */}
        {creatorMemberships && creatorMemberships.length > 0 && creatorMemberships.map((membershipTier, membershipIndex) => (
          <>
            { console.log(membershipTier) }
            <div className="create-tier__card">
              {/* if the membership tier is marked as editing, show the edit functionality */}
              {isEditing === membershipIndex && <>{createEditTier(membershipTier, membershipIndex)}</>}
              {/* display info for the tier */}
              {isEditing !== membershipIndex && (
                <div className="membership-tier__div">
                  <div style={{ marginBottom: 'var(--spacing-s)', fontSize: '1.1rem' }}>
                    {membershipIndex + 1}) Tier Name: {membershipTier.Membership.name}
                  </div>
                  <h1 style={{ marginBottom: 'var(--spacing-s)' }}>{membershipTier.Membership.description}</h1>
                  <h1 style={{ marginBottom: 'var(--spacing-s)' }}>
                    Monthly Pledge: ${membershipTier.Prices[0].StripePrice.unit_amount / 100}
                  </h1>
                  {membershipTier.Perks && membershipTier.Perks.map((tierPerk, i) => (
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
                      onClick={(e) => editMembership(e, membershipIndex, membershipTier.Membership.description)}
                      className="edit-membership-button"
                      label={__('Edit Tier')}
                      icon={ICONS.EDIT}
                    />
                    {/* cancel membership button */}
                    <Button
                      button="alt"
                      onClick={(e) => deleteMembership(membershipIndex)}
                      className="cancel-membership-button"
                      label={__('Delete Tier')}
                      icon={ICONS.DELETE}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        ))}

        {/* add membership tier button */}
        {creatorMemberships && creatorMemberships.length < 5 && (
          <>
            <Button
              button="primary"
              onClick={(e) => addMembership()}
              className="add-membership__button"
              label={__('Add Tier')}
              icon={ICONS.ADD}
            />
          </>
        )}

        {/** additional options checkboxes **/}
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

        {/* activate memberships button */}
        <div className="activate-memberships-button__div">
          <Button
            button="primary"
            onClick={(e) => openActivateMembershipsModal()}
            className="activate-memberships__button"
            label={__('Activate Memberships')}
            icon={ICONS.ADD}
          />
        </div>
      </div>
    </div>
  );
}

export default CreateTiersTab;
