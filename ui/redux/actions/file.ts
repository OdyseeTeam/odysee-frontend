import * as ACTIONS from 'constants/action_types';
import * as ABANDON_STATES from 'constants/abandon_states';
import Lbry from 'lbry';
import {
  selectClaimForUri,
  selectClaimIsMine,
  selectClaimOutpointForUri,
  selectIsFiatRequiredForUri,
  selectIsLivestreamClaimForUri,
  selectProtectedContentTagForUri,
} from 'redux/selectors/claims';
import { doAbandonClaim } from 'redux/actions/claims';
import { batchActions } from 'util/batch-actions';
import { doHideModal } from 'redux/actions/app';
import { navigateBack } from 'redux/router';
import { doClearPlayingUri } from 'redux/actions/content';
import { selectPlayingUri } from 'redux/selectors/content';
import { doToast } from 'redux/actions/notifications';
import { selectBalance } from 'redux/selectors/wallet';
import { makeSelectFileInfoForUri, selectOutpointFetchingForUri } from 'redux/selectors/file_info';
import { getStripeEnvironment } from 'util/stripe';
import { getChannelIdFromClaim, isClaimUnlisted } from 'util/claim';
import { toHex } from 'util/hex';
import { fetchHyperbeamPlaybackUrl } from 'util/hyperbeam-playback';
const stripeEnvironment = getStripeEnvironment();

async function getOwnedClaimAccessKey(
  dispatch: Dispatch,
  state: State,
  uri: string
): Promise<UriAccessKey | null | undefined> {
  const claim = selectClaimForUri(state, uri);
  const claimIsMine = selectClaimIsMine(state, claim);
  const isAccessControlled =
    isClaimUnlisted(claim) ||
    Boolean(claim?.value?.fee) ||
    selectIsFiatRequiredForUri(state, uri) ||
    Boolean(selectProtectedContentTagForUri(state, uri));

  if (!claim || !claimIsMine || !isAccessControlled) {
    return undefined;
  }

  const channelId = getChannelIdFromClaim(claim);
  if (!channelId) {
    return undefined;
  }

  try {
    const sigData: ChannelSignResponse = await Lbry.channel_sign({
      channel_id: channelId,
      hexdata: toHex(claim.claim_id),
    });
    const accessKey: UriAccessKey = {
      key: 'signature',
      value: sigData.signature,
      signature: sigData.signature,
      signature_ts: sigData.signing_ts,
    };
    dispatch({
      type: ACTIONS.SAVE_URI_ACCESS_KEY,
      data: {
        uri,
        accessKey,
      },
    });
    return accessKey;
  } catch {
    return null;
  }
}

export function doOpenFileInFolder(path: string) {
  return () => {
    window.open(path, '_blank', 'noopener,noreferrer');
  };
}
export function doOpenFileInShell(path: string) {
  return (dispatch: Dispatch) => {
    dispatch(doOpenFileInFolder(path));
  };
}
export function doDeleteFile(
  outpoint: string,
  deleteFromComputer: boolean | undefined,
  abandonClaim: boolean | undefined,
  cb: any,
  claim: Claim
) {
  return (dispatch: Dispatch) => {
    if (abandonClaim) {
      dispatch(doAbandonClaim(claim, cb));
    }

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
  };
}
export function doDeleteFileAndMaybeGoBack(
  uri: string,
  deleteFromComputer: boolean | undefined,
  abandonClaim: boolean | undefined,
  doGoBack: (arg0: any) => void,
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
                navigateBack();
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
export const doFileGetForUri = (uri: string, opt?: FileGetOptions | null, onSuccess?: (arg0: GetResponse) => any) => {
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
    const keyFromOpt = opt && (opt as any).uriAccessKey;
    const cachedKey: UriAccessKey | null | undefined = state.content.uriAccessKeys[uri];
    let accessKey: UriAccessKey | null | undefined = keyFromOpt || cachedKey || null;
    dispatch({
      type: ACTIONS.FETCH_FILE_INFO_STARTED,
      data: {
        outpoint,
      },
    });

    if (!accessKey) {
      accessKey = (await getOwnedClaimAccessKey(dispatch, state, uri)) || null;
    }

    Lbry.get({
      uri,
      environment: stripeEnvironment,
      ...accessKey,
    })
      .then(async (streamInfo: GetResponse & { error?: string; purchase_receipt?: any; content_fee?: any }) => {
        const timeout = streamInfo === null || typeof streamInfo !== 'object' || streamInfo.error === 'Timeout';

        if (timeout) {
          dispatch({
            type: ACTIONS.FETCH_FILE_INFO_FAILED,
            data: {
              outpoint,
            },
          });
          dispatch(
            doToast({
              message: `File timeout for uri ${uri}`,
              isError: true,
            })
          );
        } else {
          const hyperbeamPlaybackUrl = !accessKey ? await fetchHyperbeamPlaybackUrl(uri) : '';
          const resolvedStreamInfo = hyperbeamPlaybackUrl
            ? { ...streamInfo, streaming_url: hyperbeamPlaybackUrl }
            : streamInfo;

          if (resolvedStreamInfo.purchase_receipt || resolvedStreamInfo.content_fee) {
            dispatch({
              type: ACTIONS.PURCHASE_URI_COMPLETED,
              data: {
                uri,
                purchaseReceipt: resolvedStreamInfo.purchase_receipt || resolvedStreamInfo.content_fee,
              },
            });
          }

          if (accessKey) {
            // User passed an access key and it was legit. Stash it, so we can
            // automatically re-append to URL when necessary.
            // e.g. when navigating back from Floating player.
            dispatch({
              type: ACTIONS.SAVE_URI_ACCESS_KEY,
              data: {
                uri,
                accessKey,
              },
            });
          }

          dispatch({
            type: ACTIONS.FETCH_FILE_INFO_COMPLETED,
            data: {
              fileInfo: resolvedStreamInfo,
              outpoint: outpoint,
            },
          });

          if (onSuccess) {
            onSuccess(resolvedStreamInfo);
          }
        }
      })
      .catch((error) => {
        dispatch({
          type: ACTIONS.PURCHASE_URI_FAILED,
          data: {
            uri,
            error,
          },
        });
        dispatch({
          type: ACTIONS.FETCH_FILE_INFO_FAILED,
          data: {
            outpoint,
          },
        });
        // TODO: probably a better way to address this
        // supress no source error if it's a livestream
        const isLivestreamClaim = selectIsLivestreamClaimForUri(state, uri);
        if (isLivestreamClaim && error.message === "stream doesn't have source data") return;
        if (error?.message && /pending-/.test(error.message)) return;
        const fileClaim = selectClaimForUri(getState(), uri);
        if (fileClaim?.claim_id?.startsWith('pending-') || fileClaim?.confirmations === 0) {
          const retryDelays = [3000, 5000, 8000, 12000, 20000];
          const retryPending = async (attempt: number) => {
            if (attempt >= retryDelays.length) return;
            await new Promise((r) => setTimeout(r, retryDelays[attempt]));
            const s = getState();
            const c = selectClaimForUri(s, uri);
            if (c?.claim_id?.startsWith('pending-') || c?.confirmations === 0) {
              retryPending(attempt + 1);
            } else {
              dispatch(doFileGetForUri(uri, opt, onSuccess));
            }
          };
          retryPending(0);
          return;
        }
        dispatch(
          doToast({
            message: __('Failed to load the file. If problem persists, visit https://help.odysee.tv/ for support.'),
            ...(error.message
              ? {
                  subMessage: error.message,
                }
              : {}),
            isError: true,
            duration: 'long',
          })
        );
      });
  };
};
export function doPurchaseUri(
  uri: string,
  costInfo: {
    cost: number;
  },
  onSuccess?: (arg0: GetResponse) => any
) {
  return (dispatch: Dispatch, getState: GetState) => {
    dispatch({
      type: ACTIONS.PURCHASE_URI_STARTED,
      data: {
        uri,
      },
    });
    const state = getState();
    const balance = selectBalance(state);
    const { cost } = costInfo;

    if (parseFloat(String(cost)) > balance) {
      dispatch({
        type: ACTIONS.PURCHASE_URI_FAILED,
        data: {
          uri,
          error: 'Insufficient credits',
        },
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
