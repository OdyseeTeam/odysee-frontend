// @flow

import * as ACTIONS from 'constants/action_types';
import { handleActions } from 'util/redux-utils';

const defaultState: LivestreamState = {
  fetchingById: {},
  viewersById: {},
  isLiveFetchingIds: [],
  activeLivestreamsFetchingQueries: [],
  activeLivestreamsByQuery: {},
  activeLivestreams: {},
  activeLivestreamsLastFetchedDateByQuery: {},
  activeLivestreamsLastFetchedFailCount: 0,
  socketConnectionById: {},
  isLivePollingChannelIds: [],
};

/**
 * Update state.viewersById with the latest data
 * @param {object} activeLivestreams - streams with fetched data
 * @param {object} originalState - streams with only their view counts
 * @returns {*} - updated viewersById object if active streams passed, otherwise return old data
 */
function updateViewersById(activeLivestreams, originalState) {
  if (activeLivestreams) {
    const viewersById = Object.assign({}, originalState);
    Object.values(activeLivestreams).forEach((data) => {
      // $FlowFixMe: mixed
      if (data && data.claimId && data.viewCount) {
        // $FlowFixMe: mixed
        viewersById[data.claimId] = data.viewCount;
      }
    });
    return viewersById;
  }

  return originalState;
}

export default handleActions(
  {
    [ACTIONS.FETCH_NO_SOURCE_CLAIMS_STARTED]: (state: LivestreamState, action: any): LivestreamState => {
      const claimId = action.data;
      const newIdsFetching = Object.assign({}, state.fetchingById);
      newIdsFetching[claimId] = true;

      return { ...state, fetchingById: newIdsFetching };
    },
    [ACTIONS.FETCH_NO_SOURCE_CLAIMS_COMPLETED]: (state: LivestreamState, action: any): LivestreamState => {
      const claimId = action.data;
      const newIdsFetching = Object.assign({}, state.fetchingById);
      newIdsFetching[claimId] = false;

      return { ...state, fetchingById: newIdsFetching };
    },
    [ACTIONS.FETCH_NO_SOURCE_CLAIMS_FAILED]: (state: LivestreamState, action: any) => {
      const claimId = action.data;
      const newIdsFetching = Object.assign({}, state.fetchingById);
      newIdsFetching[claimId] = false;

      return { ...state, fetchingById: newIdsFetching };
    },
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

      const newActiveLivestreamsFetchingQueries = new Set(state.activeLivestreamsFetchingQueries);
      newActiveLivestreamsFetchingQueries.delete(query);

      const newActiveLivestreamsLastFetchedDateByQuery = Object.assign(
        {},
        state.activeLivestreamsLastFetchedDateByQuery
      );
      newActiveLivestreamsLastFetchedDateByQuery[query] = date;

      return {
        ...state,
        activeLivestreamsFetchingQueries: Array.from(newActiveLivestreamsFetchingQueries),
        activeLivestreamsLastFetchedDateByQuery: newActiveLivestreamsLastFetchedDateByQuery,
        activeLivestreamsLastFetchedFailCount: state.activeLivestreamsLastFetchedFailCount + 1,
      };
    },
    [ACTIONS.FETCH_ACTIVE_LIVESTREAMS_SUCCESS]: (state: LivestreamState, action: any) => {
      const { query, activeLivestreams, date } = action.data;

      const newActiveLivestreamsFetchingQueries = new Set(state.activeLivestreamsFetchingQueries);
      if (newActiveLivestreamsFetchingQueries.has(query)) {
        newActiveLivestreamsFetchingQueries.delete(query);
      }

      const newActiveLivestreamsByQuery = Object.assign({}, state.activeLivestreamsByQuery);
      newActiveLivestreamsByQuery[query] = activeLivestreams;

      const newActiveLivestreamsLastFetchedDateByQuery = Object.assign(
        {},
        state.activeLivestreamsLastFetchedDateByQuery
      );
      newActiveLivestreamsLastFetchedDateByQuery[query] = date;

      return {
        ...state,
        activeLivestreamsFetchingQueries: Array.from(newActiveLivestreamsFetchingQueries),
        activeLivestreamsByQuery: newActiveLivestreamsByQuery,
        activeLivestreams,
        activeLivestreamsLastFetchedDateByQuery: newActiveLivestreamsLastFetchedDateByQuery,
        activeLivestreamsLastFetchedFailCount: 0,
        viewersById: updateViewersById(activeLivestreams, state.viewersById),
      };
    },

    [ACTIONS.LIVESTREAM_IS_LIVE_START]: (state: LivestreamState, action: any) => {
      const channelId = action.data;

      const newIsLiveFetchingIds = new Set(state.isLiveFetchingIds);
      newIsLiveFetchingIds.add(channelId);

      return { ...state, isLiveFetchingIds: Array.from(newIsLiveFetchingIds) };
    },
    [ACTIONS.LIVESTREAM_IS_LIVE_COMPLETE]: (state: LivestreamState, action: any) => {
      const channelStatus: ActiveLivestreamInfosById = action.data;
      const channelId = Object.keys(channelStatus)[0];

      const newIsLiveFetchingIds = new Set(state.isLiveFetchingIds);
      if (newIsLiveFetchingIds.has(channelId)) newIsLiveFetchingIds.delete(channelId);

      const newActiveLivestreams = Object.assign({}, state.activeLivestreams, channelStatus);

      return {
        ...state,
        isLiveFetchingIds: Array.from(newIsLiveFetchingIds),
        activeLivestreams: newActiveLivestreams,
        viewersById: updateViewersById(newActiveLivestreams, state.viewersById),
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
