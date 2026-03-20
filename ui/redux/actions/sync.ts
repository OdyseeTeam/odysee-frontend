import * as ACTIONS from 'constants/action_types';
import * as SETTINGS from 'constants/settings';
import { Lbryio } from 'lbryinc';
import Lbry from 'lbry';
import { doWalletEncrypt, doWalletDecrypt } from 'redux/actions/wallet';
import {
  selectSyncHash,
  selectLastSyncHash,
  selectGetSyncIsPending,
  selectSetSyncIsPending,
  selectSyncIsLocked,
} from 'redux/selectors/sync';
import { selectClientSetting } from 'redux/selectors/settings';
import { getSavedPassword, getAuthToken } from 'util/saved-passwords';
import { doHandleSyncComplete } from 'redux/actions/app';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { X_LBRY_AUTH_TOKEN } from 'constants/token';
let syncTimer = null;
const SYNC_INTERVAL = 1000 * 60 * 5; // 5 minutes

const NO_WALLET_ERROR = 'no wallet found for this user';
const BAD_PASSWORD_ERROR_NAME = 'InvalidPasswordError';

/**
 * Checks if there is a newer sync session, indicating that fetched data from
 * the current one can be dropped.
 *
 * @param getState
 * @param syncId [Optional] The id of the current sync session. If not given, assume not invalidated.
 * @returns {boolean}
 */
export function syncInvalidated(getState: GetState, syncId?: number) {
  const state = getState();
  return syncId && state.sync.sharedStateSyncId !== syncId;
}
export function doSetDefaultAccount(success: () => void, failure: (arg0: string) => void) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.SET_DEFAULT_ACCOUNT,
    });
    Lbry.account_list()
      .then((accountList) => {
        const { lbc_mainnet: accounts } = accountList;
        let defaultId;

        for (let i = 0; i < accounts.length; ++i) {
          if (accounts[i].satoshis > 0) {
            defaultId = accounts[i].id;
            break;
          }
        }

        // In a case where there's no balance on either account
        // assume the second (which is created after sync) as default
        if (!defaultId && accounts.length > 1) {
          defaultId = accounts[1].id;
        }

        // Set the default account
        if (defaultId) {
          Lbry.account_set({
            account_id: defaultId,
            default: true,
          })
            .then(() => {
              if (success) {
                success();
              }
            })
            .catch((err) => {
              if (failure) {
                failure(err);
              }
            });
        } else if (failure) {
          // no default account to set
          failure('Could not set a default account'); // fail
        }
      })
      .catch((err) => {
        if (failure) {
          failure(err);
        }
      });
  };
}
export function doSetSync(oldHash: string, newHash: string, data: any) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.SET_SYNC_STARTED,
    });
    return Lbryio.call(
      'sync',
      'set',
      {
        old_hash: oldHash,
        new_hash: newHash,
        data,
      },
      'post'
    )
      .then((response) => {
        if (!response.hash) {
          throw Error('No hash returned for sync/set.');
        }

        return dispatch({
          type: ACTIONS.SET_SYNC_COMPLETED,
          data: {
            syncHash: response.hash,
            lastSyncHash: newHash || response.hash,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: ACTIONS.SET_SYNC_FAILED,
          data: {
            error,
          },
        });
      });
  };
}
export function doUpdateLastSyncHash(hash: string | null | undefined) {
  return {
    type: ACTIONS.LAST_SYNC_HASH_UPDATED,
    data: hash,
  };
}
export const doGetSyncDesktop =
  (cb?: (arg0: any, arg1: any) => void, password?: string) => (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const syncEnabled = selectClientSetting(state, SETTINGS.ENABLE_SYNC);
    const getSyncPending = selectGetSyncIsPending(state);
    const setSyncPending = selectSetSyncIsPending(state);
    const syncLocked = selectSyncIsLocked(state);
    return getSavedPassword().then((savedPassword) => {
      const passwordArgument = password || password === '' ? password : savedPassword === null ? '' : savedPassword;

      if (syncEnabled && !getSyncPending && !setSyncPending && !syncLocked) {
        return dispatch(doGetSync(passwordArgument, cb));
      }
    });
  };

/**
 * doSyncLoop
 *
 * @param noInterval
 * @param syncId Optional ID to identify a specific loop. Can be used to abort the loop, for example.
 * @returns {(function(Dispatch, GetState): void)|*}
 */
export function doSyncLoop(noInterval?: boolean, syncId?: number) {
  return (dispatch: Dispatch, getState: GetState) => {
    if (!noInterval && syncTimer) clearInterval(syncTimer);
    const state = getState();
    const hasVerifiedEmail = selectUserVerifiedEmail(state);
    const syncEnabled = selectClientSetting(state, SETTINGS.ENABLE_SYNC);
    const syncLocked = selectSyncIsLocked(state);

    if (hasVerifiedEmail && syncEnabled && !syncLocked) {
      dispatch(doGetSyncDesktop((error, hasNewData) => dispatch(doHandleSyncComplete(error, hasNewData, syncId))));

      if (!noInterval) {
        syncTimer = setInterval(() => {
          const state = getState();
          const syncEnabled = selectClientSetting(state, SETTINGS.ENABLE_SYNC);

          if (syncEnabled) {
            dispatch(doGetSyncDesktop((error, hasNewData) => dispatch(doHandleSyncComplete(error, hasNewData))));
          }
        }, SYNC_INTERVAL);
      }
    }
  };
}
export function doSyncUnsubscribe() {
  return () => {
    if (syncTimer) {
      clearInterval(syncTimer);
    }
  };
}
export function doGetSync(passedPassword?: string, callback?: (arg0: any, arg1: boolean | null | undefined) => void) {
  const password = passedPassword === null || passedPassword === undefined ? '' : passedPassword;

  function handleCallback(error, hasNewData) {
    if (callback) {
      if (typeof callback !== 'function') {
        throw new Error('Second argument passed to "doGetSync" must be a function');
      }

      callback(error, hasNewData);
    }
  }

  // @if TARGET='web'
  const xAuth =
    Lbry.getApiRequestHeaders() && Object.keys(Lbry.getApiRequestHeaders()).includes(X_LBRY_AUTH_TOKEN)
      ? Lbry.getApiRequestHeaders()[X_LBRY_AUTH_TOKEN]
      : '';

  if (xAuth && xAuth !== getAuthToken()) {
    window.location.reload();
    return () => {};
  }

  // @endif
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const localHash = selectSyncHash(state);
    dispatch({
      type: ACTIONS.GET_SYNC_STARTED,
    });
    const data = {};
    return Lbry.wallet_status()
      .then((status) => {
        if (status.is_locked) {
          return Lbry.wallet_unlock({
            password,
          });
        }

        // Wallet is already unlocked
        return true;
      })
      .then((isUnlocked) => {
        if (isUnlocked) {
          return Lbry.sync_hash();
        }

        data.unlockFailed = true;
        throw new Error();
      })
      .then((hash?: string) => {
        data.lastSyncHash = hash;
        return Lbryio.call(
          'sync',
          'get',
          {
            hash,
          },
          'post'
        );
      })
      .then((response: any) => {
        const syncHash = response.hash;
        data.syncHash = syncHash;
        data.syncData = response.data;
        data.changed = response.changed || syncHash !== localHash;
        data.hasSyncedWallet = true;

        if (!response.error && response.changed) {
          return Lbry.sync_apply({
            password,
            data: response.data,
            blocking: true,
          });
        }
      })
      .then((response) => {
        if (!response) {
          dispatch({
            type: ACTIONS.GET_SYNC_COMPLETED,
            data,
          });
          handleCallback(null, data.changed);
          return;
        }

        const { hash: walletHash, data: walletData } = response;
        data.lastSyncHash = walletHash;

        if (walletHash !== data.syncHash) {
          // different local hash, need to synchronise
          return dispatch(doSetSync(data.syncHash, walletHash, walletData)).then((setSyncResult) => {
            if (setSyncResult?.type !== ACTIONS.SET_SYNC_COMPLETED || !setSyncResult?.data?.syncHash) {
              throw setSyncResult?.data?.error || new Error('sync/set failed');
            }

            data.syncHash = setSyncResult.data.syncHash;
            dispatch({
              type: ACTIONS.GET_SYNC_COMPLETED,
              data,
            });
            handleCallback(null, data.changed);
          });
        }

        dispatch({
          type: ACTIONS.GET_SYNC_COMPLETED,
          data,
        });
        handleCallback(null, data.changed);
      })
      .catch((syncAttemptError) => {
        const badPasswordError =
          syncAttemptError && syncAttemptError.data && syncAttemptError.data.name === BAD_PASSWORD_ERROR_NAME;
        const tooBigDataError = Boolean(
          syncAttemptError?.message?.match(
            /rpc call sync_apply\(\) on.*?status code: 413. could not decode body to rpc response: invalid character/
          )
        );

        if (data.unlockFailed) {
          dispatch({
            type: ACTIONS.GET_SYNC_FAILED,
            data: {
              error: syncAttemptError,
            },
          });

          if (badPasswordError) {
            dispatch({
              type: ACTIONS.SYNC_APPLY_BAD_PASSWORD,
            });
          }

          handleCallback(syncAttemptError);
        } else if (!tooBigDataError && data.hasSyncedWallet) {
          const error = (syncAttemptError && syncAttemptError.message) || 'Error getting synced wallet';
          dispatch({
            type: ACTIONS.GET_SYNC_FAILED,
            data: {
              error,
            },
          });

          if (badPasswordError) {
            dispatch({
              type: ACTIONS.SYNC_APPLY_BAD_PASSWORD,
            });
          }

          handleCallback(error);
        } else {
          const noWalletError = syncAttemptError && syncAttemptError.message === NO_WALLET_ERROR;
          dispatch({
            type: ACTIONS.GET_SYNC_COMPLETED,
            data: {
              hasSyncedWallet: false,
              syncHash: null,
              lastSyncHash: data.lastSyncHash,
              // If there was some unknown error, bail
              fatalError: !noWalletError,
            },
          });

          if (tooBigDataError && !noWalletError) {
            handleCallback(false, true);
          }

          // user doesn't have a synced wallet
          //   call sync_apply to get data to sync
          //   first time sync. use any string for old hash
          if (noWalletError) {
            return Lbry.sync_apply({
              password,
            })
              .then(({ hash: walletHash, data: syncApplyData }) => {
                dispatch(doSetSync('', walletHash, syncApplyData));
                handleCallback(false, true);
              })
              .catch((syncApplyError) => {
                handleCallback(syncApplyError);
              });
          }
        }
      });
  };
}
export function doSyncApply(syncHash: string, syncData: any, password: string) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.SYNC_APPLY_STARTED,
    });
    return Lbry.sync_apply({
      password,
      data: syncData,
    })
      .then(({ hash: walletHash, data: walletData }) => {
        dispatch({
          type: ACTIONS.SYNC_APPLY_COMPLETED,
          data: {
            lastSyncHash: walletHash,
          },
        });

        if (walletHash !== syncHash) {
          // different local hash, need to synchronise
          return dispatch(doSetSync(syncHash, walletHash, walletData));
        }
      })
      .catch(() => {
        dispatch({
          type: ACTIONS.SYNC_APPLY_FAILED,
          data: {
            error: 'Invalid password specified. Please enter the password for your previously synchronised wallet.',
          },
        });
      });
  };
}
export function doCheckSync() {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.GET_SYNC_STARTED,
    });
    Lbry.sync_hash().then((hash) => {
      Lbryio.call(
        'sync',
        'get',
        {
          hash,
        },
        'post'
      )
        .then((response) => {
          const data = {
            hasSyncedWallet: true,
            syncHash: response.hash,
            lastSyncHash: hash,
            syncData: response.data,
            hashChanged: response.changed,
          };
          dispatch({
            type: ACTIONS.GET_SYNC_COMPLETED,
            data,
          });
        })
        .catch(() => {
          // user doesn't have a synced wallet
          dispatch({
            type: ACTIONS.GET_SYNC_COMPLETED,
            data: {
              hasSyncedWallet: false,
              syncHash: null,
              lastSyncHash: hash,
            },
          });
        });
    });
  };
}
export function doResetSync() {
  return (dispatch: Dispatch): Promise<any> =>
    new Promise((resolve) => {
      dispatch({
        type: ACTIONS.SYNC_RESET,
      });
      resolve();
    });
}
export function doSyncEncryptAndDecrypt(oldPassword: string, newPassword: string, encrypt: boolean) {
  return (dispatch: Dispatch) => {
    const data = {};
    return Lbry.sync_hash()
      .then((hash) =>
        Lbryio.call(
          'sync',
          'get',
          {
            hash,
          },
          'post'
        )
      )
      .then((syncGetResponse) => {
        data.oldHash = syncGetResponse.hash;
        return Lbry.sync_apply({
          password: oldPassword,
          data: syncGetResponse.data,
        });
      })
      .then(() => {
        if (encrypt) {
          dispatch(doWalletEncrypt(newPassword));
        } else {
          dispatch(doWalletDecrypt());
        }
      })
      .then(() =>
        Lbry.sync_apply({
          password: newPassword,
        })
      )
      .then((syncApplyResponse) => {
        if (syncApplyResponse.hash !== data.oldHash) {
          return dispatch(doSetSync(data.oldHash, syncApplyResponse.hash, syncApplyResponse.data));
        }

        return undefined;
      })
      .catch(console.error); // eslint-disable-line
  };
}
export function doSetSyncLock(lock: boolean) {
  return {
    type: ACTIONS.SET_SYNC_LOCK,
    data: lock,
  };
}
export function doSetPrefsReady() {
  return {
    type: ACTIONS.SET_PREFS_READY,
    data: true,
  };
}
type SharedData = {
  version: '0.1';
  value: {
    subscriptions?: Array<string>;
    following?: Array<{
      uri: string;
      notificationsDisabled: boolean;
    }>;
    tags?: Array<string>;
    blocked?: Array<string>;
    coin_swap_codes?: Array<string>;
    settings?: any;
    app_welcome_version?: number;
    sharing_3P?: boolean;
    unpublishedCollections: CollectionGroup;
    editedCollections: CollectionGroup;
    updatedCollections: UpdatedCollectionGroup;
    builtinCollections: CollectionGroup;
    savedCollectionIds: Array<string>;
    autoPublishById?: Record<string, boolean>;
    lastViewedAnnouncement?: LastViewedAnnouncement;
  };
};

function extractUserState(rawObj: SharedData) {
  if (rawObj && rawObj.version === '0.1' && rawObj.value) {
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(rawObj.value, key);

    const {
      subscriptions,
      following,
      tags,
      blocked,
      coin_swap_codes,
      settings,
      app_welcome_version,
      sharing_3P,
      unpublishedCollections,
      editedCollections,
      updatedCollections,
      builtinCollections,
      savedCollectionIds,
      autoPublishById,
      lastViewedAnnouncement,
    } = rawObj.value;
    return {
      ...(hasOwn('subscriptions')
        ? {
            subscriptions,
          }
        : {}),
      ...(hasOwn('following')
        ? {
            following,
          }
        : {}),
      ...(hasOwn('tags')
        ? {
            tags,
          }
        : {}),
      ...(hasOwn('blocked')
        ? {
            blocked,
          }
        : {}),
      ...(hasOwn('coin_swap_codes')
        ? {
            coin_swap_codes,
          }
        : {}),
      ...(hasOwn('settings')
        ? {
            settings,
          }
        : {}),
      ...(hasOwn('app_welcome_version')
        ? {
            app_welcome_version,
          }
        : {}),
      ...(hasOwn('sharing_3P')
        ? {
            sharing_3P,
          }
        : {}),
      ...(hasOwn('unpublishedCollections')
        ? {
            unpublishedCollections,
          }
        : {}),
      ...(hasOwn('editedCollections')
        ? {
            editedCollections,
          }
        : {}),
      ...(hasOwn('updatedCollections')
        ? {
            updatedCollections,
          }
        : {}),
      ...(hasOwn('builtinCollections')
        ? {
            builtinCollections,
          }
        : {}),
      ...(hasOwn('savedCollectionIds')
        ? {
            savedCollectionIds,
          }
        : {}),
      ...(hasOwn('autoPublishById')
        ? {
            autoPublishById,
          }
        : {}),
      ...(hasOwn('lastViewedAnnouncement')
        ? {
            lastViewedAnnouncement,
          }
        : {}),
    };
  }

  return {};
}

export function doPopulateSharedUserState(sharedSettings: any) {
  return (dispatch: Dispatch) => {
    const {
      subscriptions,
      following,
      tags,
      blocked,
      coin_swap_codes,
      settings,
      app_welcome_version,
      sharing_3P,
      unpublishedCollections,
      editedCollections,
      updatedCollections,
      builtinCollections,
      savedCollectionIds,
      autoPublishById,
      lastViewedAnnouncement,
    } = extractUserState(sharedSettings);
    dispatch({
      type: ACTIONS.USER_STATE_POPULATE,
      data: {
        subscriptions,
        following,
        tags,
        blocked,
        coinSwapCodes: coin_swap_codes,
        settings,
        welcomeVersion: app_welcome_version,
        allowAnalytics: sharing_3P,
        unpublishedCollections,
        editedCollections,
        updatedCollections,
        builtinCollections,
        savedCollectionIds,
        autoPublishById,
        lastViewedAnnouncement,
      },
    });
  };
}

async function syncSharedPreferenceWrite(
  dispatch: Dispatch,
  getState: GetState,
  previousSyncHash: string | null | undefined,
  currentSyncHash: string | null | undefined
) {
  const state = getState();
  const syncEnabled = selectClientSetting(state, SETTINGS.ENABLE_SYNC);
  const hasVerifiedEmail = selectUserVerifiedEmail(state);
  const syncLocked = selectSyncIsLocked(state);

  if (!syncEnabled || !hasVerifiedEmail || syncLocked || !currentSyncHash || currentSyncHash === previousSyncHash) {
    return;
  }

  const savedPassword = await getSavedPassword();
  const password = savedPassword === null ? '' : savedPassword;
  const walletStatus = await Lbry.wallet_status();

  if (walletStatus.is_locked) {
    await Lbry.wallet_unlock({
      password,
    });
  }

  const { hash: walletHash, data: walletData } = await Lbry.sync_apply({
    password,
  });

  if (walletHash !== previousSyncHash) {
    await dispatch(doSetSync(previousSyncHash || '', walletHash, walletData));
  }
}

export function doPreferenceSet(
  key: string,
  value: any,
  version: string,
  success: (...args: Array<any>) => any,
  fail: (...args: Array<any>) => any
) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const previousSyncHash = selectLastSyncHash(getState());
    const preference = {
      type: typeof value,
      version,
      value,
    };
    const options = {
      key,
      value: JSON.stringify(preference),
    };

    try {
      await Lbry.preference_set(options);
      const syncHash = await Lbry.sync_hash();
      dispatch(doUpdateLastSyncHash(syncHash));

      if (key === 'shared') {
        try {
          await syncSharedPreferenceWrite(dispatch, getState, previousSyncHash, syncHash);
        } catch (syncError) {
          console.error('Failed to sync shared preferences after preference_set', syncError); // eslint-disable-line no-console

          dispatch({
            type: ACTIONS.SYNC_FATAL_ERROR,
            error: syncError,
          });
        }
      }

      if (success) {
        success(preference);
      }

      return preference;
    } catch (err) {
      dispatch({
        type: ACTIONS.SYNC_FATAL_ERROR,
        error: err,
      });

      if (fail) {
        fail();
      }
    }
  };
}
export function doPreferenceGet(
  key: string,
  success: (...args: Array<any>) => any,
  fail?: (...args: Array<any>) => any
) {
  return (dispatch: Dispatch) => {
    const options = {
      key,
    };
    return Lbry.preference_get(options)
      .then((result) => {
        if (result) {
          const preference = result[key];
          return success(preference);
        }

        return success(null);
      })
      .catch((err) => {
        dispatch({
          type: ACTIONS.SYNC_FATAL_ERROR,
          error: err,
        });

        if (fail) {
          fail(err);
        }
      });
  };
}
