// @flow
import { parseURI } from 'util/lbryURI';
import { createSelector } from 'reselect';
import { createCachedSelector } from 're-reselect';

const selectState = (state) => state.memberships || {};

export const selectMembershipMineData = (state) => selectState(state).membershipMine;
export const selectMembershipMineStarted = (state) => selectState(state).fetchStarted;
export const selectById = (state) => selectState(state).membershipListById || {};

export const selectMembershipListByChannelId = createSelector(
  (state, channelId) => channelId,
  selectById,
  (channelId, byId) => byId[channelId]
);

export const selectCreatorMembershipsFetchedById = createSelector(
  selectMembershipListByChannelId,
  (memberships) => memberships !== undefined
);

export const selectCreatorHasMembershipsById = createSelector(selectMembershipListByChannelId, (memberships) =>
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

    const activeMembershipForChannel = activeMemberships?.find(
      (membership) => membership.Membership.channel_name === `@${channelName}`
    );

    return activeMembershipForChannel || null;
  }
)((state, uri) => `${String(uri)}`);

export const selectActiveMembershipNameForChannelUri = createSelector(
  selectActiveMembershipForChannelUri,
  (membership) => membership?.MembershipDetails?.name
);
