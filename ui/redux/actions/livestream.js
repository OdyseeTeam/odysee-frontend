// @flow
import * as ACTIONS from 'constants/action_types';
import { doClaimSearch } from 'redux/actions/claims';
import { LIVESTREAM_LIVE_API, LIVESTREAM_STARTS_SOON_BUFFER } from 'constants/livestream';
import moment from 'moment';

export const doFetchNoSourceClaims = (channelId: string) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({
    type: ACTIONS.FETCH_NO_SOURCE_CLAIMS_STARTED,
    data: channelId,
  });
  try {
    await dispatch(
      doClaimSearch({
        channel_ids: [channelId],
        has_no_source: true,
        claim_type: ['stream'],
        no_totals: true,
        page_size: 20,
        page: 1,
        include_is_my_output: true,
      })
    );

    dispatch({
      type: ACTIONS.FETCH_NO_SOURCE_CLAIMS_COMPLETED,
      data: channelId,
    });
  } catch (error) {
    dispatch({
      type: ACTIONS.FETCH_NO_SOURCE_CLAIMS_FAILED,
      data: channelId,
    });
  }
};

const FETCH_ACTIVE_LIVESTREAMS_MIN_INTERVAL_MS = 5 * 60 * 1000;

export const doFetchActiveLivestreams = (
  orderBy: Array<string> = ['release_time'],
  pageSize: number = 50,
  forceFetch: boolean = false
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const now = Date.now();
    const timeDelta = now - state.livestream.activeLivestreamsLastFetchedDate;

    const prevOptions = state.livestream.activeLivestreamsLastFetchedOptions;
    const nextOptions = { page_size: pageSize, order_by: orderBy };
    const sameOptions = JSON.stringify(prevOptions) === JSON.stringify(nextOptions);

    if (!forceFetch && sameOptions && timeDelta < FETCH_ACTIVE_LIVESTREAMS_MIN_INTERVAL_MS) {
      dispatch({ type: ACTIONS.FETCH_ACTIVE_LIVESTREAMS_SKIPPED });
      return;
    }

    dispatch({ type: ACTIONS.FETCH_ACTIVE_LIVESTREAMS_STARTED });

    // Find all channels that are currently broadcasting a live stream.
    fetch(LIVESTREAM_LIVE_API)
      .then((res) => res.json())
      .then((res) => {
        if (!res.data) {
          dispatch({ type: ACTIONS.FETCH_ACTIVE_LIVESTREAMS_FAILED });
          return;
        }

        const activeLivestreams: LivestreamInfo = res.data.reduce((acc, curr) => {
          acc[curr.claimId] = {
            live: curr.live,
            viewCount: curr.viewCount,
            creatorId: curr.claimId,
          };
          return acc;
        }, {});

        // Find the first upcoming claim (if one exists) for each channel that has been determined to be actively broadcasting a stream.
        // If the claim is scheduled to "start soon" we'll show it instead of the most recent livestream claim.
        // @Note: We'll manually filter out any that aren't "starting soon" and ideally in the future the API will allow querying by a date range.
        const searchUpcomingClaims = dispatch(
          doClaimSearch({
            page: 1,
            page_size: nextOptions.page_size,
            has_no_source: true,
            channel_ids: Object.keys(activeLivestreams),
            claim_type: ['stream'],
            order_by: ['^release_time'],
            release_time: `>${moment().unix()}`,
            limit_claims_per_channel: 1,
            no_totals: true,
          })
        );

        // Find the most recent claims for the channels that have been determined to be actively broadcasting a stream.
        // These newest claims are considered the "live" ones.
        const searchMostRecentClaims = dispatch(
          doClaimSearch({
            page: 1,
            page_size: nextOptions.page_size,
            has_no_source: true,
            channel_ids: Object.keys(activeLivestreams),
            claim_type: ['stream'],
            order_by: nextOptions.order_by, // **
            release_time: `<${moment().unix()}`,
            limit_claims_per_channel: 1, // **
            no_totals: true,
          })
        );

        Promise.all([searchUpcomingClaims, searchMostRecentClaims])
          .then(([upcomingClaims, mostRecentClaims]) => {
            const startsSoonMoment = moment().add(LIVESTREAM_STARTS_SOON_BUFFER, 'minutes');
            const startingSoonClaims = Object.values(upcomingClaims).filter((claim) => {
              // $FlowFixMe
              return moment(claim.stream.value.release_time * 1000).isBefore(startsSoonMoment);
            });

            Object.values(mostRecentClaims).forEach((mostRecentClaim) => {
              // $FlowFixMe
              const channelId = mostRecentClaim.stream.signing_channel.claim_id;
              const upcomingClaim = startingSoonClaims.find((claim) => {
                // $FlowFixMe
                return claim.stream.signing_channel.claim_id === channelId;
              });

              const claim = upcomingClaim || mostRecentClaim;

              activeLivestreams[channelId] = {
                ...activeLivestreams[channelId],
                // $FlowFixMe
                latestClaimId: claim.stream.claim_id,
                // $FlowFixMe
                latestClaimUri: claim.stream.canonical_url,
              };
            });

            dispatch({
              type: ACTIONS.FETCH_ACTIVE_LIVESTREAMS_COMPLETED,
              data: {
                activeLivestreams,
                activeLivestreamsLastFetchedDate: now,
                activeLivestreamsLastFetchedOptions: nextOptions,
              },
            });
          })
          .catch(() => {
            dispatch({ type: ACTIONS.FETCH_ACTIVE_LIVESTREAMS_FAILED });
          });
      })
      .catch((err) => {
        dispatch({ type: ACTIONS.FETCH_ACTIVE_LIVESTREAMS_FAILED });
      });
  };
};
