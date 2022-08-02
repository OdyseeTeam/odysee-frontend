// @flow
import { parseURI } from 'util/lbryURI';
import { createSelector } from 'reselect';
import { createCachedSelector } from 're-reselect';
import { selectChannelClaimIdForUri } from 'redux/selectors/claims';

type State = { memberships: any };

const selectState = (state: State) => state.memberships || {};

export const selectMembershipMineData = (state: State) => selectState(state).membershipMine;
export const selectMembershipMineStarted = (state: State) => selectState(state).fetchStarted;
export const selectMembershipsFetchedById = (state: State) => selectState(state).fetchedById;
export const selectById = (state: State) => selectState(state).membershipListById || {};
export const selectDidFetchMembershipsDataById = (state) => selectState(state).didFetchMembershipsDataById;

export const didFetchById = createSelector(
  (state, channelId) => channelId,
  selectDidFetchMembershipsDataById,
  (channelId, byId) => byId && byId[channelId]
);

export const selectMyActiveMemberships = createSelector(
  selectMembershipMineData,
  (memberships) => memberships?.activeMemberships
);

export const selectChannelMembershipListByUri = createSelector(
  selectChannelClaimIdForUri,
  selectById,
  (channelId, byId) => byId[channelId]
);

export const selectCreatorMembershipsFetchedByUri = createSelector(
  selectChannelMembershipListByUri,
  (memberships) => memberships !== undefined
);

export const selectCreatorHasMembershipsByUri = createSelector(selectChannelMembershipListByUri, (memberships) =>
  Boolean(memberships?.length > 0)
);

export const selectMembershipMineFetched = createSelector(
  selectMembershipMineData,
  (membershipMine) => membershipMine !== undefined
);

export const selectActiveMembershipForChannelUri = createCachedSelector(
  (state, uri) => uri,
  selectMembershipMineData,
  (uri, membershipMine) => {
    const { channelName } = parseURI(uri);

    const activeMemberships = membershipMine?.activeMemberships;

    if (activeMemberships === undefined) return undefined;

    // $FlowFixMe
    const activeMembershipForChannel = activeMemberships?.find(
      (membership) => membership.MembershipDetails.channel_name === `@${channelName || ''}`
    );

    return activeMembershipForChannel || null;
  }
)((state, uri) => `${String(uri)}`);

export const selectUserPurchasedMembershipForChannelUri = createCachedSelector(
  (state, uri) => uri,
  selectMembershipMineData,
  (uri, membershipMine) => {
    const { channelName } = parseURI(uri);

    const purchasedMemberships = membershipMine?.purchasedMemberships;

    if (purchasedMemberships === undefined) return undefined;

    // $FlowFixMe
    const purchasedMembershipForChannel = purchasedMemberships?.find(
      (membership) => membership.MembershipDetails.channel_name === `@${channelName || ''}`
    );

    return purchasedMembershipForChannel || null;
  }
)((state, uri) => `${String(uri)}`);

export const selectUserValidMembershipForChannelUri = createCachedSelector(
  (state, uri) => uri,
  selectMembershipMineData,
  (uri, membershipMine) => {
    const { channelName } = parseURI(uri);

    const purchasedMemberships = membershipMine?.purchasedMemberships;

    if (purchasedMemberships === undefined) return undefined;

    // $FlowFixMe
    const purchasedMembershipForChannel = purchasedMemberships?.find(
      (membership) => membership.MembershipDetails.channel_name === `@${channelName || ''}`
    );

    const subscriptionEndTime = purchasedMembershipForChannel?.Subscription?.current_period_end;

    const currentTimeInStripeFormat = new Date().getTime() / 1000;

    const membershipIsValid = currentTimeInStripeFormat < subscriptionEndTime;

    return membershipIsValid ? purchasedMembershipForChannel : null;
  }
)((state, uri) => `${String(uri)}`);

export const selectActiveMembershipNameForChannelUri = createSelector(
  selectActiveMembershipForChannelUri,
  (membership) => membership?.MembershipDetails?.name
);
