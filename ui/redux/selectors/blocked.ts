import { createSelector } from 'reselect';
import { Container } from 'util/container';
import { parseURI } from 'util/lbryURI';
import { EMPTY_OBJECT } from 'redux/selectors/empty';

const selectState = (state: State) => state.blocked || EMPTY_OBJECT;

export const selectMutedChannels = (state: State) => selectState(state).blockedChannels;
export const selectGeoBlockLists = (state: State) => selectState(state).geoBlockedList;
export const makeSelectChannelIsMuted = (uri: string) =>
  createSelector(selectMutedChannels, (state: Array<string>) => {
    return state.includes(uri);
  });
export const selectMutedAndBlockedChannelIds = createSelector(
  (state) => state.blocked.blockedChannels,
  (state) => state.comments.moderationBlockList,
  (mutedUris, blockedUris) => {
    const allUris = (mutedUris || []).concat(blockedUris || []);
    const uniqueSet = new Set<string>();
    allUris.forEach((u) => {
      try {
        const channelClaimId = parseURI(u).channelClaimId;
        if (channelClaimId) uniqueSet.add(channelClaimId);
      } catch {}
    });
    return Container.Arr.useStableEmpty([...uniqueSet].sort((a, b) => a.localeCompare(b)));
  }
);
export const selectGblAvailable = (state: State) => {
  return state.blocked.gblFetchFailed === false && state.user.localeFailed === false;
};
