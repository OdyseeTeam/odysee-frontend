// @flow
import moment from 'moment';

import { createSelector } from 'reselect';
import { createCachedSelector } from 're-reselect';
import { LIVESTREAM_STARTS_SOON_BUFFER, LIVESTREAM_STARTED_RECENTLY_BUFFER } from 'constants/livestream';

import {
  selectMyClaims,
  selectPendingClaims,
  selectClaimForUri,
  selectChannelClaimIdForUri,
  selectMomentReleaseTimeForUri,
  selectClaimReleaseInFutureForUri,
  selectClaimReleaseInPastForUri,
} from 'redux/selectors/claims';
import { selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';

type State = { livestream: any, claims: any, user: any, comments: any };

const selectState = (state: State) => state.livestream || {};

// -- selectState(state) --

export const selectLivestreamInfoByCreatorId = (state: State) => selectState(state).livestreamInfoByCreatorId;
export const selectActiveLivestreamByCreatorId = (state: State) => selectState(state).activeLivestreamByCreatorId;
export const selectFutureLivestreamsByCreatorId = (state: State) => selectState(state).futureLivestreamsByCreatorId;
export const selectPastLivestreamsByCreatorId = (state: State) => selectState(state).pastLivestreamsByCreatorId;
export const selectViewersById = (state: State) => selectState(state).viewersById;
export const selectIsLiveFetchingIds = (state: State) => selectState(state).isLiveFetchingIds;
export const selectActiveLivestreamsFetchingQueries = (state: State) =>
  selectState(state).activeLivestreamsFetchingQueries;
export const selectActiveCreatorLivestreamsByQuery = (state: State) =>
  selectState(state).activeCreatorLivestreamsByQuery;
export const selectSocketConnectionById = (state: State) => selectState(state).socketConnectionById;
export const selectIsLivePollingChannelIds = (state: State) => selectState(state).isLivePollingChannelIds;

// -- General Selectors --

export const selectViewersForId = (state: State, claimId: string) => selectViewersById(state)[claimId];

export const selectFutureLivestreamsForCreatorId = (state: State, creatorId: string) =>
  selectFutureLivestreamsByCreatorId(state)[creatorId];

export const selectPastLivestreamsForCreatorId = (state: State, creatorId: string) =>
  selectPastLivestreamsByCreatorId(state)[creatorId];

export const selectFilteredActiveLivestreamUris = createCachedSelector(
  (state, channelIds, excludedChannelIds, query) =>
    query ? selectActiveLivestreamsForQuery(state, query) : selectActiveLivestreamByCreatorId(state),
  (state, channelIds, excludedChannelIds) => [channelIds, excludedChannelIds],
  selectViewersById,
  (activeLivestreamByCreatorId, [channelIds, excludedChannelIds], viewersById) => {
    if (!activeLivestreamByCreatorId) return activeLivestreamByCreatorId;

    const filteredLivestreams = [];

    for (const creatorId in activeLivestreamByCreatorId) {
      const activeCreatorLivestream = activeLivestreamByCreatorId[creatorId];

      if (activeCreatorLivestream) {
        const channelShouldFilter = channelIds && channelIds.includes(creatorId);
        const channelShouldExclude = excludedChannelIds && !excludedChannelIds.includes(creatorId);

        if (channelShouldFilter || channelShouldExclude) {
          filteredLivestreams.push(activeCreatorLivestream);
        }
      }
    }

    const sortedLivestreams = filteredLivestreams.sort((a: LivestreamActiveClaim, b: LivestreamActiveClaim) => {
      const [viewCountA, viewCountB] = [viewersById[a.claimId], viewersById[b.claimId]];

      if (viewCountA < viewCountB) return 1;
      if (viewCountA > viewCountB) return -1;
      return 0;
    });

    return sortedLivestreams.map((activeLivestream: LivestreamActiveClaim) => activeLivestream.uri);
  }
)(
  (state: State, channelIds?: Array<string>, excludedChannelIds?: Array<string>, query?: string) =>
    `${channelIds ? channelIds.toString() : ''}-${excludedChannelIds ? excludedChannelIds.toString() : ''}-${
      query || ''
    }`
);

export const selectIsLiveFetchingForId = (state: State, channelId: string) =>
  selectIsLiveFetchingIds(state).includes(channelId);

export const selectActiveCreatorLivestreamsForQuery = (state: State, query: string) =>
  selectActiveCreatorLivestreamsByQuery(state)[query];

export const selectActiveLivestreamsForQuery = (state: State, query: string) => {
  const activeCreatorLivestreamsForQuery = selectActiveCreatorLivestreamsForQuery(state, query);
  if (!activeCreatorLivestreamsForQuery) return activeCreatorLivestreamsForQuery;

  const { creatorIds } = activeCreatorLivestreamsForQuery;
  if (!creatorIds) return creatorIds;

  const activeLivestreamByCreatorId = {};

  creatorIds.forEach((creatorId) => {
    activeLivestreamByCreatorId[creatorId] = selectActiveLivestreamByCreatorId(state)[creatorId];
  });

  return activeLivestreamByCreatorId;
};

export const selectIsLivePollingForChannelId = (state: State, claimId: string) =>
  selectIsLivePollingChannelIds(state).includes(claimId);

export const selectActiveLivestreamsLastFetchedDateForQuery = (state: State, query: string) => {
  const activeCreatorLivestreamsForQuery = selectActiveCreatorLivestreamsForQuery(state, query);
  if (!activeCreatorLivestreamsForQuery) return activeCreatorLivestreamsForQuery;

  return activeCreatorLivestreamsForQuery.lastFetchedDate;
};

export const selectActiveLivestreamsLastFetchedFailCountForQuery = (state: State, query: string) => {
  const activeCreatorLivestreamsForQuery = selectActiveCreatorLivestreamsForQuery(state, query);
  if (!activeCreatorLivestreamsForQuery) return activeCreatorLivestreamsForQuery;

  return activeCreatorLivestreamsForQuery.lastFetchedFailCount;
};

export const selectIsFetchingActiveLivestreams = (state: State) =>
  selectActiveLivestreamsFetchingQueries(state).length > 0;

export const selectActiveLivestreamsFetchingForQuery = (state: State, query: string) =>
  selectActiveLivestreamsFetchingQueries(state).includes(query);

export const selectSocketConnectionForId = (state: State, claimId: string) =>
  claimId && selectSocketConnectionById(state)[claimId];

export const selectIsListeningForIsLiveForUri = (state: State, uri: string) => {
  const channelId = selectChannelClaimIdForUri(state, uri);

  const isLivePolling = channelId && selectIsLivePollingForChannelId(state, channelId);
  if (isLivePolling) return true;

  const activeLivestream = selectActiveLivestreamForChannel(state, channelId);
  if (!activeLivestream) return false;

  const activeLivestreamId = activeLivestream.claimId;

  const socketConnection = selectSocketConnectionForId(state, activeLivestreamId);
  // $FlowFixMe
  if (socketConnection?.connected) return true;

  return false;
};

// select non-pending claims without sources for given channel
export const makeSelectLivestreamsForChannelId = (channelId: string) =>
  createSelector(selectState, selectMyClaims, (livestreamState, myClaims = []) => {
    return myClaims
      .filter(
        (claim) =>
          claim.value_type === 'stream' &&
          claim.value &&
          !claim.value.source &&
          claim.confirmations > 0 &&
          claim.signing_channel &&
          claim.signing_channel.claim_id === channelId
      )
      .sort((a, b) => b.timestamp - a.timestamp); // newest first
  });

export const makeSelectPendingLivestreamsForChannelId = (channelId: string) =>
  createSelector(selectPendingClaims, (pendingClaims) => {
    return pendingClaims.filter(
      (claim) =>
        claim.value_type === 'stream' &&
        claim.value &&
        !claim.value.source &&
        claim.signing_channel &&
        claim.signing_channel.claim_id === channelId
    );
  });

export const selectIsActiveLivestreamForUri = createCachedSelector(
  (state: State, uri: string) => uri,
  selectActiveLivestreamByCreatorId,
  (uri, activeLivestreams) => {
    if (!uri || !activeLivestreams) {
      return false;
    }

    const activeLivestreamValues = Object.values(activeLivestreams);
    return activeLivestreamValues.some(
      (activeLivestream?: LivestreamActiveClaim) => activeLivestream && activeLivestream.uri === uri
    );
  }
)((state: State, uri: string) => String(uri));

export const selectActiveLivestreamForChannel = (state: State, channelId: string) => {
  const activeLivestreams = selectActiveLivestreamByCreatorId(state);
  if (!channelId || !activeLivestreams) return channelId || activeLivestreams;

  return activeLivestreams[channelId];
};

export const selectChannelIsLiveFetchedForUri = (state: State, uri: string) => {
  const channelId = selectChannelClaimIdForUri(state, uri);
  return selectActiveLivestreamForChannel(state, channelId) !== undefined;
};

export const selectActiveStreamUriForClaimUri = (state: State, uri: string) => {
  const channelId = selectChannelClaimIdForUri(state, uri);
  if (!channelId) return channelId;

  const activeLivestream = selectActiveLivestreamForChannel(state, channelId);
  if (!activeLivestream) return activeLivestream;

  return activeLivestream.uri;
};

export const selectClaimIsActiveChannelLivestreamForUri = (state: State, uri: string) => {
  const activeStreamUri = selectActiveStreamUriForClaimUri(state, uri);
  if (!activeStreamUri) return activeStreamUri;

  if (activeStreamUri === uri) return true;

  const claim = selectClaimForUri(state, uri);
  if (!claim) return claim;

  if ([claim.canonical_url, claim.permanent_url].includes(activeStreamUri)) return true;
};

export const selectLatestLiveUriForChannel = (state: State, channelId: string) => {
  const activeCreatorLivestream = selectActiveLivestreamForChannel(state, channelId);
  if (activeCreatorLivestream) return activeCreatorLivestream.uri;

  const futureCreatorLivestreams = selectFutureLivestreamsForCreatorId(state, channelId);
  const pastCreatorLivestreams = selectPastLivestreamsForCreatorId(state, channelId);
  const hasPastLivestreams = pastCreatorLivestreams && pastCreatorLivestreams.length > 0;

  if (futureCreatorLivestreams && futureCreatorLivestreams.length > 0) {
    const alreadyStarted = selectLiveClaimReleaseStartedRecently(state, futureCreatorLivestreams[0].uri);

    // -- Only return future/scheduled claims when they have already started, in the case the creator has a
    // ~ anytime stream ~
    if (!hasPastLivestreams || alreadyStarted) return futureCreatorLivestreams[0].uri;
  }

  if (hasPastLivestreams) return pastCreatorLivestreams[0].uri;

  return activeCreatorLivestream;
};

export const selectLatestLiveClaimForChannel = (state: State, channelId: string) => {
  const latestLiveUri = selectLatestLiveUriForChannel(state, channelId);
  return latestLiveUri && selectClaimForUri(state, latestLiveUri);
};

export const selectLiveClaimReleaseStartingSoonForUri = createSelector(selectMomentReleaseTimeForUri, (releaseTime) =>
  releaseTime.isBetween(moment().subtract(LIVESTREAM_STARTS_SOON_BUFFER, 'minutes'), moment())
);

export const selectLiveClaimReleaseStartedRecently = createSelector(selectMomentReleaseTimeForUri, (releaseTime) =>
  releaseTime.isBetween(moment().subtract(LIVESTREAM_STARTED_RECENTLY_BUFFER, 'minutes'), moment())
);

export const selectShouldShowLivestreamForUri = (state: State, uri: string) => {
  const isClaimActiveBroadcast = selectClaimIsActiveChannelLivestreamForUri(state, uri);
  if (!isClaimActiveBroadcast) return isClaimActiveBroadcast;

  const claimReleaseInPast = selectClaimReleaseInPastForUri(state, uri);
  const claimReleaseInFuture = selectClaimReleaseInFutureForUri(state, uri);
  const liveClaimStartingSoon = selectLiveClaimReleaseStartingSoonForUri(state, uri);

  return claimReleaseInPast || liveClaimStartingSoon || claimReleaseInFuture;
};

export const selectShowScheduledLiveInfoForUri = (state: State, uri: string) => {
  const isClaimActiveBroadcast = selectClaimIsActiveChannelLivestreamForUri(state, uri);
  const claimReleaseInFuture = selectClaimReleaseInFutureForUri(state, uri);
  const liveClaimStartedRecently = selectLiveClaimReleaseStartedRecently(state, uri);

  if (!isClaimActiveBroadcast && (claimReleaseInFuture || liveClaimStartedRecently)) {
    return true;
  }

  const liveClaimStartingSoon = selectLiveClaimReleaseStartingSoonForUri(state, uri);

  if (isClaimActiveBroadcast && claimReleaseInFuture && !liveClaimStartingSoon) {
    return true;
  }

  return false;
};

export const selectChatCommentsDisabledForUri = (state: State, uri: string) => {
  const channelId = selectChannelClaimIdForUri(state, uri);
  if (!channelId) return channelId;

  const commentsDisabled = selectCommentsDisabledSettingForChannelId(state, channelId);
  return commentsDisabled;
};
