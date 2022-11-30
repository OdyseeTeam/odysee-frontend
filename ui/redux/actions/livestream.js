// @flow
import moment from 'moment';
import Livestream from 'livestream';

import * as ACTIONS from 'constants/action_types';

import { transformNewLivestreamData, determineLiveClaim, filterUpcomingLiveStreamClaims } from 'util/livestream';
import { isEmpty } from 'util/object';
import { FETCH_ACTIVE_LIVESTREAMS_MIN_INTERVAL_MS } from 'constants/livestream';
import { getChannelIdFromClaim } from 'util/claim';

import {
  selectIsLiveFetchingForId,
  selectActiveLivestreamsFetchingForQuery,
  selectActiveLivestreamsLastFetchedDateForQuery,
  selectActiveLivestreamsLastFetchedFailCount,
} from 'redux/selectors/livestream';

import { doClaimSearch } from 'redux/actions/claims';

const findActiveStreams = (
  activeLivestreams: ActiveLivestreamInfosById,
  orderBy: Array<string>,
  lang: ?Array<string> = null
) => async (dispatch: Dispatch) => {
  const livestreamsToSearch = lang ? activeLivestreams : {};

  if (!lang) {
    Object.values(activeLivestreams).forEach((activeLivestream) => {
      // $FlowFixMe
      if (!activeLivestream.claimId || !activeLivestream.claimUri) {
        // $FlowFixMe
        livestreamsToSearch[activeLivestream.creatorId] = activeLivestream;
      }
    });

    if (isEmpty(livestreamsToSearch)) {
      return activeLivestreams;
    }
  }

  const liveChannelIds = Object.keys(livestreamsToSearch);

  const claimSearchParams = {
    page: 1,
    page_size: 50,
    has_no_source: true,
    channel_ids: liveChannelIds,
    claim_type: ['stream'],
    limit_claims_per_channel: 1,
    no_totals: true,
    ...(lang ? { any_languages: lang } : {}),
  };
  const claimSearchSettings = { useAutoPagination: true };

  // Find the most recent claims for the channels that are actively broadcasting a stream.
  const mostRecentClaims = await dispatch(
    doClaimSearch({ ...claimSearchParams, order_by: orderBy, release_time: `<${moment().unix()}` }, claimSearchSettings)
  );

  // Find the first upcoming claim (if one exists) for each channel that's actively broadcasting a stream.
  const upcomingClaims = await dispatch(
    doClaimSearch(
      {
        ...claimSearchParams,
        order_by: ['^release_time'],
        release_time: `>${moment().subtract(5, 'minutes').unix()}`,
      },
      claimSearchSettings
    )
  );

  // Filter out any of those claims that aren't scheduled to start within the configured "soon" buffer time (ex. next 15 min).
  const startingSoonClaims = filterUpcomingLiveStreamClaims(upcomingClaims);

  // Reduce the claim list to one "live" claim per channel, based on how close each claim's
  // release time is to the time the channels stream started.
  const allClaims = Object.assign(
    {},
    mostRecentClaims,
    !isEmpty(startingSoonClaims) ? startingSoonClaims : upcomingClaims
  );

  const currentlyLiveClaims = determineLiveClaim(allClaims, livestreamsToSearch);
  const allStreams = { ...activeLivestreams, ...currentlyLiveClaims };
  const searchedLivestreams = {};

  Object.values(currentlyLiveClaims).forEach((claim: any) => {
    const { claim_id: claimId, canonical_url: claimUri } = claim.stream;

    const channelId = getChannelIdFromClaim(claim.stream);

    if (channelId) {
      searchedLivestreams[channelId] = { ...allStreams[channelId], claimId, claimUri };
    }
  });

  return searchedLivestreams;
};

export const doFetchChannelIsLiveForId = (channelId: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const alreadyFetching = selectIsLiveFetchingForId(state, channelId);

  if (alreadyFetching) return;

  dispatch({ type: ACTIONS.LIVESTREAM_IS_LIVE_START, data: channelId });

  return Livestream.call('livestream', 'is_live', { channel_claim_id: channelId })
    .then(async (response: ActiveLivestreamResponse) => {
      if (!response.Live) {
        return dispatch({ type: ACTIONS.LIVESTREAM_IS_LIVE_COMPLETE, data: { [channelId]: null } });
      }

      const activeLivestreamById: ActiveLivestreamInfosById = transformNewLivestreamData([response]);
      const activeLivestream = await dispatch(findActiveStreams(activeLivestreamById, ['release_time']));

      return dispatch({ type: ACTIONS.LIVESTREAM_IS_LIVE_COMPLETE, data: activeLivestream });
    })
    .catch(() => dispatch({ type: ACTIONS.LIVESTREAM_IS_LIVE_COMPLETE, data: { [channelId]: null } }));
};

export const doFetchAllActiveLivestreamsForQuery = (
  query?: { order_by: Array<string>, any_languages: ?Array<string> } = {
    order_by: ['release_time'],
    any_languages: null,
  }
) => async (dispatch: Dispatch, getState: GetState) => {
  const { order_by: orderBy, any_languages: lang } = query;

  const state = getState();
  const queryStr = JSON.stringify(query);
  const alreadyFetching = selectActiveLivestreamsFetchingForQuery(state, queryStr);

  if (alreadyFetching) return;

  const now = Date.now();
  const activeLivestreamsLastFetchedDate = selectActiveLivestreamsLastFetchedDateForQuery(state, queryStr);
  const timeDelta = now - activeLivestreamsLastFetchedDate;

  if (timeDelta < FETCH_ACTIVE_LIVESTREAMS_MIN_INTERVAL_MS) {
    const failCount = selectActiveLivestreamsLastFetchedFailCount(state);

    if (failCount === 0 || failCount > 3) {
      // Just fetched successfully, or failed 3 times. Skip for FETCH_ACTIVE_LIVESTREAMS_MIN_INTERVAL_MS.
      return;
    }
  }

  const completedParams = { query: queryStr, date: now };

  dispatch({ type: ACTIONS.FETCH_ACTIVE_LIVESTREAMS_START, data: queryStr });

  return Livestream.call('livestream', 'all')
    .then(async (response: LivestreamAllResponse) => {
      const activeLivestreams: ActiveLivestreamInfosById = transformNewLivestreamData(response);

      const activeStreams = await dispatch(findActiveStreams(activeLivestreams, orderBy, lang));

      dispatch({
        type: ACTIONS.FETCH_ACTIVE_LIVESTREAMS_SUCCESS,
        data: { ...completedParams, activeLivestreams: activeStreams },
      });
    })
    .catch(() => dispatch({ type: ACTIONS.FETCH_ACTIVE_LIVESTREAMS_FAIL, data: completedParams }));
};

export const doSetIsLivePollingForChannelId = (channelId: string, isPolling: boolean) => (dispatch: Dispatch) =>
  dispatch({ type: ACTIONS.SET_IS_LIVE_POLLING_FOR_ID, data: { channelId, isPolling } });
