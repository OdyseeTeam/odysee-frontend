// @flow

import * as ACTIONS from 'constants/action_types';
import { handleActions } from 'util/redux-utils';

type LivestreamState = {
  activeLivestreamByCreatorId: ?ActiveLivestreamByCreatorIds,
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
  activeLivestreamByCreatorId: {},
  viewersById: {},
  isLiveFetchingIds: [],
  activeLivestreamsFetchingQueries: [],
  activeCreatorLivestreamsByQuery: {},
  socketConnectionById: {},
  isLivePollingChannelIds: [],
};

function handleFetchActiveLivestreamsComplete(state: LivestreamState, query: string) {
  const newActiveLivestreamsFetchingQueries = new Set(state.activeLivestreamsFetchingQueries);
  if (newActiveLivestreamsFetchingQueries.has(query)) newActiveLivestreamsFetchingQueries.delete(query);

  return { activeLivestreamsFetchingQueries: Array.from(newActiveLivestreamsFetchingQueries) };
}

/**
 * Update state.viewersById with the latest data
 * @param {object} state - LivestreamState
 * @param {object} activeLivestreamByCreatorId - streams with fetched data
 * @returns {*} - updated viewersById object if active streams passed, otherwise return old data
 */
function updateViewersById(state: LivestreamState, activeLivestreamByCreatorId: ?ActiveLivestreamByCreatorIds) {
  if (!activeLivestreamByCreatorId) return {};

  const newViewersById = Object.assign({}, state.viewersById);

  for (const creatorId in activeLivestreamByCreatorId) {
    const activeCreatorLivestream: ActiveLivestream = activeLivestreamByCreatorId[creatorId];

    if (
      activeCreatorLivestream &&
      activeCreatorLivestream.claimId &&
      Number.isInteger(activeCreatorLivestream.viewCount)
    ) {
      newViewersById[activeCreatorLivestream.claimId] = activeCreatorLivestream.viewCount;
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
      const { query, activeLivestreamByCreatorId, date } = action.data;

      const newActiveCreatorLivestreamsByQuery = Object.assign({}, state.activeCreatorLivestreamsByQuery);
      newActiveCreatorLivestreamsByQuery[query] = {
        creatorIds: Object.keys(activeLivestreamByCreatorId),
        lastFetchedDate: date,
        lastFetchedFailCount: 0,
      };

      return {
        ...state,
        activeCreatorLivestreamsByQuery: newActiveCreatorLivestreamsByQuery,
        activeLivestreamByCreatorId: activeLivestreamByCreatorId,
        ...updateViewersById(state, activeLivestreamByCreatorId),
        ...handleFetchActiveLivestreamsComplete(state, query),
      };
    },

    [ACTIONS.LIVESTREAM_IS_LIVE_START]: (state: LivestreamState, action: any) => {
      const channelId = action.data;

      const newIsLiveFetchingIds = new Set(state.isLiveFetchingIds);
      newIsLiveFetchingIds.add(channelId);

      return { ...state, isLiveFetchingIds: Array.from(newIsLiveFetchingIds) };
    },
    [ACTIONS.LIVESTREAM_IS_LIVE_COMPLETE]: (state: LivestreamState, action: any) => {
      const channelStatus: ActiveLivestreamByCreatorIds = action.data;
      const channelId = Object.keys(channelStatus)[0];

      const newIsLiveFetchingIds = new Set(state.isLiveFetchingIds);
      if (newIsLiveFetchingIds.has(channelId)) newIsLiveFetchingIds.delete(channelId);

      const newActiveLivestreams = Object.assign({}, state.activeLivestreamByCreatorId, channelStatus);

      return {
        ...state,
        isLiveFetchingIds: Array.from(newIsLiveFetchingIds),
        activeLivestreamByCreatorId: newActiveLivestreams,
        ...updateViewersById(state, newActiveLivestreams),
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
