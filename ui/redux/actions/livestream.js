// @flow
import Livestream from 'livestream';

import * as ACTIONS from 'constants/action_types';

import { transformNewLivestreamData } from 'util/livestream';
import { FETCH_ACTIVE_LIVESTREAMS_MIN_INTERVAL_MS } from 'constants/livestream';
import { getChannelIdFromClaim } from 'util/claim';

import {
  selectIsLiveFetchingForId,
  selectActiveLivestreamsFetchingForQuery,
  selectActiveLivestreamsLastFetchedDateForQuery,
  selectActiveLivestreamsLastFetchedFailCountForQuery,
} from 'redux/selectors/livestream';

import { doClaimSearch } from 'redux/actions/claims';

// -- Fetches the claims for the returned active livestreams, and filter based on the query (language, etc)
// -- Since currently it only uses the lang param, it would be better if the backend could return us the appropriate
// -- active livestreams with a given language param
const doFetchActiveLivestreamsForQuery = (
  livestreamInfoByCreatorId: LivestreamInfoByCreatorIds,
  query?: { any_languages: ?Array<string> } = { any_languages: null }
) => async (dispatch: Dispatch) => {
  const { any_languages: lang } = query;

  const activeLivestreamIds = [];

  for (const creatorId in livestreamInfoByCreatorId) {
    const {
      activeClaim: { claimId },
    }: LivestreamInfo = livestreamInfoByCreatorId[creatorId];

    if (claimId) activeLivestreamIds.push(claimId);
  }

  const activeLivestreamClaims = await dispatch(
    doClaimSearch(
      {
        page: 1,
        page_size: 50,
        has_no_source: true,
        claim_ids: activeLivestreamIds,
        claim_type: ['stream'],
        no_totals: true,
        ...(lang ? { any_languages: lang } : {}),
      },
      { useAutoPagination: true }
    )
  );

  const searchedActiveLivestreams = {};

  for (const uri in activeLivestreamClaims) {
    const claim = activeLivestreamClaims[uri].stream;
    const channelId = getChannelIdFromClaim(claim);

    if (channelId) {
      searchedActiveLivestreams[channelId] = livestreamInfoByCreatorId[channelId];
    }
  }

  return searchedActiveLivestreams;
};

export const doFetchChannelIsLiveForId = (channelId: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const alreadyFetching = selectIsLiveFetchingForId(state, channelId);

  if (alreadyFetching) return;

  dispatch({ type: ACTIONS.LIVESTREAM_IS_LIVE_START, data: channelId });

  return Livestream.call('livestream', 'is_live', { channel_claim_id: channelId })
    .then(async (response: LivestreamIsLiveResponse) => {
      const livestreamInfoByCreatorId: LivestreamInfoByCreatorIds = transformNewLivestreamData([response]);
      return dispatch({ type: ACTIONS.LIVESTREAM_IS_LIVE_COMPLETE, data: livestreamInfoByCreatorId });
    })
    .catch(() => dispatch({ type: ACTIONS.LIVESTREAM_IS_LIVE_COMPLETE, data: { [channelId]: null } }));
};

export const doFetchAllActiveLivestreamsForQuery = (
  query?: { any_languages: ?Array<string> } = { any_languages: null }
) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const queryStr = JSON.stringify(query);
  const alreadyFetching = selectActiveLivestreamsFetchingForQuery(state, queryStr);

  if (alreadyFetching) return;

  const now = Date.now();
  const activeLivestreamsLastFetchedDate = selectActiveLivestreamsLastFetchedDateForQuery(state, queryStr);
  const timeDelta = Number.isInteger(activeLivestreamsLastFetchedDate) && now - activeLivestreamsLastFetchedDate;

  if (Number.isInteger(timeDelta) && timeDelta < FETCH_ACTIVE_LIVESTREAMS_MIN_INTERVAL_MS) {
    const failCount = selectActiveLivestreamsLastFetchedFailCountForQuery(state, queryStr);

    if (failCount === 0 || failCount >= 3) {
      // Just fetched successfully, or failed 3 times. Skip for FETCH_ACTIVE_LIVESTREAMS_MIN_INTERVAL_MS.
      return;
    }
  }

  const completedParams = { query: queryStr, date: now };

  dispatch({ type: ACTIONS.FETCH_ACTIVE_LIVESTREAMS_START, data: queryStr });

  return Livestream.call('livestream', 'all')
    .then(async (response: LivestreamAllResponse) => {
      const livestreamInfoByCreatorId: LivestreamInfoByCreatorIds = transformNewLivestreamData(response);

      const activeLivestreamResolvedByCreatorId = await dispatch(
        doFetchActiveLivestreamsForQuery(livestreamInfoByCreatorId, query)
      );

      dispatch({
        type: ACTIONS.FETCH_ACTIVE_LIVESTREAMS_SUCCESS,
        data: { ...completedParams, livestreamInfoByCreatorId: activeLivestreamResolvedByCreatorId },
      });
    })
    .catch(() => dispatch({ type: ACTIONS.FETCH_ACTIVE_LIVESTREAMS_FAIL, data: completedParams }));
};

export const doSetIsLivePollingForChannelId = (channelId: string, isPolling: boolean) => (dispatch: Dispatch) =>
  dispatch({ type: ACTIONS.SET_IS_LIVE_POLLING_FOR_ID, data: { channelId, isPolling } });
