// @flow
import React from 'react';

import { FormField } from 'component/common/form';
import { useIsMobile } from 'effects/use-screensize';

import Button from 'component/button';
import BusyIndicator from 'component/common/busy-indicator';

const getIsInputEmpty = (value) => !value || value.length <= 2 || !/\S/.test(value);

const MIN_PRICE = '4';
const MAX_PRICE = '1000';

// -- this is not actually used, but helps checking --
// export const ODYSEE_PERKS = Object.freeze({
//   3: 'Access to members-only chat',
//   4: 'Badge shown in chat',
// });

// custom emojis should be changed to channel member badge
const PERMANENT_TIER_PERKS = new Set([3, 4]); // -- perk name: Member Badge

type Props = {
  membership: CreatorMembership,
  hasSubscribers: ?boolean,
  removeEditing: () => void,
  onCancel: () => void,
  // -- redux --
  membershipPerks: MembershipPerks,
  activeChannelClaim: ChannelClaim,
  doMembershipAddTier: (params: MembershipAddTierParams) => Promise<MembershipDetails>,
  addChannelMembership: (membership: any) => Promise<CreatorMemberships>,
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
    addChannelMembership,
    doMembershipList,
  } = props;

  const isMobile = useIsMobile();
  const roughHeaderHeight = (isMobile ? 56 : 60) + 10; // @see: --header-height

  const nameRef = React.useRef();
  const contributionRef = React.useRef();

  const [editTierParams, setEditTierParams] = React.useState({
    editTierDescription: membership.Membership.description || '',
    editTierName: membership.Membership.name || '',
    editTierPrice: membership.NewPrices && membership.NewPrices[0].Price.amount / 100,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedPerkIds, setSelectedPerkIds] = React.useState([
    ...new Set([
      ...Array.from(PERMANENT_TIER_PERKS),
      ...(membership.Perks ? membership.Perks.map((perk) => perk.id) : []),
    ]),
  ]);

  const nameError = getIsInputEmpty(editTierParams.editTierName);
  const descriptionError = getIsInputEmpty(editTierParams.editTierDescription);

  const priceLowerThanMin = parseFloat(editTierParams.editTierPrice) < parseFloat(MIN_PRICE);
  const priceHigherThanMax = parseFloat(editTierParams.editTierPrice) > parseFloat(MAX_PRICE);
  const priceError = !editTierParams.editTierPrice || priceLowerThanMin || priceHigherThanMax;

  /**
   * When someone hits the 'Save' button from the edit functionality
   * @param membershipTier - If an existing tier, use the old price and id
   * @returns {Promise<void>}
   */
  async function saveMembership(membershipTier) {
    setIsSubmitting(true);

    const newTierMonthlyContribution = contributionRef.current?.input?.current?.value || 0;

    const selectedPerksAsArray = selectedPerkIds.toString();

    if (activeChannelClaim) {
      const isCreatingAMembership = typeof membershipTier.Membership.id === 'string';
      const price = Number(newTierMonthlyContribution) * 100; // multiply to turn into cents

      doMembershipAddTier({
        channel_name: activeChannelClaim.name,
        channel_id: activeChannelClaim.claim_id,
        name: editTierParams.editTierName,
        description: editTierParams.editTierDescription,
        amount: price,
        currency: 'usd', // hardcoded for now
        perks: selectedPerksAsArray,
        old_stripe_price: membershipTier.Prices ? membershipTier.Prices[0].id : undefined,
        membership_id: isCreatingAMembership ? undefined : membershipTier.Membership.id,
      })
        .then((response: MembershipDetails) => {
          setIsSubmitting(false);
          removeEditing();

          const newMembershipObj = {
            HasSubscribers: false,
            Membership: response,
            NewPrices: [{ Price: { amount: price } }],
          };
          addChannelMembership(newMembershipObj);
          doMembershipList({ channel_name: activeChannelClaim.name, channel_id: activeChannelClaim.claim_id });
        })
        .catch(() => setIsSubmitting(false));
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
        lines="3"
        name="tier_description"
        label={__('Tier Description')}
        placeholder={__('Description of your tier')}
        value={editTierParams.editTierDescription}
        onChange={(e) => setEditTierParams((prev) => ({ ...prev, editTierDescription: e.target.value }))}
      />

      <fieldset-section>
        <label htmlFor="tier_name">{__('Odysee Perks')}</label>
      </fieldset-section>

      {membershipPerks.map((tierPerk) => {
        const isPermanent = PERMANENT_TIER_PERKS.has(tierPerk.id);
        const isSelected = new Set(selectedPerkIds).has(tierPerk.id);

        return (
          <FormField
            key={tierPerk.id}
            type="checkbox"
            defaultChecked={isPermanent || isSelected}
            label={__(tierPerk.description)}
            name={'perk_' + tierPerk.id + ' ' + 'membership_' + membership.Membership.id}
            className="membership_perks"
            disabled={isPermanent}
            onChange={() =>
              setSelectedPerkIds((prevPerks) => {
                const newPrevPerks = new Set(prevPerks);
                const isSelected = newPrevPerks.has(tierPerk.id);

                if (!isSelected) {
                  newPrevPerks.add(tierPerk.id);
                } else {
                  newPrevPerks.delete(tierPerk.id);
                }

                return Array.from(newPrevPerks);
              })
            }
          />
        );
      })}

      <FormField
        ref={contributionRef}
        className="form-field--price-amount"
        type="number"
        name="tier_contribution"
        step="1"
        min={MIN_PRICE}
        max={MAX_PRICE}
        label={__('Monthly Contribution ($/Month)')}
        value={editTierParams.editTierPrice}
        onChange={(e) => {
          const value = contributionRef.current?.input?.current?.value;
          setEditTierParams((prev) => ({ ...prev, editTierPrice: parseFloat(value) }));
        }}
        disabled={hasSubscribers}
      />

      <div className="section__actions">
        <Button
          disabled={nameError || descriptionError || priceError || isSubmitting}
          button="primary"
          label={isSubmitting ? <BusyIndicator message={__('Saving')} /> : __('Save Tier')}
          onClick={() => saveMembership(membership)}
        />
        <Button button="link" label={__('Cancel')} onClick={onCancel} />
      </div>
      <div className="section__actions">
        <p className="help">
          <div className="error__text">
            {nameError
              ? __('A membership name is required.')
              : descriptionError
              ? __('A membership description is required.')
              : undefined}
          </div>
          <div className="error__text">
            {hasSubscribers
              ? __("This membership has subscribers, you can't update the price currently.")
              : priceLowerThanMin
              ? __('Price must be greater or equal than %min%.', { min: MIN_PRICE })
              : priceHigherThanMax
              ? __('Price must be lower or equal than %max%.', { max: MAX_PRICE })
              : !editTierParams.editTierPrice
              ? __('A price is required.')
              : undefined}
          </div>
        </p>
      </div>
    </div>
  );
}

export default MembershipTier;
