// @flow
import { createSelector } from 'reselect';
import { selectChannelClaimIdForUri } from 'redux/selectors/claims';
import { ODYSEE_CHANNEL } from 'constants/channels';
import * as MEMBERSHIP_CONSTS from 'constants/memberships';

type State = { memberships: any };

const selectState = (state: State) => state.memberships || {};

export const selectMembershipMineData = (state: State) => selectState(state).membershipMineByKey;
export const selectMyActiveMembershipsById = (state: State) => selectMembershipMineData(state)?.activeById;
export const selectMyCanceledMembershipsById = (state: State) => selectMembershipMineData(state)?.canceledById;
export const selectMyPurchasedMembershipsById = (state: State) => selectMembershipMineData(state)?.purchasedById;
export const selectMembershipFetchingIdsByChannel = (state: State) => selectState(state).fetchingIds;
export const selectPendingBuyMembershipIds = (state: State) => selectState(state).pendingBuyIds;
export const selectPendingCancelMembershipIds = (state: State) => selectState(state).pendingCancelIds;
export const selectMembershipsFetchedById = (state: State) => selectState(state).fetchedById;
export const selectById = (state: State) => selectState(state).membershipListById || {};
export const selectDidFetchMembershipsDataById = (state: State) => selectState(state).didFetchMembershipsDataById;
export const selectMyMembershipTiers = (state: State) => selectState(state).myMembershipTiers;

export const selectMembershipMineFetched = (state: State) => selectMembershipMineData(state) !== undefined;

export const selectMyActiveMembershipsForChannelClaimId = (state: State, id: string) => {
  const byId = selectMyActiveMembershipsById(state);
  return byId && byId[id];
};

export const selectMyActiveMembershipIds = (state: State, id: string) => {
  const byId = selectMyActiveMembershipsById(state);
  const values = Object.values(byId);
  let activeMembershipIds = [];
  for (const channelId of values) {
    for (const membership of channelId) {
      activeMembershipIds.push(membership.MembershipDetails.id);
    }
  }
  return (activeMembershipIds.length && activeMembershipIds) || null;
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
  selectPendingBuyMembershipIds(state).includes(id);
export const selectCancelIsPendingForMembershipId = (state: State, id: string) =>
  selectPendingCancelMembershipIds(state).includes(id);

export const selectFetchingIdsForMembershipChannelId = (state: State, channelId: string) => {
  const fetchingIdsById = selectMembershipFetchingIdsByChannel(state);
  return fetchingIdsById[channelId];
};

export const selectFetchedIdsForMembershipChannelId = (state: State, channelId: string) => {
  const fetchedById = selectMembershipsFetchedById(state);
  return fetchedById[channelId];
};

export const selectCreatorIdMembershipForChannelId = (state: State, creatorId: string, channelId: string) => {
  const fetchedMemberships = selectFetchedIdsForMembershipChannelId(state, creatorId);
  return fetchedMemberships && fetchedMemberships[channelId];
};
export const selectOdyseeMembershipForChannelId = (state: State, channelId: string) =>
  selectCreatorIdMembershipForChannelId(state, ODYSEE_CHANNEL.ID, channelId);
export const selectOdyseeMembershipIsPremiumPlus = (state: State, channelId: string) =>
  selectOdyseeMembershipForChannelId(state, channelId) === MEMBERSHIP_CONSTS.ODYSEE_TIER_NAMES.PREMIUM_PLUS;

export const selectMembershipTiersForChannelId = (state: State, channelId: string) => selectById(state)[channelId];
export const selectMembershipTiersForChannelUri = (state: State, uri: string) =>
  selectMembershipTiersForChannelId(state, selectChannelClaimIdForUri(state, uri));

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
  (state, uri) => selectMyPurchasedMembershipsForChannelClaimId(state, selectChannelClaimIdForUri(state, uri)),
  (purchasedMembershipForChannel) => {
    if (!purchasedMembershipForChannel) return purchasedMembershipForChannel;

    // $FlowFixMe
    const subscriptionEndTime = purchasedMembershipForChannel[0].Subscription?.current_period_end;
    const currentTimeInStripeFormat = new Date().getTime() / 1000;
    const membershipIsValid = subscriptionEndTime && currentTimeInStripeFormat < subscriptionEndTime;

    return membershipIsValid ? purchasedMembershipForChannel[0] : null;
  }
);

export const selectProtectedContentMembershipsForClaimId = (state: State, channelId: string, claimId: string) => {
  return state.memberships?.protectedContentClaims[channelId]?.[claimId]?.memberships;
};
