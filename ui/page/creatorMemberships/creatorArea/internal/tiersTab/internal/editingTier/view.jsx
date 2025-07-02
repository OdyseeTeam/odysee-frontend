// @flow
import React from 'react';

import { FormField } from 'component/common/form';
import { useIsMobile } from 'effects/use-screensize';

import * as MEMBERSHIP_CONSTS from 'constants/memberships';

import Button from 'component/button';
import BusyIndicator from 'component/common/busy-indicator';

const getIsInputEmpty = (value) => !value || value.length <= 2 || !/\S/.test(value);

const MIN_PRICE = '0.01'; // TODO: make this a decimal like 0.10
const MAX_PRICE = '1000';

type Props = {
  membership: CreatorMembership,
  hasSubscribers: ?boolean,
  removeEditing: () => void,
  onCancel: () => void,
  // -- redux --
  membershipOdyseePerks: MembershipOdyseePerks, // the perks the server knows about, stored in state
  activeChannelClaim: ChannelClaim,
  doMembershipAddTier: (params: MembershipAddTierParams) => Promise<MembershipDetails>,
  doMembershipUpdateTier: (params: MembershipUpdateTierParams) => Promise<MembershipDetails>,
  addChannelMembership: (membership: any) => Promise<CreatorMemberships>,
  doMembershipList: (params: MembershipListParams, forceUpdate: ?boolean) => Promise<CreatorMemberships>,
  apiArweaveAddress: string,
};

function MembershipEditTier(props: Props) {
  const {
    membership,
    hasSubscribers,
    removeEditing,
    onCancel,
    // -- redux --
    membershipOdyseePerks,
    activeChannelClaim,
    doMembershipAddTier,
    doMembershipUpdateTier,
    addChannelMembership,
    doMembershipList,
    apiArweaveAddress,
  } = props;
  console.log('perk props', props);

  console.log('membershipOdyseePerks', membershipOdyseePerks);
  const isCreatingAMembership = typeof membership.membership_id === 'string';

  const isMobile = useIsMobile();
  const roughHeaderHeight = (isMobile ? 56 : 60) + 10; // @see: --header-height

  const nameRef = React.useRef();
  const contributionRef = React.useRef();

  // no guarantee MEMBERSHIP_CONSTS._PERKS is the same as api get perks result. this is dumb.
  const defaultPerkIds = [...MEMBERSHIP_CONSTS.DEFAULT_TIER_PERKS];
  const currentPerkIds = [...membership.perks.map((perk) => perk.id)];
  const editablePerkIds = [...MEMBERSHIP_CONSTS.EDITABLE_TIER_PERKS];
  const perksIdsShownInEditForm = Array.from(new Set([...currentPerkIds, ...MEMBERSHIP_CONSTS.EDITABLE_TIER_PERKS]));

  const initialState = React.useRef({
    name: membership.name || '',
    description: membership.description || '',
    price: membership.prices[0].amount / 100, // currently a single price
    perks: isCreatingAMembership
      ? defaultPerkIds
      : currentPerkIds,
    frequency: 'monthly',
  });

  const [editTierParams, setEditTierParams] = React.useState({
    editTierName: initialState.current.name,
    editTierDescription: initialState.current.description,
    editTierPrice: initialState.current.price,
    editTierFrequency: initialState.current.frequency,
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedPerkIds, setSelectedPerkIds] = React.useState(initialState.current.perks);
  const [saveError, setSaveError] = React.useState('');

  console.log('selectedPerkIds', selectedPerkIds);

  const nameError = getIsInputEmpty(editTierParams.editTierName);
  const descriptionError = getIsInputEmpty(editTierParams.editTierDescription);

  const priceLowerThanMin = parseFloat(editTierParams.editTierPrice) < parseFloat(MIN_PRICE);
  const priceHigherThanMax = parseFloat(editTierParams.editTierPrice) > parseFloat(MAX_PRICE);
  const priceError = !editTierParams.editTierPrice || priceLowerThanMin || priceHigherThanMax;
  /**
   * When someone hits the 'Save' button from the edit functionality
   * @param membership - If an existing tier, use the old price and id
   * @returns {Promise<void>}
   */
  async function saveMembership() {
    setSaveError('');
    const initialObj = initialState.current;
    const newObj = {
      name: editTierParams.editTierName,
      description: editTierParams.editTierDescription,
      price: editTierParams.editTierPrice,
      perks: selectedPerkIds,
    };

    const membershipObjDidNotChange = JSON.stringify(initialObj) === JSON.stringify(newObj);

    if (membershipObjDidNotChange) {
      // Simply "exit" here since there are no changes to save
      return removeEditing();
    }

    setIsSubmitting(true);

    const newTierMonthlyContribution = contributionRef.current?.input?.current?.value || 0;

    const selectedPerksAsArray = selectedPerkIds.toString();

    if (activeChannelClaim) {
      const price = Math.round(Number(newTierMonthlyContribution) * 100); // multiply to turn into cents

      if (isCreatingAMembership) {
        const params = {
          channel_id: activeChannelClaim.claim_id,
          name: editTierParams.editTierName,
          description: editTierParams.editTierDescription,
          amount: price,
          currency: 'AR', // hardcoded for now
          perks: selectedPerksAsArray,
          frequency: editTierParams.editTierFrequency,
          payment_address: apiArweaveAddress,
        };
        doMembershipAddTier(params)
          .then((responseOrError: {response: 'ok', error: string }) => {
            const { error } = responseOrError;
            setIsSubmitting(false);
            if (error) {
              setSaveError(error);
              return;
            }
            const selectedPerks = membershipOdyseePerks.filter((perk) => selectedPerkIds.includes(perk.id));

            const newMembershipObj: CreatorMembership = {
              name: editTierParams.editTierName,
              description: editTierParams.editTierDescription,

              has_subscribers: false,
              channel_name: activeChannelClaim.name,
              prices: [{ amount: price, currency: 'AR', address: '' }], // HERE PRICES
              perks: selectedPerks,
              enabled: true,
            };
            addChannelMembership(newMembershipObj); // TODO AR_MEMBERSHIP check this newMembershipObj
            removeEditing();

            // force update for list
            doMembershipList({ channel_claim_id: activeChannelClaim.claim_id }, true);
          })
          .catch(() => setIsSubmitting(false));
      } else { // is edit
        const params = {
          new_name: editTierParams.editTierName,
          new_description: editTierParams.editTierDescription,
          new_amount: price,
          membership_id: membership.membership_id,
          new_members_only_chat_enabled: selectedPerkIds.includes(7), // selectedPerks has id 7
        };
        doMembershipUpdateTier(params)
          .then((responseOrError: { response: 'ok', error: string }) => {
            setIsSubmitting(false);
            const { error} = responseOrError;
            if (error) {
              setSaveError(error);
              return;
            }

            const selectedPerks = membershipOdyseePerks.filter((perk) => selectedPerkIds.includes(perk.id));

            const newMembershipObj: CreatorMembership = {
              membership_id: membership.membership_id,
              name: editTierParams.editTierName,
              description: editTierParams.editTierDescription,
              has_subscribers: membership.has_subscribers,
              channel_name: activeChannelClaim.name,
              channel_claim_id: activeChannelClaim.claim_id,
              prices: [{ amount: price, currency: 'usd', address: '' }], // HERE PRICES
              perks: selectedPerks,
              enabled: true,
            };

            addChannelMembership(newMembershipObj); // TODO AR_MEMBERSHIP check this newMembershipObj
            removeEditing();

            // force update for list
            doMembershipList({ channel_claim_id: activeChannelClaim.claim_id }, true);
          })
          .catch(() => setIsSubmitting(false));
      }
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
        placeholder={membership.name}
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
        <label htmlFor="tier_name">{__('Odysee Perks (Permanent)')}</label>
      </fieldset-section>
      <div className="membership-tier__perks">
        <div className="membership-tier__perks-content">
          <ul>

        {membershipOdyseePerks.map((tierPerk) => {
          const isPermanent = MEMBERSHIP_CONSTS.PERMANENT_TIER_PERKS.includes(tierPerk.id);
          const isShownInEdit = perksIdsShownInEditForm.includes(tierPerk.id);
          const isSelected = new Set(selectedPerkIds).has(tierPerk.id);
          const isEditable = editablePerkIds.includes(tierPerk.id);

          if (isCreatingAMembership) {
            return (
              <FormField
                key={tierPerk.id}
                type="checkbox"
                defaultChecked={isSelected}
                label={__(tierPerk.description)}
                name={'perk_' + tierPerk.id + ' ' + 'membership_' + membership.membership_id}
                className="membership_perks"
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
          } else {
            if (isShownInEdit) {
              if (!isEditable) {
                return (
                  <li key={tierPerk.description}>{__(tierPerk.description)}</li>
                );
              } else {
                return (
                  <FormField
                    key={tierPerk.id}
                    type="checkbox"
                    defaultChecked={isPermanent || isSelected}
                    label={__(tierPerk.description)}
                    name={'perk_' + tierPerk.id + ' ' + 'membership_' + membership.membership_id}
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
              }
            }
          }
        })}
          </ul>
        </div>
      </div>

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
          onClick={saveMembership}
        />
        <Button button="link" label={__('Cancel')} onClick={onCancel} />
      </div>
      {(nameError || descriptionError || saveError || priceLowerThanMin || priceHigherThanMax) &&
        <div className="section__actions">
          {/* <p className="help"> */}
          <div className={'errorColumn'}>
            <div className="error__text">
              {nameError
                ? __('A membership name is required.')
                : descriptionError
                  ? __('A membership description is required.')
                  : undefined}
              {saveError && __(saveError)}
            </div>
            <div className="error__text">
              {hasSubscribers
                ? __(`This membership has subscribers, you can't update the price currently.`)
                : priceLowerThanMin
                  ? __('Price must be greater or equal than %min%.', { min: MIN_PRICE })
                  : priceHigherThanMax
                    ? __('Price must be lower or equal than %max%.', { max: MAX_PRICE })
                    : !editTierParams.editTierPrice
                      ? __('A price is required.')
                      : undefined}
            </div>
          </div>
          {/* </p> */}
        </div>

      }

    </div>
  );
}

export default MembershipEditTier;
