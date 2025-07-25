// @flow
import { createSelector } from 'reselect';
import { createCachedSelector } from 're-reselect';

import {
  filterMembershipTiersWithPerk,
  getLastMonthPayments,
  getTotalPriceFromSupportersList,
  membershipIsExpired,
} from 'util/memberships';

import {
  selectChannelClaimIdForUri,
  selectMyChannelClaimIds,
  selectNameForClaimId,
  selectProtectedContentTagForUri,
  selectClaimForId,
  selectClaimIsMineForId,
  selectClaimIdForUri,
} from 'redux/selectors/claims';
import { getChannelIdFromClaim } from 'util/claim';
import { ODYSEE_CHANNEL } from 'constants/channels';
import * as MEMBERSHIP_CONSTS from 'constants/memberships';

const selectState = (state: State) => state.memberships || {};

export const selectMembershipMineData = (state: State) => selectState(state).membershipMineByCreatorId;
export const selectMembershipMineFetching = (state: State) => selectState(state).membershipMineFetching;
export const selectMembershipMineFetched = (state: State) => selectMembershipMineData(state) !== undefined;
export const selectMembershipBuyError = (state: State) => selectState(state).membershipBuyError;
export const selectMembershipFetchingIdsByChannel = (state: State) => selectState(state).fetchingIdsByCreatorId;
export const selectChannelMembershipsByCreatorId = (state: State) => selectState(state).channelMembershipsByCreatorId;
export const selectLegacyOdyseePremiumByCreatorId = (state: State) => selectState(state).legacyOdyseePremiumById;

export const selectChannelMembershipsForCreatorId = (state: State, channelId: string) =>
  selectChannelMembershipsByCreatorId(state)[channelId];

export const selectPendingBuyMembershipIds = (state: State) => selectState(state).pendingBuyIds;
export const selectMembershipPaymentsIncoming = (state: State) => selectState(state).membershipPaymentsIncoming;
export const selectPurchaseIsPendingForMembershipId = (state: State, id: string) =>
  new Set(selectPendingBuyMembershipIds(state)).has(id);

export const selectPendingCancelMembershipIds = (state: State) => selectState(state).pendingCancelIds;
export const selectCancelIsPendingForMembershipId = (state: State, id: string) =>
  new Set(selectPendingCancelMembershipIds(state)).has(id);

export const selectMembershipListFetchingIds = (state: State) => selectState(state).membershipListFetchingIds;
export const selectIsMembershipListFetchingForId = (state: State, claimId: ClaimId) =>
  new Set(selectMembershipListFetchingIds(state)).has(claimId);
export const selectMembershipsListByCreatorId = (state: State) => selectState(state).membershipListByCreatorId;
export const selectMembershipTiersForCreatorId = (state: State, creatorId: ClaimId): CreatorMemberships =>
  selectMembershipsListByCreatorId(state)[creatorId];

export const selectClaimMembershipTiersFetchingIds = (state: State) =>
  selectState(state).claimMembershipTiersFetchingIds;
export const selectIsClaimMembershipTierFetchingForId = (state: State, claimId: string) =>
  new Set(selectClaimMembershipTiersFetchingIds(state)).has(claimId);
export const selectProtectedContentClaimsById = (state: State) => selectState(state).protectedContentClaimsByCreatorId;
export const selectProtectedContentClaimsForId = (state: State, channelId: string) =>
  selectProtectedContentClaimsById(state)[channelId];

export const selectMySupportersList = (state: State) => selectState(state).mySupportersList;
export const selectMyTotalSupportersAmount = (state: State) => selectMySupportersList(state)?.length || 0;

export const selectIsListingAllMyTiers = (state: State) => selectState(state).listingAllMyTiers;

export const selectMembershipOdyseePerks = (state: State) => selectState(state).membershipOdyseePerks;
export const selectMembershipOdyseePermanentPerks = createSelector(
  selectMembershipOdyseePerks,
  (membershipOdyseePerks) =>
    membershipOdyseePerks.filter((perk) => MEMBERSHIP_CONSTS.PERMANENT_TIER_PERKS.includes(perk.id))
);

export const selectMyTotalMonthlyIncome = createSelector(
  selectMySupportersList,
  (supportersList) => supportersList && getTotalPriceFromSupportersList(supportersList)
);

export const selectPreviousMonthlyIncome = createSelector(
  selectMembershipPaymentsIncoming,
  (payments) => payments && getLastMonthPayments(payments)
);

export const selectSupportersForChannelId = createSelector(
  selectNameForClaimId,
  selectMySupportersList,
  (channelName, supportersList) =>
    supportersList && supportersList.filter((supporter) => supporter.supported_channel_name === channelName)
);

export const selectSupportersAmountForChannelId = (state: State, channelId: ClaimId) =>
  selectSupportersForChannelId(state, channelId)?.length || 0;

export const selectMonthlyIncomeForChannelId = createSelector(
  selectSupportersForChannelId,
  (channelSupporters) => channelSupporters && getTotalPriceFromSupportersList(channelSupporters)
);

// -- Active Membership = auto_renew is enabled
export const selectMyActiveMembershipsById = createSelector(
  selectMembershipMineData,
  // $FlowIgnore
  (myMembershipsByCreatorId): MembershipMineDataByCreatorId => {
    if (!myMembershipsByCreatorId) return myMembershipsByCreatorId;

    const activeMembershipsById = {};

    for (const creatorChannelId in myMembershipsByCreatorId) {
      const purchasedCreatorMemberships = myMembershipsByCreatorId[creatorChannelId];

      for (const membership of purchasedCreatorMemberships) {
        if (membership.auto_renew) {
          // TODO: implmenent autorenew; this is always false
          activeMembershipsById[creatorChannelId] = new Set(activeMembershipsById[creatorChannelId]);
          activeMembershipsById[creatorChannelId].add(membership);
          // $FlowFixMe
          activeMembershipsById[creatorChannelId] = Array.from(activeMembershipsById[creatorChannelId]);
        }
      }
    }

    return activeMembershipsById;
  }
);

// subscription.status === 'active' or ( subscription.status === 'pending' and m.payments.find(p => p.status="submitted")
export const selectHasMembershipForMembershipId = (state: State, creatorId: string, membershipId: number) => {
  const mine = selectMembershipMineData(state);
  const mineForCreator = mine[creatorId];
  if (!mineForCreator) return false;
  const isSubscribed =
    !!mineForCreator.find(
      (m) =>
        m.membership.id === membershipId &&
        (m.subscription.is_active === true ||
          (m.subscription.status === 'pending' && m.payments.some((p) => p.status === 'submitted')))
    ) || false;
  return isSubscribed;
};

export const selectMembershipMineForCreatorId = (state: State, creatorId: string) => {
  const mine = selectMembershipMineData(state);
  return mine[creatorId];
};

export const selectMembershipMineForCreatorIdForMembershipId = (
  state: State,
  creatorId: string,
  membershipId: number
) => {
  const mine = selectMembershipMineForCreatorId(state, creatorId);
  if (!mine) return null;
  const membership = mine.find((m) => m.membership.id === membershipId);
  if (!membership) return null;
  return membership;
};

// canceled if subscription.status === 'canceled'
export const selectHasCanceledMembershipForMembershipId = (state: State, creatorId: string, membershipId: number) => {
  const mine = selectMembershipMineData(state);
  const mineForCreator = mine[creatorId];
  if (!mineForCreator) return false;
  return (
    !!mineForCreator.find(
      (m) =>
        m.membership.id === membershipId &&
        m.subscription.status === 'canceled' &&
        !membershipIsExpired(m.subscription.ends_at)
    ) || false
  );
};

// select cancelled membership is renewable
// select membership is renewable

// pending if subscription.status === pending AND payments.find(p => p.status === submitted
export const selectHasPendingMembershipForMembershipId = (state: State, creatorId: string, membershipId: number) => {
  const mine = selectMembershipMineData(state);
  const mineForCreator = mine[creatorId];
  if (!mineForCreator) return false;
  return (
    !!mineForCreator.find(
      (m) =>
        m.membership.id === membershipId &&
        m.subscription.status === 'pending' &&
        !m.payments.some((p) => p.status === 'submitted')
    ) || false
  );
};

// -- Valid Membership = still in period_end date range
export const selectMyValidMembershipsById = createSelector(selectMembershipMineData, (myMembershipsByCreatorId) => {
  const validMembershipsById = {};
  for (const creatorChannelId in myMembershipsByCreatorId) {
    const purchasedCreatorMemberships = myMembershipsByCreatorId[creatorChannelId];

    for (const membership of purchasedCreatorMemberships) {
      if (membership.subscription.is_active === true) {
        validMembershipsById[creatorChannelId] = new Set(validMembershipsById[creatorChannelId]);
        validMembershipsById[creatorChannelId].add(membership);
        // $FlowFixMe
        validMembershipsById[creatorChannelId] = Array.from(validMembershipsById[creatorChannelId]);
      }
    }
  }

  return validMembershipsById;
});

// -- From Creators = Removes Odysee memberships
export const selectMyPurchasedMembershipsFromCreatorsById = (state: State) => {
  const purchasedMembershipsById = selectMembershipMineData(state);
  if (!purchasedMembershipsById) return purchasedMembershipsById;

  const purchasedMembershipsFromCreatorsById = Object.assign({}, purchasedMembershipsById);
  delete purchasedMembershipsFromCreatorsById[ODYSEE_CHANNEL.ID];

  return purchasedMembershipsFromCreatorsById;
};
export const selectMyPurchasedMembershipsFromCreators = createSelector(
  selectMyPurchasedMembershipsFromCreatorsById,
  (myPurchasedCreatorMemberships) =>
    myPurchasedCreatorMemberships &&
    Object.values(myPurchasedCreatorMemberships).reduce((acc, val) => acc.concat(val), [])
);

export const selectMyActiveMembershipsForCreatorId = (state: State, id: string) => {
  const myActiveMembershipsById = selectMyActiveMembershipsById(state);
  if (!myActiveMembershipsById) return myActiveMembershipsById;

  return myActiveMembershipsById[id] || null;
};

export const selectMyValidMembershipsForCreatorId = (state: State, id: string) => {
  const myValidMembershipsById = selectMyValidMembershipsById(state);
  return myValidMembershipsById[id] || null;
};

export const selectIncomingPaymentsBySubscriber = (state: State) => {
  const payments = selectMembershipTxIncoming(state);
  return payments.reduce((ac, cur) => {
    const currentId = cur.subscriber_channel_claim_id;
    if (ac[currentId]) {
      ac[currentId].push(cur);
    } else {
      ac[currentId] = [cur];
    }
    return ac;
  }, {});
};

export const selectMembershipPaymentsForMemberChannelId = (state: State, id: string) => {
  const payments = selectMembershipTxIncoming(state);
  if (!payments) {
    return [];
  }

  if (payments.length === 0) {
    return [];
  }

  const selectedPayments = payments.filter((p) => p.subscriber_channel_claim_id === id);
  return selectedPayments;
};
export const selectUserHasValidMembershipForCreatorId = (state: State, id: string) => {
  const validMemberships = selectMyValidMembershipsForCreatorId(state, id);
  return Boolean(validMemberships && validMemberships.length > 0);
};

export const selectUserHasValidNonCanceledMembershipForCreatorId = (state: State, id: string) => {
  const validMemberships = selectMyValidMembershipsForCreatorId(state, id) || [];
  const memberships = validMemberships.filter(
    (m) => m.subscription.is_active === true && m.subscription.status !== 'canceled'
  ); // possibly 'pending'
  return Boolean(memberships && memberships.length > 0);
};

export const selectUserHasValidOdyseeMembership = (state: State) =>
  selectUserHasValidMembershipForCreatorId(state, ODYSEE_CHANNEL.ID); // deprecated

export const selectMyValidMembershipIds = createSelector(selectMyValidMembershipsById, (validMembershipsById) => {
  const validMembershipIds = new Set([]);

  Object.entries(validMembershipsById).forEach(([key, value]) => {
    value.forEach((value) => {
      validMembershipIds.add(value.membership.id);
    });
  });

  // $FlowFixMe
  return validMembershipIds.size ? Array.from(validMembershipIds) : null;
});

// -- Canceled Membership = status is 'canceled'
export const selectMyCanceledMembershipsById = createSelector(selectMembershipMineData, (myMembershipsByCreatorId) => {
  if (!myMembershipsByCreatorId) return myMembershipsByCreatorId;

  const canceledMembershipsById = {};

  for (const creatorChannelId in myMembershipsByCreatorId) {
    const purchasedCreatorMemberships = myMembershipsByCreatorId[creatorChannelId];

    for (const membership of purchasedCreatorMemberships) {
      if (membership.subscription.status === 'canceled') {
        canceledMembershipsById[creatorChannelId] = new Set(canceledMembershipsById[creatorChannelId]);
        canceledMembershipsById[creatorChannelId].add(membership);
        // $FlowFixMe
        canceledMembershipsById[creatorChannelId] = Array.from(canceledMembershipsById[creatorChannelId]);
      }
    }
  }

  return canceledMembershipsById;
});

export const selectMyCanceledMembershipsForChannelClaimId = (state: State, id: string) => {
  const byId = selectMyCanceledMembershipsById(state);
  return byId && byId[id];
};

export const selectMyPurchasedMembershipsForChannelClaimId = (state: State, id: string) => {
  const byId = selectMembershipMineData(state);
  return byId && byId[id];
};

export const selectFetchingIdsForMembershipChannelId = (state: State, channelId: string) =>
  selectMembershipFetchingIdsByChannel(state)[channelId];

export const selectUserOdyseeMembership = (state: State, id: string) => {
  const odyMemberships = selectLegacyOdyseePremiumByCreatorId(state);
  return odyMemberships ? odyMemberships[id] : null;
};

export const selectMembershipForCreatorIdAndChannelId = createCachedSelector(
  (state, creatorId, channelId) => channelId,
  selectChannelMembershipsForCreatorId,
  selectMyValidMembershipsForCreatorId,
  selectMyChannelClaimIds,
  (channelId, creatorMemberships, myValidCreatorMemberships, myChannelClaimIds) => {
    const channelIsMine = new Set(myChannelClaimIds).has(channelId);

    // if (channelIsMine) {
    //   if (!myValidCreatorMemberships) return myValidCreatorMemberships;
    //
    //   // -- For checking my own memberships, it is better to use the result of the 'mine'
    //   // call, which is cached and will be more up to date.
    //   const myMembership = myValidCreatorMemberships.find(
    //     (membership: MembershipSub) => membership.channel_claim_id === channelId
    //   );
    //
    //   return myMembership && myMembership.name;
    // }

    return creatorMemberships && creatorMemberships[channelId];
  }
)((state, creatorId, channelId) => `${String(creatorId)}:${String(channelId)}`);

export const selectMembershipForCreatorOnlyIdAndChannelId = (state: State, creatorId: string, channelId: string) =>
  creatorId !== ODYSEE_CHANNEL.ID && selectMembershipForCreatorIdAndChannelId(state, creatorId, channelId);

export const selectMyValidOdyseeMemberships = (state: State) =>
  selectMyValidMembershipsForCreatorId(state, ODYSEE_CHANNEL.ID);

export const selectUserHasOdyseePremiumPlus = createSelector(selectMyValidOdyseeMemberships, (myValidMemberships) => {
  if (!myValidMemberships) return myValidMemberships === undefined ? undefined : false;

  // -- For checking my own memberships, it is better to use the result of the 'mine'
  // call, which is cached and will be more up to date.
  return myValidMemberships.some(
    (membership: MembershipSub) => membership.name === MEMBERSHIP_CONSTS.ODYSEE_TIER_NAMES.PREMIUM_PLUS
  );
});

export const selectOdyseeMembershipForChannelId = (state: State, channelId: string) =>
  selectMembershipForCreatorIdAndChannelId(state, ODYSEE_CHANNEL.ID, channelId);

export const selectOdyseeMembershipIsPremiumPlus = (state: State, channelId: string) =>
  selectOdyseeMembershipForChannelId(state, channelId) === MEMBERSHIP_CONSTS.ODYSEE_TIER_NAMES.PREMIUM_PLUS;

export const selectMembershipsById = createSelector(selectMembershipsListByCreatorId, (byId) => {
  const membershipsById = {};

  for (const creatorId in byId) {
    const memberships = byId[creatorId];

    if (memberships) {
      memberships.forEach((membership) => {
        membershipsById[membership.membership_id] = membership;
      });
    }
  }

  return membershipsById;
});

export const selectMembershipForId = (state: State, id: string) => selectMembershipsById(state)[id];

export const selectMembershipsByIdForChannelIds = createSelector(
  (state, ids) => ids,
  selectMembershipsListByCreatorId,
  (ids, byId) => {
    const membershipsById = {};

    ids.forEach((id) => {
      const membershipForId = byId[id];
      if (membershipForId) membershipsById[id] = membershipForId;
    });

    return membershipsById;
  }
);

export const selectIndexForCreatorMembership = (state: State, creatorId: string, membershipId: number) => {
  const memberships = selectMembershipTiersForCreatorId(state, creatorId);
  if (!memberships) {
    return -1;
  }

  const inx = memberships.findIndex((m) => m.membership_id === membershipId);
  return inx === -1 ? -1 : inx; // removed +1 here
  // .map((m, i) => ({ index: i, id: m.membership.id }))
  // .sort((a, b) => a.id - b.id)
};

export const selectMyMembershipTiersChannelById = (state: State) => {
  const myChannelClaimIds = selectMyChannelClaimIds(state);
  if (!myChannelClaimIds) return myChannelClaimIds;

  return selectMembershipsByIdForChannelIds(state, myChannelClaimIds);
};

export const userHasMembershipTiers = createSelector(selectMyMembershipTiersChannelById, (myMembershipsById) =>
  Boolean(myMembershipsById && Object.values(myMembershipsById).length > 0)
);

export const selectAllMembershipTiersForChannelUri = (state: State, uri: string) =>
  selectMembershipTiersForCreatorId(state, selectChannelClaimIdForUri(state, uri) || '');

// select enabled, monetized memberships (joinable)
export const selectArEnabledMembershipTiersForChannelUri = (state: State, uri: string) => {
  const tiers = selectMembershipTiersForCreatorId(state, selectChannelClaimIdForUri(state, uri) || '');
  if (!tiers) return null;
  // $FlowIgnore
  return tiers.filter((tier) => tier.prices.some((p) => p.address !== '') && tier.enabled); // handle monetization disabled
};

export const selectTierIndexForCreatorIdAndMembershipId = (
  state: State,
  creatorId: string,
  membershipId: number
): number | null => {
  if (!state) return null;
  const memberships = selectMembershipTiersForCreatorId(state, creatorId);

  if (!memberships) return null;

  // Filter memberships by `enabled === true`
  const enabledMemberships = memberships.filter((m) => m.enabled === true);

  // Find the index of the membership with the given `membershipId`
  const index = enabledMemberships.findIndex((m) => m.membership_id === membershipId);

  // Return the index + 1, or undefined if not found
  return index === -1 ? null : index + 1;
};

export const selectOdyseeMembershipTiers = (state: State) =>
  selectMembershipTiersForCreatorId(state, ODYSEE_CHANNEL.ID);

export const selectCreatorMembershipsFetchedByUri = createSelector(
  selectArEnabledMembershipTiersForChannelUri,
  (memberships) => memberships !== undefined
);

export const selectCreatorHasMembershipsByUri = createSelector(
  selectArEnabledMembershipTiersForChannelUri,
  (memberships) => Boolean(memberships?.length > 0 && memberships.some((m) => (m.enabled = true)))
);

// $FlowIgnore
export const selectMyPurchasedMembershipTierForCreatorUri = (state: State, creatorId: string): MembershipTier => {
  const myPurchasedCreatorMemberships = selectMyPurchasedMembershipsForChannelClaimId(state, creatorId);
  if (!myPurchasedCreatorMemberships) return myPurchasedCreatorMemberships;

  const creatorMembershipTiers = selectMembershipTiersForCreatorId(state, creatorId);
  if (!creatorMembershipTiers) return creatorMembershipTiers;

  // This is needed because some data like Perks is present in membership_list call,
  // but returns null on membership_mine
  return Object.assign(
    {},
    myPurchasedCreatorMemberships[0],
    creatorMembershipTiers.find((membershipSub) => membershipSub.membership_id === myPurchasedCreatorMemberships[0].id)
  );
};
export const selectMyPurchasedMembershipTierForCreatorIdAndMembershipId = (
  state: State,
  creatorId: string,
  membershipId: number
) => {
  const myPurchasedCreatorMemberships = selectMyPurchasedMembershipsForChannelClaimId(state, creatorId);
  if (!myPurchasedCreatorMemberships) return myPurchasedCreatorMemberships;

  const creatorMembershipTiers = selectMembershipTiersForCreatorId(state, creatorId);
  if (!creatorMembershipTiers) return creatorMembershipTiers;

  // This is needed because some data like Perks is present in membership_list call,
  // but returns null on membership_mine
  return Object.assign(
    {},
    myPurchasedCreatorMemberships[0],
    creatorMembershipTiers.find((membershipSub) => membershipSub.membership_id === membershipId)
  );
};

export const selectUserValidMembershipForChannelUri = createSelector(
  (state, uri) => selectMyPurchasedMembershipsForChannelClaimId(state, selectChannelClaimIdForUri(state, uri) || ''),
  (purchasedMembershipSubsForChannel) => {
    if (!purchasedMembershipSubsForChannel) return purchasedMembershipSubsForChannel;
    // TODO: think about how to handle canceled memberships
    const activeMemberships = purchasedMembershipSubsForChannel.filter(
      (m) => m.subscription.is_active && m.subscription.status !== 'canceled'
    );
    return activeMemberships[0] || null;
  }
);

export const selectProtectedContentMembershipsForClaimId = (state: State, channelId: string, claimId: string) => {
  const protectedClaimsById = selectProtectedContentClaimsForId(state, channelId);

  return protectedClaimsById && protectedClaimsById[claimId] && protectedClaimsById[claimId].memberships; // array of mids ['1234']
};
export const selectProtectedContentMembershipsForContentClaimId = (state: State, claimId: string) => {
  const claimChannelId = getChannelIdFromClaim(selectClaimForId(state, claimId));
  const protectedClaimsById = claimChannelId && selectProtectedContentClaimsForId(state, claimChannelId);

  return protectedClaimsById && protectedClaimsById[claimId] && protectedClaimsById[claimId].memberships;
};

export const selectContentHasProtectedMembershipIds = (state: State, claimId: string) => {
  const protectedContentMembershipIds = selectProtectedContentMembershipsForContentClaimId(state, claimId);
  const claim = selectClaimForId(state, claimId);
  const protectedContentTag = claim && selectProtectedContentTagForUri(state, claim.permanent_url);

  if (!protectedContentTag) return false;

  return protectedContentMembershipIds && protectedContentMembershipIds.length > 0;
};

export const selectProtectedContentMembershipsForId = (state: State, claimId: ClaimId) => {
  const claimChannelId = getChannelIdFromClaim(selectClaimForId(state, claimId));
  const protectedContentMembershipIds = new Set(
    claimChannelId && selectProtectedContentMembershipsForClaimId(state, claimChannelId, claimId)
  );
  const creatorMemberships = claimChannelId && selectMembershipTiersForCreatorId(state, claimChannelId);

  return (
    creatorMemberships &&
    // $FlowIgnore
    creatorMemberships.filter((membership) => protectedContentMembershipIds.has(membership.membership_id)) // m.Membership.id
  );
};

export const selectMyProtectedContentMembershipForId = createSelector(
  selectProtectedContentMembershipsForId,
  selectMyValidMembershipIds,
  (protectedContentMemberships, validMembershipIds) => {
    if (!protectedContentMemberships) return protectedContentMemberships;

    const validMembershipIdsSet = new Set(validMembershipIds);
    const myMembership = protectedContentMemberships.some((m) => validMembershipIdsSet.has(m.membership_id));
    if (!myMembership) return null;

    return myMembership;
  }
);

export const selectUserIsMemberOfProtectedContentForId = (state: State, claimId: ClaimId) =>
  selectMyProtectedContentMembershipForId(state, claimId);

export const selectNoRestrictionOrUserIsMemberForContentClaimId = (state: State, claimId: ClaimId) => {
  const protectedContentMemberships = selectContentHasProtectedMembershipIds(state, claimId);
  if (protectedContentMemberships === undefined) return false;

  const userHasAccess = selectUserIsMemberOfProtectedContentForId(state, claimId);
  const claimIsMine = selectClaimIsMineForId(state, claimId);

  return Boolean(claimIsMine || !protectedContentMemberships || userHasAccess);
};

export const selectIsProtectedContentLockedFromUserForId = (state: State, claimId: ClaimId) => {
  const protectedContentMemberships = selectContentHasProtectedMembershipIds(state, claimId);
  if (!protectedContentMemberships) return protectedContentMemberships;

  const userHasAccess = selectUserIsMemberOfProtectedContentForId(state, claimId);
  const claimIsMine = selectClaimIsMineForId(state, claimId);

  return Boolean(!claimIsMine && protectedContentMemberships && !userHasAccess);
};

export const selectPendingUnlockedRestrictionsForUri = (state: State, uri: string) => {
  const claimId = selectClaimIdForUri(state, uri);
  const contentRestrictedFromUser = claimId && selectIsProtectedContentLockedFromUserForId(state, claimId);

  // false means no restrictions, undefined === fetching, true === restricted
  // so here, pending means it still doesn't have the "false" to call it unlocked
  const pendingUnlockedRestrictions = contentRestrictedFromUser !== false;

  return pendingUnlockedRestrictions;
};

export const selectMembershipsSortedByPriceForRestrictedIds = createSelector(
  (state, restrictedIds) => restrictedIds,
  selectMembershipsById,
  (restrictedIds, byId) => {
    const memberships = restrictedIds.map((id) => byId[id]);

    return memberships.sort((a, b) => a.prices.amount - b.prices.amount);
  }
);

export const selectCheapestPlanForRestrictedIds = (state: State, restrictedIds: Array<string>) => {
  const sortedMemberships = selectMembershipsSortedByPriceForRestrictedIds(state, restrictedIds);
  return sortedMemberships && sortedMemberships[0];
};

export const selectCheapestProtectedContentMembershipForId = (state: State, claimId: ClaimId) => {
  const claimChannelId = getChannelIdFromClaim(selectClaimForId(state, claimId));
  const protectedContentMembershipIds =
    claimChannelId && selectProtectedContentMembershipsForClaimId(state, claimChannelId, claimId);

  return protectedContentMembershipIds && selectCheapestPlanForRestrictedIds(state, protectedContentMembershipIds);
};

export const selectPriceOfCheapestPlanForClaimId = (state: State, claimId: ClaimId) => {
  const cheapestMembership = selectCheapestProtectedContentMembershipForId(state, claimId);
  if (!cheapestMembership || !cheapestMembership.prices) return undefined;

  return (cheapestMembership.prices[0]?.amount / 100).toFixed(2);
};

export const selectMyMembershipTiersWithExclusiveContentPerk = (state: State, activeChannelClaimId: string) => {
  const membershipTiers: MembershipTiers = selectMembershipTiersForCreatorId(state, activeChannelClaimId);
  return membershipTiers ? filterMembershipTiersWithPerk(membershipTiers, 'Exclusive content') : [];
};

export const selectMyMembershipTiersWithExclusiveLivestreamPerk = (state: State, activeChannelClaimId: string) => {
  const membershipTiers: MembershipTiers = selectMembershipTiersForCreatorId(state, activeChannelClaimId);
  return membershipTiers ? filterMembershipTiersWithPerk(membershipTiers, 'Exclusive livestreams') : [];
};

export const selectMyMembershipTiersWithMembersOnlyChatPerk = (state: State, channelId: string) => {
  const membershipTiers: MembershipTiers = selectMembershipTiersForCreatorId(state, channelId);
  return membershipTiers ? filterMembershipTiersWithPerk(membershipTiers, 'Members-only chat') : [];
};

export const selectMembersOnlyChatMembershipIdsForCreatorId = createSelector(
  selectMembershipTiersForCreatorId,
  (memberships: CreatorMemberships) => {
    if (!memberships) return memberships;

    const membershipIds = new Set([]);

    memberships.forEach(
      (membership: CreatorMembership) =>
        membership.perks &&
        membership.perks.some((perk: MembershipOdyseePerk) => {
          if (perk.id === MEMBERSHIP_CONSTS.ODYSEE_PERKS.MEMBERS_ONLY_CHAT.id) {
            membershipIds.add(membership.membership_id);
            return true;
          }
        })
    );

    return Array.from(membershipIds);
  }
);

export const selectMyMembersOnlyChatMembershipsForCreatorId = createSelector(
  selectMyValidMembershipsForCreatorId,
  (myValidMemberships: MembershipTiers) =>
    myValidMemberships &&
    myValidMemberships.filter(
      (membership: MembershipTier) =>
        membership.perks &&
        membership.perks.some(
          (perk: MembershipOdyseePerk) => perk.id === MEMBERSHIP_CONSTS.ODYSEE_PERKS.MEMBERS_ONLY_CHAT.id
        )
    )
);

export const selectUserIsMemberOfMembersOnlyChatForCreatorId = (state: State, creatorId: ClaimId) => {
  const myMembersOnlyChatMemberships = selectMyMembersOnlyChatMembershipsForCreatorId(state, creatorId);
  return !!myMembersOnlyChatMemberships && myMembersOnlyChatMemberships.length > 0;
};

export const selectNoRestrictionOrUserCanChatForCreatorId = (state: State, creatorId: ClaimId) => {
  const membersOnlyMembershipIds = selectMembersOnlyChatMembershipIdsForCreatorId(state, creatorId);
  if (membersOnlyMembershipIds === undefined) return false;

  const userHasAccess = selectUserIsMemberOfMembersOnlyChatForCreatorId(state, creatorId);
  const claimIsMine = selectClaimIsMineForId(state, creatorId);

  return Boolean(claimIsMine || !membersOnlyMembershipIds || userHasAccess);
};

export const selectChannelHasMembershipTiersForId = (state: State, channelId: string) => {
  const memberships = selectMembershipTiersForCreatorId(state, channelId);
  return memberships && memberships.length > 0;
};

export const selectMembershipTxIncoming = (state: State) => {
  return selectState(state).membershipPaymentsIncoming;
};

export const selectMembershipTxIncomingFetching = (state: State) => {
  return selectState(state).membershipPaymentsIncomingFetching;
};

export const selectMembershipTxIncomingError = (state: State) => {
  return selectState(state).membershipPaymentsIncomingError;
};

export const selectMembershipTxOutgoing = (state: State) => {
  return selectState(state).membershipPaymentsOutgoing;
};

export const selectMembershipTxOutgoingFetching = (state: State) => {
  return selectState(state).membershipPaymentsOutgoingFetching;
};

export const selectMembershipTxOutgoingError = (state: State) => {
  return selectState(state).membershipPaymentsOutgoingError;
};
