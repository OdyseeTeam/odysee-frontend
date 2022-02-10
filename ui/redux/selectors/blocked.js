// @flow
import { createCachedSelector } from 're-reselect';
import { createSelector } from 'reselect';
import { splitBySeparator } from 'util/lbryURI';

type State = { blocked: BlocklistState };

const selectState = (state: State) => state.blocked || {};

export const selectMutedChannels = (state: State) => selectState(state).blockedChannels;

export const selectChannelIsMuted = createCachedSelector(
  (state, uri) => uri,
  selectMutedChannels,
  (uri, mutedChannels) => {
    return mutedChannels.includes(uri);
  }
)((state, uri) => String(uri));

export const selectMutedAndBlockedChannelIds = createSelector(
  selectState,
  (state) => state.comments,
  (state, commentsState) => {
    const mutedUris = state.blockedChannels;
    const blockedUris = commentsState.moderationBlockList;
    return Array.from(
      new Set((mutedUris || []).concat(blockedUris || []).map((uri) => splitBySeparator(uri)[1]))
    ).sort();
  }
);
