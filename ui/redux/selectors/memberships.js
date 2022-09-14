// @flow
import { createSelector } from 'reselect';
import { createCachedSelector } from 're-reselect';
import { selectChannelClaimIdForUri, selectMyChannelClaimIds } from 'redux/selectors/claims';
import { ODYSEE_CHANNEL } from 'constants/channels';
import * as MEMBERSHIP_CONSTS from 'constants/memberships';

type State = { claims: any, user: any, memberships: any };

const selectState = (state: State) => state.memberships || {};

export const selectMembershipMineData = (state: State) => selectState(state).membershipMineByKey;
export const selectMyActiveMembershipsById = (state: State) => selectMembershipMineData(state)?.activeById;
export const selectMyCanceledMembershipsById = (state: State) => selectMembershipMineData(state)?.canceledById;
export const selectMyPurchasedMembershipsById = (state: State) => selectMembershipMineData(state)?.purchasedById;
export const selectMembershipFetchingIdsByChannel = (state: State) => selectState(state).fetchingIdsByCreatorId;
export const selectPendingBuyMembershipIds = (state: State) => selectState(state).pendingBuyIds;
export const selectPendingCancelMembershipIds = (state: State) => selectState(state).pendingCancelIds;
export const selectChannelMembershipsByCreatorId = (state: State) => selectState(state).channelMembershipsByCreatorId;
export const selectById = (state: State) => selectState(state).membershipListById || {};
export const selectDidFetchMembershipsDataById = (state: State) => selectState(state).didFetchMembershipsDataById;
export const selectMembershipPerks = (state: State) => selectState(state).membershipPerks;
export const selectMySupportersList = (state: State) => selectState(state).mySupportersList;
export const selectProtectedContentClaimsById = (state: State) => selectState(state).protectedContentClaimsByCreatorId;
export const selectIsListingAllMyTiers = (state: State) => selectState(state).listingAllMyTiers;

export const selectMembershipMineFetched = (state: State) => selectMembershipMineData(state) !== undefined;

export const selectMyActiveMembershipsForChannelClaimId = (state: State, id: string) => {
  const byId = selectMyActiveMembershipsById(state);
  return byId && byId[id];
};

export const selectMyValidMembershipsById = createSelector(
  selectMyPurchasedMembershipsById,
  (purchasedMembershipsById) => {
    const validMembershipsById = {};

    for (const creatorChannelId in purchasedMembershipsById) {
      const purchasedCreatorMemberships = purchasedMembershipsById[creatorChannelId];

      for (const membership of purchasedCreatorMemberships) {
        if (membership.Subscription.current_period_end * 1000 > Date.now()) {
          validMembershipsById[creatorChannelId] = new Set(validMembershipsById[creatorChannelId]);
          validMembershipsById[creatorChannelId].add(membership);
          // $FlowFixMe
          validMembershipsById[creatorChannelId] = Array.from(validMembershipsById[creatorChannelId]);
        }
      }
    }

    return validMembershipsById;
  }
);

export const selectMyValidMembershipsForCreatorId = (state: State, id: string) =>
  selectMyValidMembershipsById(state)[id];

export const selectUserHasValidMembershipForCreatorId = (state: State, id: string) => {
  const validMemberships = selectMyValidMembershipsForCreatorId(state, id);
  return Boolean(validMemberships && validMemberships.length > 0);
};

export const selectMyValidMembershipIds = (state: State) => {
  const validMembershipsById = selectMyValidMembershipsById(state);

  const validMembershipIds = new Set([]);
  for (const creatorId in validMembershipsById) {
    const memberships = validMembershipsById[creatorId];

    for (const membership of memberships) {
      validMembershipIds.add(membership.MembershipDetails.id);
    }
  }

  // $FlowFixMe
  return validMembershipIds.size ? Array.from(validMembershipIds) : null;
};

export const selectMyActiveOdyseeMembership = (state: State) =>
  selectMyActiveMembershipsForChannelClaimId(state, ODYSEE_CHANNEL.ID);
export const selectUserHasActiveOdyseeMembership = (state: State, id: string) =>
  Boolean(selectMyActiveOdyseeMembership(state));

export const selectMyCanceledMembershipsForChannelClaimId = (state: State, id: string) => {
  const byId = selectMyCanceledMembershipsById(state);
  return byId && byId[id];
};
export const selectMyPurchasedMembershipsForChannelClaimId = (state: State, id: string) => {
  const byId = selectMyPurchasedMembershipsById(state);
  return byId && byId[id];
};

export const selectPurchaseIsPendingForMembershipId = (state: State, id: string) =>
  new Set(selectPendingBuyMembershipIds(state)).has(id);
export const selectCancelIsPendingForMembershipId = (state: State, id: string) =>
  new Set(selectPendingCancelMembershipIds(state)).has(id);

export const selectFetchingIdsForMembershipChannelId = (state: State, channelId: string) =>
  selectMembershipFetchingIdsByChannel(state)[channelId];

export const selectChannelMembershipsForCreatorId = (state: State, channelId: string) =>
  selectChannelMembershipsByCreatorId(state)[channelId];

export const selectMembershipForCreatorIdAndChannelId = createCachedSelector(
  (state, creatorId, channelId) => channelId,
  selectChannelMembershipsForCreatorId,
  selectMyValidMembershipsForCreatorId,
  selectMyChannelClaimIds,
  (channelId, creatorMemberships, myValidCreatorMemberships, myChannelClaimIds) => {
    const channelIsMine = new Set(myChannelClaimIds).has(channelId);

    if (channelIsMine && myValidCreatorMemberships) {
      return myValidCreatorMemberships[0].MembershipDetails.name;
    }

    return creatorMemberships && creatorMemberships[channelId];
  }
)((state, creatorId, channelId) => `${String(creatorId)}:${String(channelId)}`);

export const selectOdyseeMembershipForChannelId = (state: State, channelId: string) =>
  selectMembershipForCreatorIdAndChannelId(state, ODYSEE_CHANNEL.ID, channelId);
export const selectOdyseeMembershipIsPremiumPlus = (state: State, channelId: string) =>
  selectOdyseeMembershipForChannelId(state, channelId) === MEMBERSHIP_CONSTS.ODYSEE_TIER_NAMES.PREMIUM_PLUS;

export const selectMembershipTiersForChannelId = (state: State, channelId: string) => selectById(state)[channelId];

export const selectMembershipsByIdForChannelIds = createSelector(
  (state, ids) => ids,
  selectById,
  (ids, byId) => {
    const membershipsById = {};

    ids.forEach((id) => {
      const membershipForId = byId[id];
      if (membershipForId) membershipsById[id] = membershipForId;
    });

    return membershipsById;
  }
);

export const selectMyMembershipTiersChannelById = (state: State) => {
  const myChannelClaimIds = selectMyChannelClaimIds(state);
  if (!myChannelClaimIds) return myChannelClaimIds;

  return selectMembershipsByIdForChannelIds(state, myChannelClaimIds);
};

export const userHasMembershipTiers = createSelector(selectMyMembershipTiersChannelById, (myMembershipsById) =>
  Boolean(myMembershipsById && Object.values(myMembershipsById).length > 0)
);

export const selectMembershipTiersForChannelUri = (state: State, uri: string) =>
  selectMembershipTiersForChannelId(state, selectChannelClaimIdForUri(state, uri) || '');

export const selectOdyseeMembershipTiers = (state: State) =>
  selectMembershipTiersForChannelId(state, ODYSEE_CHANNEL.ID);

export const selectCreatorMembershipsFetchedByUri = createSelector(
  selectMembershipTiersForChannelUri,
  (memberships) => memberships !== undefined
);

export const selectCreatorHasMembershipsByUri = createSelector(selectMembershipTiersForChannelUri, (memberships) =>
  Boolean(memberships?.length > 0)
);

export const selectMyPurchasedMembershipTierForCreatorUri = (state: State, creatorId: string) => {
  const myPurchasedCreatorMembership = selectMyPurchasedMembershipsForChannelClaimId(state, creatorId);
  if (!myPurchasedCreatorMembership) return myPurchasedCreatorMembership;

  const creatorMembershipTiers = selectMembershipTiersForChannelId(state, creatorId);
  if (!creatorMembershipTiers) return creatorMembershipTiers;

  // This is needed because some data like Perks is present in membership_list call,
  // but returns null on membership_mine
  return Object.assign(
    {},
    myPurchasedCreatorMembership[0],
    creatorMembershipTiers.find(
      (membership) => membership.Membership.id === myPurchasedCreatorMembership[0].MembershipDetails.id
    )
  );
};

export const selectUserValidMembershipForChannelUri = createSelector(
  (state, uri) => selectMyPurchasedMembershipsForChannelClaimId(state, selectChannelClaimIdForUri(state, uri) || ''),
  (purchasedMembershipForChannel) => {
    if (!purchasedMembershipForChannel) return purchasedMembershipForChannel;

    // $FlowFixMe
    const subscriptionEndTime = purchasedMembershipForChannel[0].Subscription?.current_period_end;
    const currentTimeInStripeFormat = new Date().getTime() / 1000;
    const membershipIsValid = subscriptionEndTime && currentTimeInStripeFormat < subscriptionEndTime;

    return membershipIsValid ? purchasedMembershipForChannel[0] : null;
  }
);

export const selectProtectedContentClaimsForId = (state: State, id: string) =>
  selectProtectedContentClaimsById(state)[id];

export const selectProtectedContentMembershipsForClaimId = (state: State, channelId: string, claimId: string) => {
  const protectedClaimsById = selectProtectedContentClaimsForId(state, channelId);
  return protectedClaimsById && protectedClaimsById[claimId] && protectedClaimsById[claimId].memberships;
};

export const selectMyMembershipTiersWithExclusiveContentPerk = (state: State, activeChannelClaimId: string) => {
  const membershipTiers: MembershipTiers = selectMembershipTiersForChannelId(state, activeChannelClaimId);

  if (!membershipTiers) return [];

  const perkName = 'Exclusive content';

  const tiers: MembershipTiers = membershipTiers.filter((membershipTier: MembershipTier) => {
    return membershipTier.Perks && membershipTier.Perks.some((perk: MembershipPerk) => perk.name === perkName);
  });

  return tiers;
};

export const selectMyMembershipTiersWithExclusiveLivestreamPerk = (state: State, activeChannelClaimId: string) => {
  const membershipTiers: MembershipTiers = selectMembershipTiersForChannelId(state, activeChannelClaimId);

  if (!membershipTiers) return [];

  const perkName = 'Exclusive livestreams';

  const tiers: MembershipTiers = membershipTiers.filter((membershipTier: MembershipTier) => {
    return membershipTier.Perks && membershipTier.Perks.some((perk: MembershipPerk) => perk.name === perkName);
  });

  return tiers;
};

export const selectMyMembershipTiersWithMembersOnlyChatPerk = (state: State, channelId: string) => {
  const membershipTiers: MembershipTiers = selectMembershipTiersForChannelId(state, channelId);

  if (!membershipTiers) return [];

  const perkName = 'Members-only chat';

  const tiers: MembershipTiers = membershipTiers.filter((membershipTier: MembershipTier) => {
    return membershipTier.Perks && membershipTier.Perks.some((perk: MembershipPerk) => perk.name === perkName);
  });

  return tiers;
};

export const selectMembershipTierIdsWithMembersOnlyChatPerk = (state: State, channelId: string) => {
  const memberships: MembershipTiers = selectMyMembershipTiersWithMembersOnlyChatPerk(state, channelId);
  const membershipIds: Array<number> = memberships.map((membership: MembershipTier) => membership.Membership.id);

  return membershipIds;
};
