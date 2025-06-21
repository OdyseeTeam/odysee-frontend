// @flow

export const getTotalPriceFromSupportersList = (supportersList: SupportersList) =>
  supportersList.map((supporter) => supporter.price).reduce((total, supporterPledge) => total + supporterPledge, 0);

/**
 * Given the current form type combination, what is the applicable perk name
 * that provides members-only restriction.
 *
 * @param type
 * @param liveCreateType
 * @param liveEditType
 * @returns {string}
 */
export function getRestrictivePerkName(type: PublishType, liveCreateType: LiveCreateType, liveEditType: LiveEditType) {
  const EXCLUSIVE_CONTENT = 'Exclusive content';
  const EXCLUSIVE_LIVESTREAMS = 'Exclusive livestreams';

  switch (type) {
    case 'file':
    case 'post':
      return EXCLUSIVE_CONTENT;
    case 'livestream':
      // -- liveCreateType --
      switch (liveCreateType) {
        case 'new_placeholder':
          return EXCLUSIVE_LIVESTREAMS;
        case 'choose_replay':
          return EXCLUSIVE_CONTENT;
        case 'edit_placeholder':
          // -- liveEditType --
          switch (liveEditType) {
            case 'update_only':
              return EXCLUSIVE_LIVESTREAMS;
            case 'use_replay':
            case 'upload_replay':
              return EXCLUSIVE_CONTENT;
          }
      }
  }

  assert(false, 'unhandled restriction combo', { type, liveCreateType, liveEditType });
  return EXCLUSIVE_CONTENT;
}

export function filterMembershipTiersWithPerk(membershipTiers: Array<CreatorMembership>, perkName: string) {
  const filtered: Array<CreatorMembership> = membershipTiers.filter((t: CreatorMembership) => {
    return t.perks && t.perks.some((perk: MembershipOdyseePerk) => perk.name === perkName);
  });
  return filtered;
}

export function membershipIsExpired(ends_at) {
  const now = new Date();
  const endsAt = new Date(ends_at);
  return now > endsAt;
}
