/* eslint-disable no-console */
// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import Button from 'component/button';
import { FormField } from 'component/common/form';
import moment from 'moment';

let membershipTiers = [
  {
    displayName: 'Helping Hand',
    description: "You're doing your part, thank you!",
    monthlyContributionInUSD: 5,
    perks: ['exclusiveAccess', 'badge'],
  },
  {
    displayName: 'Big-Time Supporter',
    description: 'You are a true fan and are helping in a big way!',
    monthlyContributionInUSD: 10,
    perks: ['exclusiveAccess', 'earlyAccess', 'badge', 'emojis'],
  },
  {
    displayName: 'Community MVP',
    description: 'Where would this creator be without you? You are a true legend!',
    monthlyContributionInUSD: 20,
    perks: ['exclusiveAccess', 'earlyAccess', 'badge', 'emojis', 'custom-badge'],
  },
];

const perkDescriptions = [
  {
    perkName: 'exclusiveAccess',
    perkDescription: 'You will exclusive access to members-only content',
  },
  {
    perkName: 'earlyAccess',
    perkDescription: 'You will get early access to this creators content',
  },
  {
    perkName: 'badge',
    perkDescription: 'You will get a generic badge showing you are a supporter of this creator',
  },
  {
    perkName: 'emojis',
    perkDescription: 'You will get access to custom members-only emojis offered by the creator',
  },
  {
    perkName: 'custom-badge',
    perkDescription: 'You can choose a custom badge showing you are an MVP supporter',
  },
];

type Props = {
  openModal: (string, {}) => void,
  doToast: ({ message: string }) => void,
  bankAccountConfirmed: boolean,
};

function CreateTiersTab(props: Props) {
  const { openModal, doToast, bankAccountConfirmed } = props;

  const [isEditing, setIsEditing] = React.useState(false);
  const [creatorMemberships, setCreatorMemberships] = React.useState(membershipTiers);
  const [editTierDescription, setEditTierDescription] = React.useState('');

  const editMembership = (e, tierIndex, tierDescription) => {
    setEditTierDescription(tierDescription);
    setIsEditing(tierIndex);
  };

  const deleteMembership = (tierIndex) => {
    let membershipsBeforeDeletion = creatorMemberships;

    const amountOfMembershipsCurrently = creatorMemberships.length;
    if (amountOfMembershipsCurrently === 1) {
      const displayString = __('You must have at least one tier for your membership options');
      return doToast({ message: displayString, isError: true });
    }

    openModal(MODALS.CONFIRM_DELETE_MEMBERSHIP, {
      setCreatorMemberships,
      membershipsBeforeDeletion,
      tierIndex,
    });
  };

  const openActivateMembershipsModal = () => {
    openModal(MODALS.ACTIVATE_CREATOR_MEMBERSHIPS, {
      bankAccountConfirmed,
    });
  };

  const addMembership = () => {
    const amountOfMembershipsCurrently = creatorMemberships.length;

    const nextMembershipOrdinal = moment.localeData().ordinal(amountOfMembershipsCurrently + 1);

    let amountOfMembershipsLeft;
    if (amountOfMembershipsCurrently === 4) {
      amountOfMembershipsLeft = 'This is the maximum amount you can have';
    } else {
      amountOfMembershipsLeft = `You can add ${5 - (amountOfMembershipsCurrently + 1)} more`;
    }

    const newMembership = {
      displayName: 'New Membership Tier',
      description: `Here's your ${nextMembershipOrdinal} added tier. ${amountOfMembershipsLeft}.`,
      monthlyContributionInUSD: 5,
      perks: ['exclusiveAccess', 'badge'],
    };

    setCreatorMemberships([...creatorMemberships, newMembership]);
  };

  const handleChange = (event) => {
    setEditTierDescription(event.target.value);
  };

  const cancelEditingMembership = () => {
    setIsEditing(false);
  };

  function saveMembership(tierIndex) {
    const copyOfMemberships = creatorMemberships;

    // grab the tier name, description, monthly amount and perks
    // $FlowFixMe
    const newTierName = document.querySelectorAll('input[name=tier_name]')[0]?.value;
    const newTierDescription = editTierDescription;
    // $FlowFixMe
    const newTierMonthlyContribution = document.querySelectorAll('input[name=tier_contribution]')[0]?.value;

    let selectedPerks = [];

    for (const perkDescription of perkDescriptions) {
      // $FlowFixMe
      const odyseePerkSelected = document.getElementById(perkDescription.perkName)?.checked;
      if (odyseePerkSelected) {
        selectedPerks.push(perkDescription.perkName);
      }
    }

    const newObject = {
      displayName: newTierName,
      description: newTierDescription,
      monthlyContributionInUSD: newTierMonthlyContribution,
      perks: selectedPerks,
    };

    copyOfMemberships[tierIndex] = newObject;

    // TODO: better way than setTimeout
    setTimeout(function() {
      document.getElementsByClassName('membership-tier__div')[tierIndex].scrollIntoView({ behavior: 'smooth' });
    }, 15);

    setCreatorMemberships(copyOfMemberships);

    setIsEditing(false);
  }

  const containsPerk = (perk, tier) => {
    return tier.perks.indexOf(perk, tier) > -1;
  };

  function createEditTier(tier, membershipIndex) {
    // TODO: better way than setTimeout
    setTimeout(function() {
      document.getElementById('edit-div').scrollIntoView({ behavior: 'smooth' });
    }, 15);
    return (
      <div id="edit-div" className="edit-div" style={{ marginBottom: '45px' }}>
        <FormField type="text" name="tier_name" label={__('Tier Name')} defaultValue={tier.displayName} />
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
        {perkDescriptions.map((tierPerk, i) => (
          <>
            <FormField
              type="checkbox"
              defaultChecked={containsPerk(tierPerk.perkName, tier)}
              // disabled={!optimizeAvail}
              // onChange={() => setUserOptimize(!userOptimize)}
              label={tierPerk.perkDescription}
              name={tierPerk.perkName}
            />
          </>
        ))}
        <FormField
          className="form-field--price-amount"
          type="number"
          name="tier_contribution"
          step="1"
          label={__('Monthly Contribution ($/Month)')}
          defaultValue={tier.monthlyContributionInUSD}
          onChange={(event) => parseFloat(event.target.value)}
        />
        <div className="section__actions">
          <Button button="primary" label={'Save Tier'} onClick={() => saveMembership(membershipIndex)} />
          <Button button="link" label={__('Cancel')} onClick={cancelEditingMembership} />
        </div>
      </div>
    );
  }

  return (
    <div className="create-tiers-div">
      {/* page header */}
      <div className="memberships-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: '24px', marginBottom: 'var(--spacing-s)' }}>Create Your Membership Tiers</h1>
        <h2 style={{ fontSize: '18px' }}>Define the tiers that your viewers can subscribe to</h2>
      </div>

      {/* list through different tiers */}
      {creatorMemberships.map((membershipTier, membershipIndex) => (
        <>
          {/* if the membership tier is marked as editing, show the edit functionality */}
          {isEditing === membershipIndex && <>{createEditTier(membershipTier, membershipIndex)}</>}
          {/* display info for the tier */}
          {isEditing !== membershipIndex && (
            <div className="membership-tier__div" style={{ marginBottom: 'var(--spacing-xxl)' }}>
              <div style={{ marginBottom: 'var(--spacing-s)', fontSize: '1.1rem' }}>
                {membershipIndex + 1}) Tier Name: {membershipTier.displayName}
              </div>
              <h1 style={{ marginBottom: 'var(--spacing-s)' }}>{membershipTier.description}</h1>
              <h1 style={{ marginBottom: 'var(--spacing-s)' }}>
                Monthly Pledge: ${membershipTier.monthlyContributionInUSD}
              </h1>
              {membershipTier.perks.map((tierPerk, i) => (
                <>
                  <p>
                    {/* list all the perks */}
                    {perkDescriptions.map((globalPerk, i) => (
                      <>
                        {tierPerk === globalPerk.perkName && (
                          <>
                            <ul>
                              <li>{globalPerk.perkDescription}</li>
                            </ul>
                          </>
                        )}
                      </>
                    ))}
                  </p>
                </>
              ))}
              <div className="buttons-div" style={{ marginTop: '13px' }}>
                {/* cancel membership button */}
                <Button
                  button="alt"
                  onClick={(e) => editMembership(e, membershipIndex, membershipTier.description)}
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
        </>
      ))}

      {/* add membership tier button */}
      {creatorMemberships.length < 5 && (
        <>
          <Button
            button="primary"
            onClick={(e) => addMembership()}
            className="add-membership-button"
            label={__('Add Tier')}
            icon={ICONS.ADD}
          />
        </>
      )}

      {/* additional options checkboxes */}
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
      <Button
        button="primary"
        onClick={(e) => openActivateMembershipsModal()}
        className="activate-memberships-button"
        label={__('Activate Memberships')}
        icon={ICONS.ADD}
      />
    </div>
  );
}

export default CreateTiersTab;
