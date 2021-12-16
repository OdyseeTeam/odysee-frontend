// @flow
import * as ACTIONS from 'constants/action_types';
import * as MODALS from 'constants/modal_types';
import { doOpenModal } from 'redux/actions/app';
import { makeSelectClaimForUri, selectClaimIsMineForUri, makeSelectClaimWasPurchased } from 'redux/selectors/claims';
import { makeSelectFileInfoForUri } from 'redux/selectors/file_info';
import { makeSelectUrlsForCollectionId } from 'redux/selectors/collections';
import { doToast } from 'redux/actions/notifications';
import { doPurchaseUri } from 'redux/actions/file';
import * as SETTINGS from 'constants/settings';
import { selectCostInfoForUri, Lbryio } from 'lbryinc';
import { selectClientSetting } from 'redux/selectors/settings';

export function doSetPrimaryUri(uri: ?string) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.SET_PRIMARY_URI,
      data: { uri },
    });
  };
}

export function doSetPlayingUri({
  uri,
  source,
  pathname,
  commentId,
  collectionId,
}: {
  uri: ?string,
  source?: string,
  commentId?: string,
  pathname?: string,
  collectionId?: string,
}) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.SET_PLAYING_URI,
      data: { uri, source, pathname, commentId, collectionId },
    });
  };
}

export function doPurchaseUriWrapper(uri: string, cost: number, saveFile: boolean, cb: ?(GetResponse) => void) {
  return (dispatch: Dispatch, getState: () => any) => {
    function onSuccess(fileInfo) {
      /* if (saveFile) {
        dispatch(doUpdateLoadStatus(uri, fileInfo.outpoint));
      } */

      if (cb) {
        cb(fileInfo);
      }
    }

    dispatch(doPurchaseUri(uri, { cost }, saveFile, onSuccess));
  };
}

export function doPlayUri(
  uri: string,
  skipCostCheck: boolean = false,
  saveFileOverride: boolean = false,
  cb?: () => void,
  hideFailModal: boolean = false
) {
  return (dispatch: Dispatch, getState: () => any) => {
    const state = getState();
    const isMine = selectClaimIsMineForUri(state, uri);
    const fileInfo = makeSelectFileInfoForUri(uri)(state);
    const claimWasPurchased = makeSelectClaimWasPurchased(uri)(state);

    const costInfo = selectCostInfoForUri(state, uri);
    const cost = (costInfo && Number(costInfo.cost)) || 0;
    const saveFile = false;
    const instantPurchaseEnabled = selectClientSetting(state, SETTINGS.INSTANT_PURCHASE_ENABLED);
    const instantPurchaseMax = selectClientSetting(state, SETTINGS.INSTANT_PURCHASE_MAX);

    function beginGetFile() {
      dispatch(doPurchaseUriWrapper(uri, cost, saveFile, cb));
    }

    function attemptPlay(instantPurchaseMax = null) {
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

    if (fileInfo && saveFile && (!fileInfo.download_path || !fileInfo.written_bytes)) {
      beginGetFile();
      return;
    }

    if (cost === 0 || skipCostCheck) {
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

export function doToggleLoopList(collectionId: string, loop: boolean, hideToast: boolean) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.TOGGLE_LOOP_LIST,
      data: { collectionId, loop },
    });
    if (!hideToast) {
      dispatch(
        doToast({
          message: loop ? __('Loop is on.') : __('Loop is off.'),
        })
      );
    }
  };
}

export function doToggleShuffleList(currentUri: string, collectionId: string, shuffle: boolean, hideToast: boolean) {
  return (dispatch: Dispatch, getState: () => any) => {
    if (shuffle) {
      const state = getState();
      const urls = makeSelectUrlsForCollectionId(collectionId)(state);

      let newUrls = urls
        .map((item) => ({ item, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ item }) => item);

      // the currently playing URI should be first in list or else
      // can get in strange position where it might be in the middle or last
      // and the shuffled list ends before scrolling through all entries
      if (currentUri && currentUri !== '') {
        newUrls.splice(newUrls.indexOf(currentUri), 1);
        newUrls.splice(0, 0, currentUri);
      }

      dispatch({
        type: ACTIONS.TOGGLE_SHUFFLE_LIST,
        data: { collectionId, newUrls },
      });
    } else {
      dispatch({
        type: ACTIONS.TOGGLE_SHUFFLE_LIST,
        data: { collectionId, newUrls: false },
      });
    }
    if (!hideToast) {
      dispatch(
        doToast({
          message: shuffle ? __('Shuffle is on.') : __('Shuffle is off.'),
        })
      );
    }
  };
}
