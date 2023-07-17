// @flow
import * as ACTIONS from 'constants/action_types';
import * as ABANDON_STATES from 'constants/abandon_states';
// @if TARGET='app'
import { shell } from 'electron';
// @endif
import Lbry from 'lbry';
import { selectClaimForUri, selectClaimOutpointForUri, selectIsLivestreamClaimForUri } from 'redux/selectors/claims';
import { doAbandonClaim } from 'redux/actions/claims';
import { batchActions } from 'util/batch-actions';

import { doHideModal } from 'redux/actions/app';
import { goBack } from 'connected-react-router';
import { doClearPlayingUri } from 'redux/actions/content';
import { selectPlayingUri } from 'redux/selectors/content';
import { doToast } from 'redux/actions/notifications';
import { selectBalance } from 'redux/selectors/wallet';
import { makeSelectFileInfoForUri, selectOutpointFetchingForUri } from 'redux/selectors/file_info';
import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

export function doOpenFileInFolder(path: string) {
  return () => {
    shell.showItemInFolder(path);
  };
}

export function doOpenFileInShell(path: string) {
  return (dispatch: Dispatch) => {
    const success = shell.openPath(path);
    if (!success) {
      dispatch(doOpenFileInFolder(path));
    }
  };
}

export function doDeleteFile(
  outpoint: string,
  deleteFromComputer?: boolean,
  abandonClaim?: boolean,
  cb: any,
  claim: Claim
) {
  return (dispatch: Dispatch) => {
    if (abandonClaim) {
      dispatch(doAbandonClaim(claim, cb));
    }

    // @if TARGET='app'
    Lbry.file_delete({
      outpoint,
      delete_from_download_dir: deleteFromComputer,
    });

    dispatch({
      type: ACTIONS.FILE_DELETE,
      data: {
        outpoint,
      },
    });
    // @endif
  };
}

export function doDeleteFileAndMaybeGoBack(
  uri: string,
  deleteFromComputer?: boolean,
  abandonClaim?: boolean,
  doGoBack: (any) => void,
  claim: Claim
) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const playingUri = selectPlayingUri(state);
    const { outpoint } = makeSelectFileInfoForUri(uri)(state) || '';
    const { nout, txid } = selectClaimForUri(state, uri);
    const claimOutpoint = `${txid}:${nout}`;
    const actions = [];

    if (!abandonClaim) {
      actions.push(doHideModal());
    }

    actions.push(
      doDeleteFile(
        outpoint || claimOutpoint,
        deleteFromComputer,
        abandonClaim,
        (abandonState) => {
          if (abandonState === ABANDON_STATES.DONE) {
            if (abandonClaim) {
              if (doGoBack) {
                dispatch(goBack());
              }
              dispatch(doHideModal());
            }
          }
        },
        claim
      )
    );

    if (playingUri.uri === uri) {
      actions.push(doClearPlayingUri());
    }
    // it would be nice to stay on the claim if you just want to delete it
    // we need to alter autoplay to not start downloading again after you delete it

    dispatch(batchActions(...actions));
  };
}

export const doFileGetForUri = (uri: string, opt?: ?FileGetOptions, onSuccess?: (GetResponse) => any) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state: State = getState();
    const alreadyFetching = selectOutpointFetchingForUri(state, uri);
    const fileInfo = makeSelectFileInfoForUri(uri)(state);

    if (alreadyFetching && !onSuccess) {
      return;
    }

    if (fileInfo !== undefined && onSuccess !== undefined) {
      onSuccess(fileInfo);
      return;
    }

    const outpoint = selectClaimOutpointForUri(state, uri);

    const keyFromOpt = opt && opt.uriAccessKey;
    const cachedKey: ?UriAccessKey = state.content.uriAccessKeys[uri];
    const accessKey: ?UriAccessKey = keyFromOpt || cachedKey || null;

    dispatch({ type: ACTIONS.FETCH_FILE_INFO_STARTED, data: { outpoint } });

    Lbry.get({
      uri,
      environment: stripeEnvironment,
      ...(accessKey || {}),
    })
      .then((streamInfo: GetResponse) => {
        const timeout = streamInfo === null || typeof streamInfo !== 'object' || streamInfo.error === 'Timeout';
        if (timeout) {
          dispatch({
            type: ACTIONS.FETCH_FILE_INFO_FAILED,
            data: { outpoint },
          });

          dispatch(doToast({ message: `File timeout for uri ${uri}`, isError: true }));
        } else {
          if (streamInfo.purchase_receipt || streamInfo.content_fee) {
            dispatch({
              type: ACTIONS.PURCHASE_URI_COMPLETED,
              data: { uri, purchaseReceipt: streamInfo.purchase_receipt || streamInfo.content_fee },
            });
          }

          if (accessKey) {
            // User passed an access key and it was legit. Stash it, so we can
            // automatically re-append to URL when necessary.
            // e.g. when navigating back from Floating player.
            dispatch({
              type: ACTIONS.SAVE_URI_ACCESS_KEY,
              data: { uri, accessKey },
            });
          }

          dispatch({
            type: ACTIONS.FETCH_FILE_INFO_COMPLETED,
            data: {
              fileInfo: streamInfo,
              outpoint: outpoint,
            },
          });

          if (onSuccess) {
            onSuccess(streamInfo);
          }
        }
      })
      .catch((error) => {
        dispatch({
          type: ACTIONS.PURCHASE_URI_FAILED,
          data: { uri, error },
        });

        dispatch({
          type: ACTIONS.FETCH_FILE_INFO_FAILED,
          data: { outpoint },
        });

        // TODO: probably a better way to address this
        // supress no source error if it's a livestream
        const isLivestreamClaim = selectIsLivestreamClaimForUri(state, uri);
        if (isLivestreamClaim && error.message === "stream doesn't have source data") return;

        dispatch(
          doToast({
            message: __('Failed to load the file. If problem persists, visit https://help.odysee.tv/ for support.'),
            ...(error.message ? { subMessage: error.message } : {}),
            isError: true,
            duration: 'long',
          })
        );
      });
  };
};

export function doPurchaseUri(uri: string, costInfo: { cost: number }, onSuccess?: (GetResponse) => any) {
  return (dispatch: Dispatch, getState: GetState) => {
    dispatch({
      type: ACTIONS.PURCHASE_URI_STARTED,
      data: { uri },
    });

    const state = getState();
    const balance = selectBalance(state);

    const { cost } = costInfo;
    if (parseFloat(cost) > balance) {
      dispatch({
        type: ACTIONS.PURCHASE_URI_FAILED,
        data: { uri, error: 'Insufficient credits' },
      });

      Promise.resolve();
      return;
    }

    dispatch(doFileGetForUri(uri, null, onSuccess));
  };
}

export function doClearPurchasedUriSuccess() {
  return {
    type: ACTIONS.CLEAR_PURCHASED_URI_SUCCESS,
  };
}
