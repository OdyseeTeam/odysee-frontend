// @flow
import React from 'react';

import { FormField } from 'component/common/form';
import { useIsMobile } from 'effects/use-screensize';

import Button from 'component/button';
import BusyIndicator from 'component/common/busy-indicator';

const getIsInputEmpty = (value) => !value || value.length <= 2 || !/\S/.test(value);

type Props = {
  membership: CreatorMembership,
  hasSubscribers: ?boolean,
  removeEditing: () => void,
  onCancel: () => void,
  // -- redux --
  membershipPerks: MembershipPerks,
  activeChannelClaim: ChannelClaim,
  doMembershipAddTier: (params: MembershipAddTierParams) => Promise<Membership>,
  doMembershipList: (params: MembershipListParams) => Promise<CreatorMemberships>,
};

function MembershipTier(props: Props) {
  const {
    membership,
    hasSubscribers,
    removeEditing,
    onCancel,
    // -- redux --
    membershipPerks,
    activeChannelClaim,
    doMembershipAddTier,
    doMembershipList,
  } = props;

  const isMobile = useIsMobile();
  const roughHeaderHeight = (isMobile ? 56 : 60) + 10; // @see: --header-height

  const nameRef = React.useRef();
  const contributionRef = React.useRef();

  const [editTierParams, setEditTierParams] = React.useState({
    editTierDescription: membership.Membership.description || '',
    editTierName: membership.Membership.name || '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const nameError = getIsInputEmpty(editTierParams.editTierName);
  const descriptionError = getIsInputEmpty(editTierParams.editTierDescription);

  // custom emojis should be changed to channel member badge
  const permanentTierPerks = ['Member badge'];

  /**
   * Check whether the tier already has the perk added
   * @param {number} perkId - Id of the perk returned from DB
   * @param {any} tier - Tier that is being edited
   * @returns {boolean}
   */
  function containsPerk(perkId, tier) {
    if (!tier.Perks) return false;

    const perkIds = new Set(tier.Perks.map((tierPerk) => tierPerk.id));

    return perkIds.has(perkId);
  }

  /**
   * Selects the checked perks and builds them into a csv value for the backend
   * @returns {string}
   */
  function generatePerksCsv() {
    let selectedPerks = [];
    for (const perk of membershipPerks) {
      // $FlowFixMe
      const odyseePerkSelected = document.querySelector(`input#perk_${perk.id}.membership_perks`).checked;
      if (odyseePerkSelected) {
        selectedPerks.push(perk.id);
      }
    }
    return selectedPerks.toString();
  }

  /**
   * When someone hits the 'Save' button from the edit functionality
   * @param membershipTier - If an existing tier, use the old price and id
   * @returns {Promise<void>}
   */
  async function saveMembership(membershipTier) {
    setIsSubmitting(true);

    const newTierMonthlyContribution = contributionRef.current?.input?.current?.value || 0;

    const selectedPerksAsArray = generatePerksCsv();

    if (activeChannelClaim) {
      const isCreatingAMembership = typeof membershipTier.Membership.id === 'string';

      doMembershipAddTier({
        channel_name: activeChannelClaim.name,
        channel_id: activeChannelClaim.claim_id,
        name: editTierParams.editTierName,
        description: editTierParams.editTierDescription,
        amount: Number(newTierMonthlyContribution) * 100, // multiply to turn into cents
        currency: 'usd', // hardcoded for now
        perks: selectedPerksAsArray,
        old_stripe_price: membershipTier.Prices ? membershipTier.Prices[0].id : undefined,
        membership_id: isCreatingAMembership ? undefined : membershipTier.Membership.id,
      }).then(() => {
        setIsSubmitting(false);
        removeEditing();
        doMembershipList({ channel_name: activeChannelClaim.name, channel_id: activeChannelClaim.claim_id });
      });
    }
  }

  const editTierWrapperRef = React.useCallback(
    (node) => {
      if (node) {
        const y = node.getBoundingClientRect().top + window.pageYOffset - roughHeaderHeight;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    },
    [roughHeaderHeight]
  );

  return (
    <div className="membership-tier__wrapper-edit" ref={editTierWrapperRef}>
      <FormField
        ref={nameRef}
        max="30"
        type="text"
        name="tier_name"
        label={__('Tier Name')}
        placeholder={membership.Membership.name}
        autoFocus
        onChange={(e) =>
          setEditTierParams((prev) => ({ ...prev, editTierName: nameRef.current?.input?.current?.value || '' }))
        }
        value={editTierParams.editTierName}
      />

      <FormField
        type="textarea"
        max="400"
        name="tier_description"
        label={__('Tier description and custom perks')}
        placeholder={__('Description of your tier')}
        value={editTierParams.editTierDescription}
        onChange={(e) => setEditTierParams((prev) => ({ ...prev, editTierDescription: e.target.value }))}
      />

      <fieldset-section>
        <label htmlFor="tier_name">{__('Odysee Perks')}</label>
      </fieldset-section>

      {membershipPerks.map((tierPerk, i) => {
        const isPermanent = new Set(permanentTierPerks).has(tierPerk.name);

        return (
          <FormField
            key={i}
            type="checkbox"
            defaultChecked={isPermanent || containsPerk(tierPerk.id, membership)}
            label={tierPerk.description}
            name={'perk_' + tierPerk.id}
            className="membership_perks"
            disabled={isPermanent}
          />
        );
      })}

      <FormField
        ref={contributionRef}
        className="form-field--price-amount"
        type="number"
        name="tier_contribution"
        step="1"
        min="1"
        label={__('Monthly Contribution ($/Month)')}
        defaultValue={membership.NewPrices && membership.NewPrices[0].Price.amount / 100}
        onChange={(e) => parseFloat(e.target.value)}
        disabled={hasSubscribers}
      />

      {hasSubscribers && (
        <h4 className="header--cant_change_price">
          {__("This membership has subscribers, you can't update the price currently")}
        </h4>
      )}

      <div className="section__actions">
        <Button
          disabled={nameError || descriptionError}
          button="primary"
          label={isSubmitting ? <BusyIndicator message={__('Saving')} /> : __('Save Tier')}
          onClick={() => saveMembership(membership)}
        />
        <Button button="link" label={__('Cancel')} onClick={onCancel} />
      </div>
    </div>
  );
}

export default MembershipTier;
