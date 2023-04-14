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
  // Can't seem to import selectors from Comments slice, so just access directly.
  // Maybe related to https://github.com/OdyseeTeam/odysee-frontend/issues/764
  (state) => state.blocked.blockedChannels,
  (state) => state.comments.moderationBlockList,
  (mutedUris, blockedUris) => {
    const allUris = (mutedUris || []).concat(blockedUris || []);
    const allIds = allUris.map((uri) => parseURI(uri).channelClaimId);
    const uniqueSet = new Set(allIds);
    return Array.from(uniqueSet).sort();
  }
);
