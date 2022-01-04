import * as ACTIONS from 'constants/action_types';
import * as MODALS from 'constants/modal_types';
import * as SETTINGS from 'constants/settings';
import { DOMAIN } from 'config';
import { doFetchChannelListMine, doFetchCollectionListMine, doCheckPendingClaims } from 'redux/actions/claims';
import { selectClaimForUri, selectClaimIsMineForUri, selectMyChannelClaims } from 'redux/selectors/claims';
import { doClearSupport, doBalanceSubscribe } from 'redux/actions/wallet';
import { doClearPublish } from 'redux/actions/publish';
import { Lbryio } from 'lbryinc';
import { doToast, doError, doNotificationList } from 'redux/actions/notifications';
import pushNotifications from '$web/src/push-notifications';
import { selectAllowAnalytics } from 'redux/selectors/app';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectUser, selectUserVerifiedEmail } from 'redux/selectors/user';
import { doSetPrefsReady, doPreferenceGet, doPopulateSharedUserState, syncInvalidated } from 'redux/actions/sync';
import { doAuthenticate } from 'redux/actions/user';
import { version as appVersion } from 'package.json';
import analytics from 'analytics';
import { doSignOutCleanup } from 'util/saved-passwords';
import { doNotificationSocketConnect } from 'redux/actions/websocket';

export function doOpenModal(id, modalProps = {}) {
  return {
    type: ACTIONS.SHOW_MODAL,
    data: {
      id,
      modalProps,
    },
  };
}

export function doHideModal() {
  return {
    type: ACTIONS.HIDE_MODAL,
  };
}

export function doNotifyEncryptWallet() {
  return (dispatch) => {
    dispatch(doOpenModal(MODALS.WALLET_ENCRYPT));
  };
}

export function doNotifyDecryptWallet() {
  return (dispatch) => {
    dispatch(doOpenModal(MODALS.WALLET_DECRYPT));
  };
}

export function doNotifyUnlockWallet() {
  return (dispatch) => {
    dispatch(doOpenModal(MODALS.WALLET_UNLOCK));
  };
}

export function doNotifyForgetPassword(props) {
  return (dispatch) => {
    dispatch(doOpenModal(MODALS.WALLET_PASSWORD_UNSAVE, props));
  };
}

export function doAlertError(errorList) {
  return (dispatch) => {
    dispatch(doError(errorList));
  };
}

export function doAlertWaitingForSync() {
  return (dispatch, getState) => {
    const state = getState();
    const authenticated = selectUserVerifiedEmail(state);

    dispatch(
      doToast({
        message: !authenticated
          ? __('Sign in or create an account to change this setting.')
          : __('Please wait a bit, we are still getting your account ready.'),
        isError: false,
      })
    );
  };
}

export function doDaemonReady() {
  return (dispatch) =>
    dispatch(
      doAuthenticate(
        appVersion,
        undefined,
        undefined,
        true,
        (status) => {
          const trendingAlgorithm =
            status &&
            status.wallet &&
            status.wallet.connected_features &&
            status.wallet.connected_features.trending_algorithm;

          if (trendingAlgorithm) {
            analytics.trendingAlgorithmEvent(trendingAlgorithm);
          }
        },
        undefined,
        DOMAIN
      )
    );
}

export function doClearCache() {
  return (dispatch) => {
    // Need to update this to work with new version of redux-persist
    // Leaving for now
    // const reducersToClear = whiteListedReducers.filter(reducerKey => reducerKey !== 'tags');
    // window.cacheStore.purge(reducersToClear);
    window.sessionStorage.clear();
    dispatch(doClearSupport());
    window.location.reload();
    return dispatch(doClearPublish());
  };
}

export function doChangeVolume(volume) {
  return (dispatch) => {
    dispatch({
      type: ACTIONS.VOLUME_CHANGED,
      data: {
        volume,
      },
    });
  };
}

export function doChangeMute(muted) {
  return (dispatch) => {
    dispatch({
      type: ACTIONS.VOLUME_MUTED,
      data: {
        muted,
      },
    });
  };
}

export function doClickCommentButton() {
  return {
    type: ACTIONS.ADD_COMMENT,
  };
}

export function doToggleSearchExpanded() {
  return {
    type: ACTIONS.TOGGLE_SEARCH_EXPANDED,
  };
}

export function doAnalyticsView(uri, timeToStart) {
  return (dispatch, getState) => {
    const state = getState();
    const claim = selectClaimForUri(state, uri);
    const { txid, nout, claim_id: claimId } = claim;
    const claimIsMine = selectClaimIsMineForUri(state, claim);
    const outpoint = `${txid}:${nout}`;

    if (claimIsMine) {
      return Promise.resolve();
    }

    return analytics.apiLogView(uri, outpoint, claimId, timeToStart);
  };
}

export function doAnalyticsBuffer(uri, bufferData) {
  return (dispatch, getState) => {
    const state = getState();
    const claim = selectClaimForUri(state, uri);
    const user = selectUser(state);
    const {
      value: { video, audio, source },
    } = claim;
    const timeAtBuffer = parseInt(bufferData.currentTime * 1000);
    const bufferDuration = parseInt(bufferData.secondsToLoad * 1000);
    const fileDurationInSeconds = (video && video.duration) || (audio && audio.duration);
    const fileSize = source.size; // size in bytes
    const fileSizeInBits = fileSize * 8;
    const bitRate = parseInt(fileSizeInBits / fileDurationInSeconds);
    const userId = user && user.id.toString();
    // if there's a logged in user, send buffer event data to watchman
    if (userId) {
      analytics.videoBufferEvent(claim, {
        timeAtBuffer,
        bufferDuration,
        bitRate,
        userId,
        duration: fileDurationInSeconds,
        playerPoweredBy: bufferData.playerPoweredBy,
        readyState: bufferData.readyState,
      });
    }
  };
}

export function doAnaltyicsPurchaseEvent(fileInfo) {
  return (dispatch) => {
    let purchasePrice = fileInfo.purchase_receipt && fileInfo.purchase_receipt.amount;
    if (purchasePrice) {
      const purchaseInt = Number(Number(purchasePrice).toFixed(0));
      analytics.purchaseEvent(purchaseInt);
    }
  };
}

export function doSignIn() {
  return (dispatch, getState) => {
    const state = getState();
    const user = selectUser(state);

    if (pushNotifications.supported && user) {
      pushNotifications.reconnect(user.id);
      pushNotifications.validate(user.id);
    }

    dispatch(doNotificationSocketConnect(true));
    dispatch(doNotificationList(null, false));
    dispatch(doCheckPendingClaims());
    dispatch(doBalanceSubscribe());
    dispatch(doFetchChannelListMine());
    dispatch(doFetchCollectionListMine());
  };
}

export function doSignOut() {
  return async (dispatch, getState) => {
    const state = getState();
    const user = selectUser(state);
    try {
      if (pushNotifications.supported && user) {
        await pushNotifications.disconnect(user.id);
      }
    } finally {
      Lbryio.call('user', 'signout')
        .then(doSignOutCleanup)
        .then(() => {
          window.persistor.purge();
        })
        .then(() => {
          setTimeout(() => {
            location.reload();
          });
        })
        .catch(() => location.reload());
    }
  };
}

export function doSetWelcomeVersion(version) {
  return {
    type: ACTIONS.SET_WELCOME_VERSION,
    data: version,
  };
}

export function doSetHasNavigated() {
  return {
    type: ACTIONS.SET_HAS_NAVIGATED,
    data: true,
  };
}

export function doToggle3PAnalytics(allowParam, doNotDispatch) {
  return (dispatch, getState) => {
    const state = getState();
    const allowState = selectAllowAnalytics(state);
    const allow = allowParam !== undefined && allowParam !== null ? allowParam : allowState;
    analytics.toggleThirdParty(allow);
    if (!doNotDispatch) {
      return dispatch({
        type: ACTIONS.SET_ALLOW_ANALYTICS,
        data: allow,
      });
    }
  };
}

export function doGetAndPopulatePreferences(syncId /* ?: number */) {
  return (dispatch, getState) => {
    const state = getState();
    const syncEnabled = selectClientSetting(state, SETTINGS.ENABLE_SYNC);

    if (!syncEnabled) return;

    let preferenceKey;
    preferenceKey = 'shared';

    function successCb(savedPreferences) {
      if (savedPreferences !== null) {
        if (!syncInvalidated(getState, syncId)) {
          dispatch(doPopulateSharedUserState(savedPreferences));
        }
      } else {
        dispatch(doSetPrefsReady());
      }
      return true;
    }

    function failCb(er) {
      dispatch(
        doToast({
          isError: true,
          message: __('Unable to load your saved preferences.'),
        })
      );

      dispatch({
        type: ACTIONS.SYNC_FATAL_ERROR,
        error: er,
      });

      return false;
    }

    return dispatch(doPreferenceGet(preferenceKey, successCb, failCb));
  };
}

export function doHandleSyncComplete(error, hasNewData, syncId) {
  return (dispatch, getState) => {
    if (!error) {
      if (hasNewData) {
        if (syncInvalidated(getState, syncId)) {
          return;
        }

        dispatch(doGetAndPopulatePreferences(syncId));
      }
    } else {
      console.error('Error in doHandleSyncComplete', error); // eslint-disable-line
    }
  };
}

export function doToggleInterestedInYoutubeSync() {
  return {
    type: ACTIONS.TOGGLE_YOUTUBE_SYNC_INTEREST,
  };
}

export function doToggleSplashAnimation() {
  return {
    type: ACTIONS.TOGGLE_SPLASH_ANIMATION,
  };
}

export function doSetActiveChannel(claimId) {
  return (dispatch, getState) => {
    if (claimId) {
      return dispatch({
        type: ACTIONS.SET_ACTIVE_CHANNEL,
        data: {
          claimId,
        },
      });
    }

    // If no claimId is passed, set the active channel to the one with the highest effective_amount
    const state = getState();
    const myChannelClaims = selectMyChannelClaims(state);

    if (!myChannelClaims || !myChannelClaims.length) {
      return;
    }

    const myChannelClaimsByEffectiveAmount = myChannelClaims.slice().sort((a, b) => {
      const effectiveAmountA = (a.meta && Number(a.meta.effective_amount)) || 0;
      const effectiveAmountB = (b.meta && Number(b.meta.effective_amount)) || 0;
      if (effectiveAmountA === effectiveAmountB) {
        return 0;
      } else if (effectiveAmountA > effectiveAmountB) {
        return -1;
      } else {
        return 1;
      }
    });

    const newActiveChannelClaim = myChannelClaimsByEffectiveAmount[0];

    dispatch({
      type: ACTIONS.SET_ACTIVE_CHANNEL,
      data: {
        claimId: newActiveChannelClaim.claim_id,
      },
    });
  };
}

export function doSetIncognito(incognitoEnabled) {
  return {
    type: ACTIONS.SET_INCOGNITO,
    data: {
      enabled: incognitoEnabled,
    },
  };
}
