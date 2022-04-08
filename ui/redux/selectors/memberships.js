// @flow
import { parseURI } from 'util/lbryURI';
import { createSelector } from 'reselect';
import { createCachedSelector } from 're-reselect';

const selectState = (state) => state.memberships || {};

export const selectMembershipMineData = (state) => selectState(state).membershipMine;
export const selectMembershipMineStarted = (state) => selectState(state).fetchStarted;

export const selectMembershipForChannelUri = createCachedSelector(
  (state, uri) => uri,
  selectMembershipMineData,
  (uri: String, membershipMine: ?any) => {
    const { channelName } = parseURI(uri);

    const activeMemberships = membershipMine?.activeMemberships;
    const activeMembershipForChannel = activeMemberships?.find(
      (membership) => membership.Membership.channel_name === `@${channelName}`
    );

    return activeMembershipForChannel;
  }
)((state, uri) => `${String(uri)}`);

export const selectMembershipNameForChannelUri = createSelector(selectMembershipForChannelUri, (membership) => {
  return membership?.MembershipDetails?.name;
});
