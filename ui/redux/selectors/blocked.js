// @flow
import { createSelector } from 'reselect';
import { parseURI } from 'util/lbryURI';

type State = { blocked: BlocklistState, comments: CommentsState };

const selectState = (state: State) => state.blocked || {};

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
    const uniqueSet = new Set();

    allUris.forEach((u) => {
      try {
        uniqueSet.add(parseURI(u).channelClaimId);
      } catch {}
    });

    return Array.from(uniqueSet).sort();
  }
);
