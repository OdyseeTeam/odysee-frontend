// @flow

import * as ACTIONS from 'constants/action_types';
import { handleActions } from 'util/redux-utils';

type LivestreamState = {
  livestreamInfoByCreatorId: LivestreamInfoByCreatorIds,
  activeLivestreamByCreatorId: { [creatorId: string]: ?LivestreamActiveClaim },
  futureLivestreamsByCreatorId: { [creatorId: string]: ?Array<LivestreamActiveClaim> },
  pastLivestreamsByCreatorId: { [creatorId: string]: ?Array<LivestreamActiveClaim> },
  viewersById: { [claimId: string]: number },
  isLiveFetchingIds: Array<string>,
  activeLivestreamsFetchingQueries: Array<string>,
  activeCreatorLivestreamsByQuery: {
    [query: string]: { creatorIds: ?Array<string>, lastFetchedDate: number, lastFetchedFailCount: number },
  },
  socketConnectionById: { [id: string]: { connected: ?boolean, sub_category: ?string } },
  isLivePollingChannelIds: Array<string>,
};

const defaultState: LivestreamState = {
  livestreamInfoByCreatorId: {},
  activeLivestreamByCreatorId: {},
  futureLivestreamsByCreatorId: {},
  pastLivestreamsByCreatorId: {},
  viewersById: {},
  isLiveFetchingIds: [],
  activeLivestreamsFetchingQueries: [],
  activeCreatorLivestreamsByQuery: {},
  socketConnectionById: {},
  isLivePollingChannelIds: [],
};

function updateActiveLivestreams(state: LivestreamState, livestreamInfoByCreatorId: LivestreamInfoByCreatorIds) {
  const newActiveLivestreamByCreatorId = Object.assign({}, state.activeLivestreamByCreatorId);
  const newFutureLivestreamsByCreatorId = Object.assign({}, state.futureLivestreamsByCreatorId);
  const newPastLivestreamsByCreatorId = Object.assign({}, state.pastLivestreamsByCreatorId);

  for (const creatorId in livestreamInfoByCreatorId) {
    const { isLive, activeClaim, futureClaims, pastClaims }: LivestreamInfo = livestreamInfoByCreatorId[creatorId];

    newActiveLivestreamByCreatorId[creatorId] = isLive ? activeClaim : null;

    if (futureClaims) {
      newFutureLivestreamsByCreatorId[creatorId] = futureClaims;
    }

    if (pastClaims) {
      newPastLivestreamsByCreatorId[creatorId] = pastClaims;
    }
  }

  return {
    activeLivestreamByCreatorId: newActiveLivestreamByCreatorId,
    futureLivestreamsByCreatorId: newFutureLivestreamsByCreatorId,
    pastLivestreamsByCreatorId: newPastLivestreamsByCreatorId,
  };
}

function handleFetchActiveLivestreamsComplete(state: LivestreamState, query: string) {
  const newActiveLivestreamsFetchingQueries = new Set(state.activeLivestreamsFetchingQueries);
  if (newActiveLivestreamsFetchingQueries.has(query)) newActiveLivestreamsFetchingQueries.delete(query);

  return { activeLivestreamsFetchingQueries: Array.from(newActiveLivestreamsFetchingQueries) };
}

/**
 * Update state.viewersById with the latest data
 * @param {object} state - LivestreamState
 * @param {object} livestreamInfoByCreatorId - streams with fetched data
 * @returns {*} - updated viewersById object if active streams passed, otherwise return old data
 */
function updateViewersById(state: LivestreamState, livestreamInfoByCreatorId: ?LivestreamInfoByCreatorIds) {
  if (!livestreamInfoByCreatorId) return {};

  const newViewersById = Object.assign({}, state.viewersById);

  for (const creatorId in livestreamInfoByCreatorId) {
    const { activeClaim, viewCount }: LivestreamInfo = livestreamInfoByCreatorId[creatorId];

    if (activeClaim.claimId && Number.isInteger(viewCount)) {
      newViewersById[activeClaim.claimId] = viewCount;
    }
  }

  return { viewersById: newViewersById };
}

export default handleActions(
  {
    [ACTIONS.VIEWERS_RECEIVED]: (state: LivestreamState, action: any) => {
      const { connected, claimId } = action.data;
      const newViewersById = Object.assign({}, state.viewersById);
      newViewersById[claimId] = connected;
      return { ...state, viewersById: newViewersById };
    },

    [ACTIONS.FETCH_ACTIVE_LIVESTREAMS_START]: (state: LivestreamState, action: any) => {
      const query = action.data;

      const newActiveLivestreamsFetchingQueries = new Set(state.activeLivestreamsFetchingQueries);
      newActiveLivestreamsFetchingQueries.add(query);

      return { ...state, activeLivestreamsFetchingQueries: Array.from(newActiveLivestreamsFetchingQueries) };
    },
    [ACTIONS.FETCH_ACTIVE_LIVESTREAMS_FAIL]: (state: LivestreamState, action: any) => {
      const { query, date } = action.data;

      const newActiveCreatorLivestreamsByQuery = Object.assign({}, state.activeCreatorLivestreamsByQuery);

      const { lastFetchedFailCount: previousLastFetchedFailCount } = newActiveCreatorLivestreamsByQuery[query] || {};
      const newLastFetchedFailCount = (previousLastFetchedFailCount || 0) + 1;

      newActiveCreatorLivestreamsByQuery[query] = {
        creatorIds: null,
        lastFetchedDate: date,
        lastFetchedFailCount: newLastFetchedFailCount,
      };

      return {
        ...state,
        activeCreatorLivestreamsByQuery: newActiveCreatorLivestreamsByQuery,
        ...handleFetchActiveLivestreamsComplete(state, query),
      };
    },
    [ACTIONS.FETCH_ACTIVE_LIVESTREAMS_SUCCESS]: (state: LivestreamState, action: any) => {
      const { query, livestreamInfoByCreatorId, date } = action.data;

      const newLivestreamInfoByCreatorId = Object.assign(
        {},
        state.livestreamInfoByCreatorId,
        livestreamInfoByCreatorId
      );

      const newActiveCreatorLivestreamsByQuery = Object.assign({}, state.activeCreatorLivestreamsByQuery);
      newActiveCreatorLivestreamsByQuery[query] = {
        creatorIds: Object.keys(livestreamInfoByCreatorId),
        lastFetchedDate: date,
        lastFetchedFailCount: 0,
      };

      return {
        ...state,
        activeCreatorLivestreamsByQuery: newActiveCreatorLivestreamsByQuery,
        livestreamInfoByCreatorId: newLivestreamInfoByCreatorId,
        ...updateViewersById(state, newLivestreamInfoByCreatorId),
        ...handleFetchActiveLivestreamsComplete(state, query),
        ...updateActiveLivestreams(state, livestreamInfoByCreatorId),
      };
    },

    [ACTIONS.LIVESTREAM_IS_LIVE_START]: (state: LivestreamState, action: any) => {
      const channelId = action.data;

      const newIsLiveFetchingIds = new Set(state.isLiveFetchingIds);
      newIsLiveFetchingIds.add(channelId);

      return { ...state, isLiveFetchingIds: Array.from(newIsLiveFetchingIds) };
    },
    [ACTIONS.LIVESTREAM_IS_LIVE_COMPLETE]: (state: LivestreamState, action: any) => {
      const livestreamInfoByCreatorId: LivestreamInfoByCreatorIds = action.data;
      const channelId = Object.keys(livestreamInfoByCreatorId)[0];

      const newIsLiveFetchingIds = new Set(state.isLiveFetchingIds);
      if (newIsLiveFetchingIds.has(channelId)) newIsLiveFetchingIds.delete(channelId);

      const newLivestreamInfoByCreatorId = Object.assign(
        {},
        state.livestreamInfoByCreatorId,
        livestreamInfoByCreatorId
      );

      return {
        ...state,
        isLiveFetchingIds: Array.from(newIsLiveFetchingIds),
        livestreamInfoByCreatorId: newLivestreamInfoByCreatorId,
        ...updateViewersById(state, newLivestreamInfoByCreatorId),
        ...updateActiveLivestreams(state, livestreamInfoByCreatorId),
      };
    },

    [ACTIONS.SOCKET_CONNECTED_BY_ID]: (state: LivestreamState, action: any) => {
      const { connected, sub_category, id: claimId } = action.data;

      const socketConnectionById = Object.assign({}, state.socketConnectionById);
      socketConnectionById[claimId] = { connected, sub_category };

      return { ...state, socketConnectionById };
    },

    [ACTIONS.SET_IS_LIVE_POLLING_FOR_ID]: (state: LivestreamState, action: any) => {
      const { channelId, isPolling } = action.data;

      const newIsLivePollingChannelIds = new Set(state.isLivePollingChannelIds);

      if (isPolling) {
        newIsLivePollingChannelIds.add(channelId);
      } else {
        newIsLivePollingChannelIds.delete(channelId);
      }

      return { ...state, isLivePollingChannelIds: Array.from(newIsLivePollingChannelIds) };
    },
  },
  defaultState
);
