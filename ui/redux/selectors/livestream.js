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

export const selectFetchingLivestreams = (state: State) => selectState(state).fetchingById;
export const selectViewersById = (state: State) => selectState(state).viewersById;

export const selectIsLiveFetchingIds = (state: State) => selectState(state).isLiveFetchingIds;
export const selectIsLiveFetchingForId = (state: State, channelId: string) =>
  selectIsLiveFetchingIds(state).includes(channelId);

export const selectActiveLivestreamsByQuery = (state: State) => selectState(state).activeLivestreamsByQuery;
export const selectActiveLivestreamsForQuery = (state: State, query: string) =>
  selectActiveLivestreamsByQuery(state)[query];

export const selectActiveLivestreams = (state: State) => selectState(state).activeLivestreams;

export const selectActiveLivestreamsFetchingQueries = (state: State) =>
  selectState(state).activeLivestreamsFetchingQueries;

export const selectActiveLivestreamInitialized = (state: State) => selectState(state).activeLivestreamInitialized;
export const selectSocketConnectionById = (state: State) => selectState(state).socketConnectionById;

export const selectIsLivePollingChannelIds = (state: State) => selectState(state).isLivePollingChannelIds;
export const selectIsLivePollingForChannelId = (state: State, claimId: string) =>
  selectIsLivePollingChannelIds(state).includes(claimId);

export const selectActiveLivestreamsLastFetchedDateByQuery = (state: State) =>
  selectState(state).activeLivestreamsLastFetchedDateByQuery;
export const selectActiveLivestreamsLastFetchedDateForQuery = (state: State, query: string) =>
  selectActiveLivestreamsLastFetchedDateByQuery(state)[query];

export const selectActiveLivestreamsLastFetchedFailCount = (state: State) =>
  selectState(state).activeLivestreamsLastFetchedFailCount;

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

export const makeSelectIsFetchingLivestreams = (channelId: string) =>
  createSelector(selectFetchingLivestreams, (fetchingLivestreams) => Boolean(fetchingLivestreams[channelId]));

export const selectViewersForId = (state: State, channelId: string) => {
  const viewers = selectViewersById(state);
  return viewers[channelId];
};

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
  selectActiveLivestreams,
  (uri, activeLivestreams) => {
    if (!uri || !activeLivestreams) {
      return false;
    }

    const activeLivestreamValues = Object.values(activeLivestreams);
    // $FlowFixMe - unable to resolve claimUri
    return activeLivestreamValues.some((v) => v?.claimUri === uri);
  }
)((state: State, uri: string) => String(uri));

export const selectActiveLivestreamForClaimId = createCachedSelector(
  (state, claimId) => claimId,
  selectActiveLivestreams,
  (claimId, activeLivestreams) => {
    if (!claimId || !activeLivestreams) {
      return null;
    }

    const activeLivestreamValues = Object.values(activeLivestreams);
    // $FlowFixMe - https://github.com/facebook/flow/issues/2221
    return activeLivestreamValues.find((v) => v?.claimId === claimId) || null;
  }
)((state, claimId) => String(claimId));

export const selectActiveLivestreamForChannel = createCachedSelector(
  (state, channelId) => channelId,
  selectActiveLivestreams,
  (channelId, activeLivestreams) => {
    if (!channelId || !activeLivestreams) {
      return null;
    }
    return activeLivestreams[channelId];
  }
)((state, channelId) => String(channelId));

export const selectActiveStreamUriForClaimUri = (state: State, uri: string) => {
  const channelId = selectChannelClaimIdForUri(state, uri);
  if (!channelId) return channelId;

  const activeLivestream = selectActiveLivestreamForChannel(state, channelId);
  if (!activeLivestream) return activeLivestream;

  return activeLivestream.claimUri;
};

export const selectClaimIsActiveChannelLivestreamForUri = (state: State, uri: string) => {
  const channelId = selectChannelClaimIdForUri(state, uri);
  if (!channelId) return channelId;

  const activeStreamUri = selectActiveStreamUriForClaimUri(state, channelId);
  if (!activeStreamUri) return activeStreamUri;

  if (activeStreamUri === uri) return true;

  const claim = selectClaimForUri(state, uri);
  if (!claim) return claim;

  if ([claim.canonical_url, claim.permanent_url].includes(activeStreamUri)) return true;
};

export const selectActiveLiveClaimForChannel = createCachedSelector(
  (state) => state,
  selectActiveLivestreamForChannel,
  (state, activeLivestream) => activeLivestream && selectClaimForUri(state, activeLivestream.claimUri)
)((state, channelId) => String(channelId));

export const selectLiveClaimReleaseStartingSoonForUri = createSelector(selectMomentReleaseTimeForUri, (releaseTime) =>
  releaseTime.isBetween(moment(), moment().add(LIVESTREAM_STARTS_SOON_BUFFER, 'minutes'))
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
  const liveClaimStartingSoon = selectLiveClaimReleaseStartingSoonForUri(state, uri);

  if (!isClaimActiveBroadcast && (claimReleaseInFuture || liveClaimStartedRecently)) {
    return true;
  }

  if (isClaimActiveBroadcast && claimReleaseInFuture && !liveClaimStartingSoon) {
    return true;
  }

  return false;
};

export const selectChatCommentsDisabledForUri = (state: State, uri: string) => {
  const channelId = selectChannelClaimIdForUri(state, uri);
  if (!channelId) return channelId;

  const commentsDisabled = selectCommentsDisabledSettingForChannelId(state, channelId);
  const claimReleaseInFuture = selectClaimReleaseInFutureForUri(state, uri);
  const liveClaimStartingSoon = selectLiveClaimReleaseStartingSoonForUri(state, uri);

  return commentsDisabled || (claimReleaseInFuture && !liveClaimStartingSoon);
};
