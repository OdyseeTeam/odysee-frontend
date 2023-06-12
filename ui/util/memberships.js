// @flow

export const getTotalPriceFromSupportersList = (supportersList: SupportersList) =>
  supportersList.map((supporter) => supporter.Price).reduce((total, supporterPledge) => total + supporterPledge, 0);

export function filterMembershipTiersWithPerk(membershipTiers: Array<MembershipTier>, perkName: string) {
  const filtered: MembershipTiers = membershipTiers.filter((t: MembershipTier) => {
    return t.Perks && t.Perks.some((perk: MembershipOdyseePerk) => perk.name === perkName);
  });
  return filtered;
}
