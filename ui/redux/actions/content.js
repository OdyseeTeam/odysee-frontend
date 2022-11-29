// @flow
import * as ACTIONS from 'constants/action_types';
import * as MODALS from 'constants/modal_types';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import * as PAGES from 'constants/pages';

import { COL_TYPES } from 'constants/collections';
import { push } from 'connected-react-router';
import { doOpenModal, doAnalyticsViewForUri } from 'redux/actions/app';
import { formatLbryUrlForWeb, generateListSearchUrlParams } from 'util/url';
import {
  makeSelectClaimForUri,
  selectClaimIsMineForUri,
  selectClaimWasPurchasedForUri,
  selectPermanentUrlForUri,
  selectClaimForUri,
  selectClaimIsNsfwForUri,
  selectPurchaseMadeForClaimId,
  selectValidRentalPurchaseForClaimId,
  selectClaimIdForUri,
  selectIsFiatRequiredForUri,
  selectCostInfoForUri,
  selectIsStreamPlaceholderForUri,
} from 'redux/selectors/claims';
import { makeSelectFileInfoForUri, selectFileInfosByOutpoint } from 'redux/selectors/file_info';
import {
  selectUrlsForCollectionId,
  selectCollectionForIdHasClaimUrl,
  selectFirstItemUrlForCollection,
} from 'redux/selectors/collections';
import { doCollectionEdit, doLocalCollectionCreate, doFetchItemsInCollection } from 'redux/actions/collections';
import { doToast } from 'redux/actions/notifications';
import { doPurchaseUri } from 'redux/actions/file';
import Lbry from 'lbry';
import RecSys from 'recsys';
import * as SETTINGS from 'constants/settings';
import { Lbryio } from 'lbryinc';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectIsActiveLivestreamForUri } from 'redux/selectors/livestream';
import {
  selectRecsysEntries,
  selectPlayingUri,
  selectPlayingCollection,
  selectCollectionForIdIsPlayingShuffle,
  selectListIsLoopedForId,
  selectPlayingCollectionId,
  selectIsUriCurrentlyPlaying,
  selectIsPlayerFloating,
  selectIsCollectionPlayingForId,
  selectIsPlayableForUri,
  selectCanPlaybackFileForUri,
} from 'redux/selectors/content';

const DOWNLOAD_POLL_INTERVAL = 1000;

export function doUpdateLoadStatus(uri: string, outpoint: string) {
  // Updates the loading status for a uri as it's downloading
  // Calls file_list and checks the written_bytes value to see if the number has increased
  // Not needed on web as users aren't actually downloading the file
  // @if TARGET='app'
  return (dispatch: Dispatch, getState: GetState) => {
    const setNextStatusUpdate = () =>
      setTimeout(() => {
        // We need to check if outpoint still exists first because user are able to delete file (outpoint) while downloading.
        // If a file is already deleted, no point to still try update load status
        const byOutpoint = selectFileInfosByOutpoint(getState());
        if (byOutpoint[outpoint]) {
          dispatch(doUpdateLoadStatus(uri, outpoint));
        }
      }, DOWNLOAD_POLL_INTERVAL);

    Lbry.file_list({
      outpoint,
      full_status: true,
      page: 1,
      page_size: 1,
    }).then((result) => {
      const { items: fileInfos } = result;
      const fileInfo = fileInfos[0];
      if (!fileInfo || fileInfo.written_bytes === 0) {
        // download hasn't started yet
        setNextStatusUpdate();
      } else if (fileInfo.completed) {
        // TODO this isn't going to get called if they reload the client before
        // the download finished
        dispatch({
          type: ACTIONS.DOWNLOADING_COMPLETED,
          data: {
            uri,
            outpoint,
            fileInfo,
          },
        });
      } else {
        // ready to play
        const { total_bytes: totalBytes, written_bytes: writtenBytes } = fileInfo;
        const progress = (writtenBytes / totalBytes) * 100;

        dispatch({
          type: ACTIONS.DOWNLOADING_PROGRESSED,
          data: {
            uri,
            outpoint,
            fileInfo,
            progress,
          },
        });

        setNextStatusUpdate();
      }
    });
  };
  // @endif
}

export const doSetPrimaryUri = (uri: ?string) => async (dispatch: Dispatch, getState: GetState) =>
  dispatch({ type: ACTIONS.SET_PRIMARY_URI, data: { uri } });

export const doClearPlayingUri = () => (dispatch: Dispatch) => dispatch(doSetPlayingUri({ uri: null, collection: {} }));
export const doClearPlayingSource = () => (dispatch: Dispatch) => dispatch(doChangePlayingUri({ source: null }));
export const doClearPlayingCollection = () => (dispatch: Dispatch) =>
  dispatch(doChangePlayingUri({ collection: { collectionId: null } }));

export const doPopOutInlinePlayer = ({ source }: { source: string }) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const isFloating = selectIsPlayerFloating(state);
  const playingUri = selectPlayingUri(state);

  if (playingUri.source === source && !isFloating) {
    const floatingPlayerEnabled = selectClientSetting(state, SETTINGS.FLOATING_PLAYER);

    if (floatingPlayerEnabled) return dispatch(doClearPlayingSource());

    return dispatch(doClearPlayingUri());
  }
};

export const doSetPlayingUri = (playingUri: PlayingUri) => async (dispatch: Dispatch, getState: GetState) =>
  dispatch({ type: ACTIONS.SET_PLAYING_URI, data: playingUri });

export const doChangePlayingUri = (newPlayingUri: PlayingUri) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const playingUri = selectPlayingUri(state);

  return dispatch(doSetPlayingUri({ ...playingUri, ...newPlayingUri }));
};

export function doPurchaseUriWrapper(uri: string, cost: number, cb: ?(GetResponse) => void) {
  return (dispatch: Dispatch, getState: () => any) => {
    function onSuccess(fileInfo) {
      if (cb) {
        cb(fileInfo);
      }
    }

    dispatch(doPurchaseUri(uri, { cost }, onSuccess));
  };
}

export function doDownloadUri(uri: string) {
  return (dispatch: Dispatch) => dispatch(doPlayUri(uri, false, true, () => dispatch(doAnalyticsViewForUri(uri))));
}

export const doStartFloatingPlayingUri = (playingOptions: PlayingUri) => async (
  dispatch: Dispatch,
  getState: () => any
) => {
  const { uri, collection } = playingOptions;

  if (!uri) return;

  const state = getState();
  const isMature = selectClaimIsNsfwForUri(state, uri);
  const isPlayable = selectIsPlayableForUri(state, uri);
  const isLivestreamClaim = selectIsStreamPlaceholderForUri(state, uri);
  const isLive = selectIsActiveLivestreamForUri(state, uri);
  const canStartloatingPlayer = !isMature && isPlayable && (!isLivestreamClaim || isLive);

  if (!canStartloatingPlayer) return;

  const { collectionId } = collection || {};

  const playingCollection = selectPlayingCollection(state) || {};
  const isCurrentlyPlayingQueue = playingCollection.collectionId === COLLECTIONS_CONSTS.QUEUE_ID;
  const hasClaimInQueue = selectCollectionForIdHasClaimUrl(state, COLLECTIONS_CONSTS.QUEUE_ID, uri);

  const { search } = state.router.location;
  const urlParams = search && new URLSearchParams(search);
  const pageCollectionId = urlParams && urlParams.get(COLLECTIONS_CONSTS.COLLECTION_ID);

  const playingOtherThanCurrentQueue = isCurrentlyPlayingQueue && !hasClaimInQueue;

  if (playingOtherThanCurrentQueue) {
    // If the current playing uri is from Queue mode and the next isn't, it will continue playing on queue
    // until the player is closed or the page is refreshed, and queue is cleared
    const permanentUrl = selectPermanentUrlForUri(state, uri);
    const itemsToAdd = !pageCollectionId
      ? [permanentUrl]
      : selectUrlsForCollectionId(state, pageCollectionId).filter(
          (url) => !selectCollectionForIdHasClaimUrl(state, COLLECTIONS_CONSTS.QUEUE_ID, url)
        );

    dispatch(doCollectionEdit(COLLECTIONS_CONSTS.QUEUE_ID, { uris: itemsToAdd, type: COL_TYPES.PLAYLIST }));

    return dispatch(doChangePlayingUri({ ...playingOptions, collection: playingCollection }));
  }

  if (collectionId && playingCollection.collectionId && collectionId === playingCollection.collectionId) {
    // keep current playingCollection data like loop or shuffle if playing the same but just changed uris
    return dispatch(doChangePlayingUri({ ...playingOptions, collection: { ...playingCollection, ...collection } }));
  }

  return dispatch(doChangePlayingUri({ ...playingOptions, collection: collectionId ? collection : {} }));
};

export const doPlayNextUri = ({ uri: nextUri }: { uri: string }) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState();
  const isFloating = selectIsPlayerFloating(state);
  const playingCollectionId = selectPlayingCollectionId(state);
  const isNextUriInCollection = selectCollectionForIdHasClaimUrl(state, playingCollectionId, nextUri);

  if (!isFloating) {
    dispatch(
      push({
        pathname: formatLbryUrlForWeb(nextUri),
        ...(isNextUriInCollection
          ? { search: generateListSearchUrlParams(playingCollectionId), state: { collectionId: playingCollectionId } }
          : {}),
      })
    );
  }

  const canPlayback = selectCanPlaybackFileForUri(state, nextUri);
  const isLivestreamClaim = selectIsStreamPlaceholderForUri(state, nextUri);
  const isLive = selectIsActiveLivestreamForUri(state, nextUri);
  // todo: fix
  const canStartloatingPlayer = canPlayback && (!isLivestreamClaim || isLive);

  if (!canStartloatingPlayer) {
    dispatch(
      doChangePlayingUri({
        uri: null,
        collection: playingCollectionId ? { collectionId: playingCollectionId } : null,
      })
    );
    return dispatch(doSetShowAutoplayCountdownForUri({ uri: nextUri, show: true }));
  }

  dispatch(
    doStartFloatingPlayingUri({
      uri: nextUri,
      ...(playingCollectionId ? { collection: { collectionId: playingCollectionId } } : {}),
    })
  );
};

export function doPlaylistAddAndAllowPlaying({
  uri,
  collectionName,
  collectionId: id,
  sourceId,
  createNew,
  push: pushPlay,
  createCb,
}: {
  uri?: string,
  collectionName: string,
  collectionId?: string,
  sourceId?: string,
  createNew?: boolean,
  push?: (uri: string) => void,
  createCb?: (id: string) => void,
}) {
  return (dispatch: Dispatch, getState: () => any) => {
    const state = getState();
    const remove = Boolean(id && uri && selectCollectionForIdHasClaimUrl(state, id, uri));

    let collectionId = id;
    if (createNew) {
      dispatch(
        doLocalCollectionCreate(
          { name: collectionName, items: uri ? [uri] : [], type: COL_TYPES.PLAYLIST, sourceId },
          (newId) => {
            collectionId = newId;
            if (createCb) createCb(newId);
          }
        )
      );
    } else if (collectionId && uri) {
      if (collectionId === COLLECTIONS_CONSTS.QUEUE_ID) {
        const playingUri = selectPlayingUri(state);
        const { collectionId: playingCollectionId } = playingUri.collection || {};
        const { permanent_url: playingUrl } = selectClaimForUri(state, playingUri.uri) || {};

        // $FlowFixMe
        const playingCollectionUrls = selectUrlsForCollectionId(state, playingCollectionId);
        const itemsToAdd = playingCollectionUrls || [playingUrl];
        const hasPlayingUriInQueue = Boolean(
          playingUrl && selectCollectionForIdHasClaimUrl(state, COLLECTIONS_CONSTS.QUEUE_ID, playingUrl)
        );
        // $FlowFixMe
        const hasClaimInQueue = selectCollectionForIdHasClaimUrl(state, COLLECTIONS_CONSTS.QUEUE_ID, uri);

        dispatch(
          doCollectionEdit(COLLECTIONS_CONSTS.QUEUE_ID, {
            uris: playingUrl && playingUrl !== uri && !hasPlayingUriInQueue ? [...itemsToAdd, uri] : [uri],
            remove: hasClaimInQueue,
            type: COL_TYPES.PLAYLIST,
          })
        );
      } else {
        dispatch(doCollectionEdit(collectionId, { uris: [uri], remove, type: COL_TYPES.PLAYLIST }));
      }
    }

    if (!uri && createNew) return;

    const collectionPlayingId = selectPlayingCollectionId(state);
    const playingUri = selectPlayingUri(state);
    const isUriPlaying = uri && selectIsUriCurrentlyPlaying(state, uri);
    const firstItemUri = collectionId && selectFirstItemUrlForCollection(state, collectionId);

    const isPlayingCollection = collectionPlayingId && collectionId && collectionPlayingId === collectionId;
    const hasItemPlaying = playingUri.uri && !isUriPlaying;
    // const floatingPlayerEnabled =
    //   playingUri.collection.collectionId === 'queue' || selectClientSetting(state, SETTINGS.FLOATING_PLAYER);

    const startPlaying = () => {
      if (isUriPlaying) {
        dispatch(doChangePlayingUri({ collection: { collectionId } }));
      } else {
        dispatch(doStartFloatingPlayingUri({ uri: firstItemUri || uri, collection: { collectionId } }));
      }
    };

    if (collectionId === COLLECTIONS_CONSTS.QUEUE_ID) {
      const { permanent_url: playingUrl } = selectClaimForUri(state, playingUri.uri) || {};
      const hasPlayingUriInQueue = Boolean(
        playingUrl && selectCollectionForIdHasClaimUrl(state, COLLECTIONS_CONSTS.QUEUE_ID, playingUrl)
      );
      // $FlowFixMe
      const hasClaimInQueue = selectCollectionForIdHasClaimUrl(state, COLLECTIONS_CONSTS.QUEUE_ID, uri);
      if (!hasClaimInQueue) {
        const paramsToAdd = {
          collection: { collectionId: COLLECTIONS_CONSTS.QUEUE_ID },
          source: COLLECTIONS_CONSTS.QUEUE_ID,
        };

        if (playingUrl) {
          // adds the queue collection id to the playingUri data so it can be used and updated by other components
          if (!hasPlayingUriInQueue) dispatch(doChangePlayingUri({ ...paramsToAdd }));
        } else {
          // There is nothing playing and added a video to queue -> the first item will play on the floating player with the list open
          dispatch(doStartFloatingPlayingUri({ uri, ...paramsToAdd }));
        }
      }
    } else {
      const handleEdit = () =>
        // $FlowFixMe
        dispatch(push({ pathname: `/$/${PAGES.PLAYLIST}/${collectionId}`, state: { showEdit: true } }));

      dispatch(
        doToast({
          message: __(remove ? 'Removed from %playlist_name%' : 'Added to %playlist_name%', {
            playlist_name: collectionName,
          }),
          actionText: isPlayingCollection || hasItemPlaying || remove ? __('Edit Playlist') : __('Start Playing'),
          action: isPlayingCollection || hasItemPlaying || remove ? handleEdit : startPlaying,
          secondaryActionText: isPlayingCollection || hasItemPlaying || remove ? undefined : __('Edit Playlist'),
          secondaryAction: isPlayingCollection || hasItemPlaying || remove ? undefined : handleEdit,
        })
      );
    }
  };
}

export function doPlayUri(
  uri: string,
  skipCostCheck?: boolean = false,
  saveFileOverride?: boolean = false,
  cb?: () => void,
  hideFailModal?: boolean = false
) {
  return async (dispatch: Dispatch, getState: () => any) => {
    const state = getState();

    const isMine = selectClaimIsMineForUri(state, uri);
    const fileInfo = makeSelectFileInfoForUri(uri)(state);
    const claimWasPurchased = selectClaimWasPurchasedForUri(state, uri);
    const claimId = selectClaimIdForUri(state, uri);

    const costInfo = selectCostInfoForUri(state, uri);
    const cost = costInfo && Number(costInfo.cost);
    const instantPurchaseEnabled = selectClientSetting(state, SETTINGS.INSTANT_PURCHASE_ENABLED);
    const instantPurchaseMax = selectClientSetting(state, SETTINGS.INSTANT_PURCHASE_MAX);
    const fiatRequired = selectIsFiatRequiredForUri(state, uri);
    const isFree = (!cost || cost === 0) && !fiatRequired;

    const paid = {
      sdk: selectClaimWasPurchasedForUri(state, uri),
      fiat: selectPurchaseMadeForClaimId(state, claimId),
      fiat_rent: selectValidRentalPurchaseForClaimId(state, claimId),
    };

    function beginGetFile() {
      dispatch(doPurchaseUriWrapper(uri, cost, cb));
    }

    function attemptPlay(instantPurchaseMax = null) {
      if (fiatRequired && !isMine) {
        if (!paid.fiat && !paid.fiat_rent) {
          if (!hideFailModal) {
            dispatch(doOpenModal(MODALS.PREORDER_AND_PURCHASE_CONTENT, { uri }));
          }
        } else {
          beginGetFile();
        }
        return;
      }

      // If you have a file_list entry, you have already purchased the file
      if (
        !isMine &&
        !fileInfo &&
        !claimWasPurchased &&
        (!instantPurchaseMax || !instantPurchaseEnabled || cost > instantPurchaseMax)
      ) {
        if (!hideFailModal) dispatch(doOpenModal(MODALS.AFFIRM_PURCHASE, { uri }));
      } else {
        beginGetFile();
      }
    }

    if (isFree || skipCostCheck) {
      beginGetFile();
      return;
    }

    if (instantPurchaseEnabled) {
      if (instantPurchaseMax.currency === 'LBC') {
        attemptPlay(instantPurchaseMax.amount);
      } else {
        // Need to convert currency of instant purchase maximum before trying to play
        Lbryio.getExchangeRates().then(({ LBC_USD }) => {
          attemptPlay(instantPurchaseMax.amount / LBC_USD);
        });
      }
    } else {
      attemptPlay();
    }
  };
}

export function savePosition(uri: string, position: number) {
  return (dispatch: Dispatch, getState: () => any) => {
    const state = getState();
    const claim = makeSelectClaimForUri(uri)(state);
    const { claim_id: claimId, txid, nout } = claim;
    const outpoint = `${txid}:${nout}`;

    dispatch({
      type: ACTIONS.SET_CONTENT_POSITION,
      data: { claimId, outpoint, position },
    });
  };
}

export function clearPosition(uri: string) {
  return (dispatch: Dispatch, getState: () => any) => {
    const state = getState();
    const claim = makeSelectClaimForUri(uri)(state);
    const { claim_id: claimId, txid, nout } = claim;
    const outpoint = `${txid}:${nout}`;

    dispatch({
      type: ACTIONS.CLEAR_CONTENT_POSITION,
      data: { claimId, outpoint },
    });
  };
}

export function doSetContentHistoryItem(uri: string) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.SET_CONTENT_LAST_VIEWED,
      data: { uri, lastViewed: Date.now() },
    });
  };
}

export function doClearContentHistoryUri(uri: string) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.CLEAR_CONTENT_HISTORY_URI,
      data: { uri },
    });
  };
}

export function doClearContentHistoryAll() {
  return (dispatch: Dispatch) => {
    dispatch({ type: ACTIONS.CLEAR_CONTENT_HISTORY_ALL });
  };
}

export const doRecommendationUpdate = (claimId: string, urls: Array<string>, id: string, parentId: string) => (
  dispatch: Dispatch
) => {
  dispatch({
    type: ACTIONS.RECOMMENDATION_UPDATED,
    data: { claimId, urls, id, parentId },
  });
};

export const doRecommendationClicked = (claimId: string, index: number) => (dispatch: Dispatch) => {
  if (index !== undefined && index !== null) {
    dispatch({
      type: ACTIONS.RECOMMENDATION_CLICKED,
      data: { claimId, index },
    });
  }
};

export const doToggleLoopList = (params: { collectionId: string, hideToast?: boolean }) => (
  dispatch: Dispatch,
  getState: () => any
) => {
  const { collectionId, hideToast } = params;
  const state = getState();
  const playingUri = selectPlayingUri(state);
  const { collection: playingCollection } = playingUri;
  const loopOn = selectListIsLoopedForId(state, collectionId);

  dispatch(doChangePlayingUri({ collection: { ...playingCollection, collectionId, loop: !loopOn } }));

  if (!hideToast) {
    return dispatch(doToast({ message: !loopOn ? __('Loop is on.') : __('Loop is off.') }));
  }
};

export const doEnableCollectionShuffle = ({
  collectionId,
  currentUri,
}: {
  collectionId: string,
  currentUri?: string,
}) => async (dispatch: Dispatch, getState: () => any) => {
  await dispatch(doFetchItemsInCollection({ collectionId })); // make sure we have the URIS in the collection

  const state = getState();
  const urls = selectUrlsForCollectionId(state, collectionId);
  const collectionIsPlaying = selectIsCollectionPlayingForId(state, collectionId);

  let newUrls = urls
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);

  // the currently playing URI should be first in list or else
  // can get in strange position where it might be in the middle or last
  // and the shuffled list ends before scrolling through all entries
  if (currentUri) {
    newUrls.splice(newUrls.indexOf(currentUri), 1);
    newUrls.splice(0, 0, currentUri);
  }

  const newPlayingCollectionObj = { collection: { collectionId, shuffle: { newUrls } } };

  if (collectionIsPlaying) {
    dispatch(doChangePlayingUri(newPlayingCollectionObj));
  } else {
    dispatch(doStartFloatingPlayingUri({ uri: newUrls[0], ...newPlayingCollectionObj }));
  }

  const navigateUrl = formatLbryUrlForWeb(newUrls[0]);

  dispatch(
    push({
      pathname: navigateUrl,
      search: generateListSearchUrlParams(collectionId),
      state: { collectionId, forceAutoplay: true },
    })
  );
};

export const doToggleShuffleList = ({
  currentUri,
  collectionId,
  hideToast,
}: {
  currentUri?: string,
  collectionId: string,
  hideToast?: boolean,
}) => (dispatch: Dispatch, getState: () => any) => {
  const state = getState();
  const listIsShuffledForId = selectCollectionForIdIsPlayingShuffle(state, collectionId);

  if (!listIsShuffledForId) {
    dispatch(doEnableCollectionShuffle({ collectionId, currentUri }));
  } else {
    dispatch(doChangePlayingUri({ collection: { shuffle: undefined } }));
  }

  if (!hideToast) {
    return dispatch(doToast({ message: !listIsShuffledForId ? __('Shuffle is on.') : __('Shuffle is off.') }));
  }
};

export function doSetLastViewedAnnouncement(hash: string) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.SET_LAST_VIEWED_ANNOUNCEMENT,
      data: hash,
    });
  };
}

export function doSetRecsysEntries(entries: { [ClaimId]: RecsysEntry }) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.SET_RECSYS_ENTRIES,
      data: entries,
    });
  };
}

/**
 * Sends any lingering recsys entries from the previous session and deletes it.
 *
 * Should only be called on startup, before a new cycle of recsys data is
 * collected.
 *
 * @returns {(function(Dispatch, GetState): void)|*}
 */
export function doSendPastRecsysEntries() {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const entries = selectRecsysEntries(state);
    if (entries) {
      RecSys.sendEntries(entries, true);
    }
  };
}

export const doSetShowAutoplayCountdownForUri = ({ uri, show }: { uri: string, show: boolean }) => (
  dispatch: Dispatch
) => dispatch({ type: ACTIONS.SHOW_AUTOPLAY_COUNTDOWN, data: { uri, show } });
