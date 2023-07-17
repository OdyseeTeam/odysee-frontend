// @flow
import { createSelector } from 'reselect';
import {
  selectClaimsByUri,
  selectClaimIsMineForUri,
  makeSelectContentTypeForUri,
  selectClaimForUri,
  selectCostInfoForUri,
  selectPendingPurchaseForUri,
  selectIsAnonymousFiatContentForUri,
  selectClaimIsNsfwForUri,
  selectScheduledStateForUri,
  selectIsUriUnlisted,
} from 'redux/selectors/claims';
import { makeSelectMediaTypeForUri, makeSelectFileNameForUri } from 'redux/selectors/file_info';
import { selectBalance } from 'redux/selectors/wallet';
import { selectPendingUnlockedRestrictionsForUri } from 'redux/selectors/memberships';
import * as RENDER_MODES from 'constants/file_render_modes';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import path from 'path';
import { FORCE_CONTENT_TYPE_PLAYER, FORCE_CONTENT_TYPE_COMIC } from 'constants/claim';

const RECENT_HISTORY_AMOUNT = 10;
const HISTORY_ITEMS_PER_PAGE = 50;

export const selectState = (state: State) => state.content || {};

export function selectContentStates(state: State): ContentState {
  return state.content;
}

export const selectPlayingUri = (state: State) => selectState(state).playingUri;
export const selectHasUriPlaying = (state: State) => Boolean(selectPlayingUri(state).uri);
export const selectPlayingCollection = (state: State) => selectPlayingUri(state).collection;
export const selectPlayingCollectionId = (state: State) => selectPlayingCollection(state).collectionId;
export const selectPlayingCollectionLoop = (state: State) => selectPlayingCollection(state).loop;
export const selectPlayingCollectionShuffleUrls = (state: State) => selectPlayingCollection(state).shuffle?.newUrls;
export const selectPrimaryUri = (state: State) => selectState(state).primaryUri;
export const selectLastViewedAnnouncement = (state: State) => selectState(state).lastViewedAnnouncement;
export const selectRecsysEntries = (state: State) => selectState(state).recsysEntries;
export const selectAutoplayCountdownUri = (state: State) => selectState(state).autoplayCountdownUri;
export const selectIsAutoplayCountdownForUri = (state: State, uri: string) => selectAutoplayCountdownUri(state) === uri;

export const selectCollectionForIdIsPlayingShuffle = (state: State, collectionId: string) => {
  const collectionIsPlaying = selectIsCollectionPlayingForId(state, collectionId);
  const playingCollectionShuffleUrls = selectPlayingCollectionShuffleUrls(state);
  return collectionIsPlaying && playingCollectionShuffleUrls;
};

export const selectCollectionForIdIsPlayingLoop = (state: State, collectionId: string) => {
  const collectionIsPlaying = selectIsCollectionPlayingForId(state, collectionId);
  const playingCollectionLoop = selectPlayingCollectionLoop(state);
  return collectionIsPlaying && !!playingCollectionLoop;
};

export const selectIsPlayingCollectionForId = (state: State, id: string) => selectPlayingCollectionId(state) === id;

export const selectPlayingCollectionIfPlayingForId = (state: State, id: string) => {
  const playingCollection = selectPlayingCollection(state);
  return playingCollection.collectionId === id && playingCollection;
};
export const selectIsCollectionPlayingForId = (state: State, id: string) =>
  Boolean(selectPlayingCollectionIfPlayingForId(state, id));

export const selectListShuffleForId = (state: State, id: string) => {
  const playingCollection = selectPlayingCollectionIfPlayingForId(state, id);
  return playingCollection && playingCollection.shuffle;
};
export const selectListIsShuffledForId = (state: State, id: string) => Boolean(selectListShuffleForId(state, id));

export const selectListIsLoopedForId = (state: State, id: string) => {
  const playingCollection = selectPlayingCollectionIfPlayingForId(state, id);
  return Boolean(playingCollection && playingCollection.loop);
};

export const selectFileIsPlayingOnPage = (state: State, uri: string) => {
  const primaryUri = selectPrimaryUri(state);
  if (primaryUri === uri) return true;

  const claim = selectClaimForUri(state, uri);
  if (!claim) return claim;

  return (claim.canonical_url, claim.permanent_url).includes(primaryUri);
};

export const selectIsUriCurrentlyPlaying = (state: State, uri: string) => {
  const { uri: playingUri } = selectPlayingUri(state);
  if (!playingUri) return false;

  if (playingUri === uri) return true;

  const claim = selectClaimForUri(state, uri);
  if (uri && claim) {
    const { canonical_url: uri } = claim;
    if (playingUri === uri) return true;
  }
  if (!claim) return false;

  return (claim.canonical_url, claim.permanent_url).includes(playingUri);
};

export const selectIsPlayerFloating = (state: State) => {
  const primaryUri = selectPrimaryUri(state);
  const playingUri = selectPlayingUri(state);
  const autoplayCountdownUri = selectAutoplayCountdownUri(state);
  const mainFileUri = playingUri.uri || autoplayCountdownUri;

  if (!mainFileUri && !autoplayCountdownUri) return false;

  const { source, primaryUri: playingPrimaryUri, location: playingLocation, collection } = playingUri;

  const { pathname: playingPathName, search: playingSearch } = playingLocation || {};
  const { pathname, search } = state.router.location;

  const urlParams = new URLSearchParams(search);
  // $FlowFixMe
  const playingUrlParams = new URLSearchParams(playingSearch);
  const viewParam = urlParams.get('view');
  const playingLocationTab = playingUrlParams.get('view');
  const isOnDifferentTab = viewParam && viewParam !== playingLocationTab;
  const pageCollectionId = urlParams.get(COLLECTIONS_CONSTS.COLLECTION_ID);

  const hasSecondarySource = Boolean(source);
  const isComment = source === 'comment';
  const isQueue = source === 'queue';
  const isInlineSecondaryPlayer = hasSecondarySource && mainFileUri !== primaryUri && playingPathName === pathname;

  if ((isQueue && primaryUri !== mainFileUri) || (isInlineSecondaryPlayer && isOnDifferentTab)) {
    return true;
  }

  const { primaryUri: primaryPlayingUri } = playingUri;
  if (primaryPlayingUri) {
    const isAlreadyPlaying = selectIsUriCurrentlyPlaying(state, primaryPlayingUri);
    if (isAlreadyPlaying) return false;
  }

  if (
    (isQueue && (primaryUri === mainFileUri || pageCollectionId !== collection.collectionId)) ||
    isInlineSecondaryPlayer ||
    (hasSecondarySource && !isComment && primaryUri ? playingPrimaryUri === primaryUri : mainFileUri === primaryUri)
  ) {
    return false;
  }

  return true;
};

export const selectContentPositionForUri = (state: State, uri: string) => {
  const claim = selectClaimForUri(state, uri);
  if (claim) {
    const outpoint = `${claim.txid}:${claim.nout}`;
    const id = claim.claim_id;
    const positions = selectState(state).positions;
    return positions[id] ? positions[id][outpoint] : null;
  }
  return null;
};

export const selectHistory = (state: State) => selectState(state).history || [];

export const selectHistoryPageCount = createSelector(selectHistory, (history) =>
  Math.ceil(history.length / HISTORY_ITEMS_PER_PAGE)
);

export const makeSelectHistoryForPage = (page: number) =>
  createSelector(selectHistory, selectClaimsByUri, (history, claimsByUri) => {
    const left = page * HISTORY_ITEMS_PER_PAGE;
    const historyItemsForPage = history.slice(left, left + HISTORY_ITEMS_PER_PAGE);
    return historyItemsForPage;
  });

export const makeSelectHistoryForUri = (uri: string) =>
  createSelector(selectHistory, (history) => history.find((i) => i.uri === uri));

export const makeSelectHasVisitedUri = (uri: string) =>
  createSelector(makeSelectHistoryForUri(uri), (history) => Boolean(history));

export const selectRecentHistory = createSelector(selectHistory, (history) => {
  return history.slice(0, RECENT_HISTORY_AMOUNT);
});

export const selectWatchHistoryUris = createSelector(selectHistory, (history) => {
  const uris = [];
  for (let entry of history) {
    if (entry.uri.indexOf('@') !== -1) {
      uris.push(entry.uri);
    }
  }
  return uris;
});

// should probably be in lbry-redux, yarn link was fighting me
export const makeSelectFileExtensionForUri = (uri: string) =>
  createSelector(makeSelectFileNameForUri(uri), (fileName) => {
    return fileName && path.extname(fileName).substring(1);
  });

export const makeSelectFileRenderModeForUri = (uri: string) =>
  createSelector(
    makeSelectContentTypeForUri(uri),
    makeSelectMediaTypeForUri(uri),
    makeSelectFileExtensionForUri(uri),
    (contentType, mediaType, extension) => {
      if (mediaType === 'video' || FORCE_CONTENT_TYPE_PLAYER.includes(contentType) || mediaType === 'livestream') {
        return RENDER_MODES.VIDEO;
      }
      if (mediaType === 'audio') {
        return RENDER_MODES.AUDIO;
      }
      if (mediaType === 'image') {
        return RENDER_MODES.IMAGE;
      }
      if (['md', 'markdown'].includes(extension) || ['text/md', 'text/markdown'].includes(contentType)) {
        return RENDER_MODES.MARKDOWN;
      }
      if (contentType === 'application/pdf') {
        return RENDER_MODES.PDF;
      }
      if (['text/htm', 'text/html'].includes(contentType)) {
        return RENDER_MODES.HTML;
      }
      if (['text', 'document', 'script'].includes(mediaType)) {
        return RENDER_MODES.DOCUMENT;
      }
      if (extension === 'docx') {
        return RENDER_MODES.DOCX;
      }

      // when writing this my local copy of Lbry.getMediaType had '3D-file', but I was receiving model...'
      if (['3D-file', 'model'].includes(mediaType)) {
        return RENDER_MODES.CAD;
      }
      // Force content type for fallback support of older claims
      if (mediaType === 'comic-book' || FORCE_CONTENT_TYPE_COMIC.includes(contentType)) {
        return RENDER_MODES.COMIC;
      }
      if (
        [
          'application/zip',
          'application/x-gzip',
          'application/x-gtar',
          'application/x-tgz',
          'application/vnd.rar',
          'application/x-7z-compressed',
        ].includes(contentType)
      ) {
        return RENDER_MODES.DOWNLOAD;
      }

      if (mediaType === 'application') {
        return RENDER_MODES.APPLICATION;
      }

      return RENDER_MODES.UNSUPPORTED;
    }
  );

export const selectFileRenderModeForUri = createSelector(
  (state, uri) => makeSelectContentTypeForUri(uri)(state),
  (state, uri) => makeSelectMediaTypeForUri(uri)(state),
  (state, uri) => makeSelectFileExtensionForUri(uri)(state),
  (contentType, mediaType, extension) => {
    if (mediaType === 'video' || FORCE_CONTENT_TYPE_PLAYER.includes(contentType) || mediaType === 'livestream') {
      return RENDER_MODES.VIDEO;
    }
    if (mediaType === 'audio') {
      return RENDER_MODES.AUDIO;
    }
    if (mediaType === 'image') {
      return RENDER_MODES.IMAGE;
    }
    if (['md', 'markdown'].includes(extension) || ['text/md', 'text/markdown'].includes(contentType)) {
      return RENDER_MODES.MARKDOWN;
    }
    if (contentType === 'application/pdf') {
      return RENDER_MODES.PDF;
    }
    if (['text/htm', 'text/html'].includes(contentType)) {
      return RENDER_MODES.HTML;
    }
    if (['text', 'document', 'script'].includes(mediaType)) {
      return RENDER_MODES.DOCUMENT;
    }
    if (extension === 'docx') {
      return RENDER_MODES.DOCX;
    }

    // when writing this my local copy of Lbry.getMediaType had '3D-file', but I was receiving model...'
    if (['3D-file', 'model'].includes(mediaType)) {
      return RENDER_MODES.CAD;
    }
    // Force content type for fallback support of older claims
    if (mediaType === 'comic-book' || FORCE_CONTENT_TYPE_COMIC.includes(contentType)) {
      return RENDER_MODES.COMIC;
    }
    if (
      [
        'application/zip',
        'application/x-gzip',
        'application/x-gtar',
        'application/x-tgz',
        'application/vnd.rar',
        'application/x-7z-compressed',
      ].includes(contentType)
    ) {
      return RENDER_MODES.DOWNLOAD;
    }

    if (mediaType === 'application') {
      return RENDER_MODES.APPLICATION;
    }

    return RENDER_MODES.UNSUPPORTED;
  }
);

export const selectIsPlayableForUri = createSelector(selectFileRenderModeForUri, (renderMode) =>
  RENDER_MODES.FLOATING_MODES.includes(renderMode)
);

export const selectIsMarkdownPostForUri = (state: State, uri: string) => {
  const renderMode = makeSelectFileRenderModeForUri(uri)(state);
  return renderMode === RENDER_MODES.MARKDOWN;
};

export const selectInsufficientCreditsForUri = (state: State, uri: string) => {
  const isMine = selectClaimIsMineForUri(state, uri);
  const costInfo = selectCostInfoForUri(state, uri);
  const balance = selectBalance(state);
  return !isMine && costInfo && costInfo.cost > 0 && costInfo.cost > balance;
};

export const selectCanViewFileForUri = (state: State, uri: string) => {
  const scheduledButNotReady = selectScheduledStateForUri(state, uri) === 'scheduled';
  const isUnlisted = selectIsUriUnlisted(state, uri);

  if (state.user.user?.global_mod && (scheduledButNotReady || isUnlisted)) {
    return true;
  }

  if (scheduledButNotReady) {
    const claimIsMine = selectClaimIsMineForUri(state, uri);
    return !!claimIsMine;
  }

  const pendingPurchase = selectPendingPurchaseForUri(state, uri);
  const isAnonymousFiatContent = selectIsAnonymousFiatContentForUri(state, uri);
  const pendingUnlockedRestrictions = selectPendingUnlockedRestrictionsForUri(state, uri);

  const canViewFile = !pendingPurchase && !pendingUnlockedRestrictions && !isAnonymousFiatContent;
  return canViewFile;
};

// -- This will only be used for when playing claims in sequence i.e. a playlist, to show the proper
// components for skipping to playable claims instead of disrupting the playback flow
export const selectCanPlaybackFileForUri = (state: State, uri: string) => {
  const canViewFile = selectCanViewFileForUri(state, uri);
  if (!canViewFile) return canViewFile;

  const isMature = selectClaimIsNsfwForUri(state, uri);
  const isPlayable = selectIsPlayableForUri(state, uri);

  const canPlayback = !isMature && isPlayable;

  return canPlayback;
};
