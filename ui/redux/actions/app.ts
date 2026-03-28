import moment from 'moment';
import { MINIMUM_VERSION, IGNORE_MINIMUM_VERSION, URL } from 'config';
import * as ACTIONS from 'constants/action_types';
import * as MODALS from 'constants/modal_types';
import * as SETTINGS from 'constants/settings';
import * as SHARED_PREFERENCES from 'constants/shared_preferences';
import Lbry from 'lbry';
import { doFetchChannelListMine, doCheckPendingClaims } from 'redux/actions/claims';
import { doFetchCollectionListMine } from 'redux/actions/collections';
import { doFetchPersonalRecommendations } from 'redux/actions/search';
import { doFetchViewHistory } from 'redux/actions/content';
import { selectClaimForUri, selectClaimIsMineForUri } from 'redux/selectors/claims';
import { doClearSupport, doBalanceSubscribe } from 'redux/actions/wallet';
import { doClearPublish } from 'redux/actions/publish';
import { Lbryio } from 'lbryinc';
import { doToast, doError, doNotificationList } from 'redux/actions/notifications';
import pushNotifications from '$web/src/push-notifications';

type PushNotifications = {
  supported: boolean;
  ready: Promise<void>;
  subscribe: (userId: number, permanent?: boolean) => Promise<boolean>;
  unsubscribe: (userId: number, permanent?: boolean) => Promise<boolean>;
  subscribed: (userId: number) => Promise<boolean>;
  reconnect: (userId: number) => Promise<boolean>;
  disconnect: (userId: number) => Promise<boolean>;
  validate: (userId: number) => Promise<void>;
};
const pushNotifs = pushNotifications as unknown as PushNotifications;
import Native from 'native';
import {
  selectIsUpgradeSkipped,
  selectUpdateUrl,
  selectUpgradeDownloadItem,
  selectRemoteVersion,
  selectUpgradeTimer,
  selectModal,
  selectAllowAnalytics,
  selectAppDrawerOpen,
} from 'redux/selectors/app';
import { selectDaemonSettings, selectClientSetting } from 'redux/selectors/settings';
import { selectUser, selectUserVerifiedEmail } from 'redux/selectors/user';
import { doSetPrefsReady, doPreferenceGet, doPopulateSharedUserState, syncInvalidated } from 'redux/actions/sync';
import { doAuthenticate } from 'redux/actions/user';
import { doMembershipMine } from 'redux/actions/memberships';
import analytics from 'analytics';
import { doSignOutCleanup } from 'util/saved-passwords';
import { LocalStorage, LS } from 'util/storage';
import { doNotificationSocketConnect } from 'redux/actions/websocket';
import { getClaimScheduledState, isClaimPrivate, isClaimUnlisted } from 'util/claim';
import { selectContentPositionForUri } from 'redux/selectors/content';
import { doTipAccountStatus } from './payments';
const appVersion = '0.0.0';

const CHECK_UPGRADE_INTERVAL = 10 * 60 * 1000;
export function doOpenModal(id: any, modalProps: any = {}) {
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
export function doUpdateDownloadProgress(percent: any) {
  return {
    type: ACTIONS.UPGRADE_DOWNLOAD_PROGRESSED,
    data: {
      percent,
    },
  };
}
export function doSkipUpgrade() {
  return {
    type: ACTIONS.SKIP_UPGRADE,
  };
}
export function doStartUpgrade() {
  return (_dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const url = selectUpdateUrl(state);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
}
export function doDownloadUpgrade() {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const url = selectUpdateUrl(state);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    dispatch({
      type: ACTIONS.UPGRADE_DOWNLOAD_STARTED,
    });
    dispatch(doHideModal());
    dispatch(doOpenModal(MODALS.DOWNLOADING));
  };
}
export function doDownloadUpgradeRequested() {
  return (dispatch: Dispatch) => dispatch(doDownloadUpgrade());
}
export function doClearUpgradeTimer() {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();

    if (selectUpgradeTimer(state)) {
      clearInterval(selectUpgradeTimer(state));
      dispatch({
        type: ACTIONS.CLEAR_UPGRADE_TIMER,
      });
    }
  };
}
export function doAutoUpdate() {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.AUTO_UPDATE_DOWNLOADED,
    });
    dispatch(doOpenModal(MODALS.AUTO_UPDATE_DOWNLOADED));
    dispatch(doClearUpgradeTimer());
  };
}
export function doAutoUpdateDeclined() {
  return (dispatch: Dispatch) => {
    dispatch(doClearUpgradeTimer());
    dispatch({
      type: ACTIONS.AUTO_UPDATE_DECLINED,
    });
  };
}
export function doCancelUpgrade() {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const upgradeDownloadItem = selectUpgradeDownloadItem(state);

    if (upgradeDownloadItem) {
      /*
       * Right now the remote reference to the download item gets garbage collected as soon as the
       * the download is over (maybe even earlier), so trying to cancel a finished download may
       * throw an error.
       */
      try {
        upgradeDownloadItem.cancel();
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
      }
    }

    dispatch({
      type: ACTIONS.UPGRADE_CANCELLED,
    });
  };
}
export function doCheckUpgradeAvailable() {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    dispatch({
      type: ACTIONS.CHECK_UPGRADE_START,
    });

    const success = ({ remoteVersion, upgradeAvailable }) => {
      dispatch({
        type: ACTIONS.CHECK_UPGRADE_SUCCESS,
        data: {
          upgradeAvailable,
          remoteVersion,
        },
      });

      if (
        upgradeAvailable &&
        !selectModal(state) &&
        (!selectIsUpgradeSkipped(state) || remoteVersion !== selectRemoteVersion(state))
      ) {
        dispatch(doOpenModal(MODALS.UPGRADE));
      }
    };

    const fail = () => {
      dispatch({
        type: ACTIONS.CHECK_UPGRADE_FAIL,
      });
    };

    if (Native && typeof (Native as any).getAppVersionInfo === 'function') {
      (Native as any).getAppVersionInfo().then(success, fail);
      return;
    }

    fail();
  };
}

/*
  Initiate a timer that will check for an app upgrade every 10 minutes.
 */
export function doCheckUpgradeSubscribe() {
  return (dispatch: Dispatch) => {
    const checkUpgradeTimer = setInterval(() => dispatch(doCheckUpgradeAvailable()), CHECK_UPGRADE_INTERVAL);
    dispatch({
      type: ACTIONS.CHECK_UPGRADE_SUBSCRIBE,
      data: {
        checkUpgradeTimer,
      },
    });
  };
}
export function doMinVersionCheck() {
  return (dispatch: Dispatch) => {
    fetch(`${URL}/$/minVersion/v1/get`)
      .then((response) => response.json())
      .then((json) => (json?.status === 'success' && json?.data ? Number(json.data) : undefined))
      .then((liveMinimumVersion) => {
        if (liveMinimumVersion > MINIMUM_VERSION) {
          dispatch({
            type: ACTIONS.RELOAD_REQUIRED,
            data: {
              reason: 'newVersionFound',
              extra: liveMinimumVersion,
            },
          });
        }
      })
      .catch((err) => assert(false, 'minVersion failed', err));
  };
}
export function doMinVersionSubscribe() {
  return (dispatch: Dispatch) => {
    if (IGNORE_MINIMUM_VERSION === 'true') {
      return;
    }

    dispatch(doMinVersionCheck());
    const CHECK_UPGRADE_INTERVAL_MS = 60 * 60 * 1000;
    setInterval(() => dispatch(doMinVersionCheck()), CHECK_UPGRADE_INTERVAL_MS);
  };
}
export function doCheckDaemonVersion() {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.DAEMON_VERSION_MATCH,
    });
  };
}
export function doNotifyEncryptWallet() {
  return (dispatch: Dispatch) => {
    dispatch(doOpenModal(MODALS.WALLET_ENCRYPT));
  };
}
export function doNotifyDecryptWallet() {
  return (dispatch: Dispatch) => {
    dispatch(doOpenModal(MODALS.WALLET_DECRYPT));
  };
}
export function doNotifyUnlockWallet() {
  return (dispatch: Dispatch) => {
    dispatch(doOpenModal(MODALS.WALLET_UNLOCK));
  };
}
export function doNotifyForgetPassword(props: any) {
  return (dispatch: Dispatch) => {
    dispatch(doOpenModal(MODALS.WALLET_PASSWORD_UNSAVE, props));
  };
}
export function doAlertError(errorList: any) {
  return (dispatch: Dispatch) => {
    dispatch(doError(errorList));
  };
}
export function doAlertWaitingForSync() {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const authenticated = selectUserVerifiedEmail(state);
    dispatch(
      doToast({
        message:
          !authenticated && IS_WEB
            ? __('Sign in or create an account to change this setting.')
            : __('Please wait a bit, we are still getting your account ready.'),
        isError: false,
      })
    );
  };
}
export function doDaemonReady() {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    // TODO: call doFetchDaemonSettings, then get usage data, and call doAuthenticate once they are loaded into the store
    const shareUsageData = IS_WEB || LocalStorage.getItem(LS.SHARE_INTERNAL) === 'true';
    dispatch(
      (doAuthenticate as Function)(
        appVersion,
        shareUsageData,
        (status: any) => {
          const trendingAlgorithm =
            status &&
            status.wallet &&
            status.wallet.connected_features &&
            status.wallet.connected_features.trending_algorithm;

          if (trendingAlgorithm) {
            analytics.event.trendingAlgorithm(trendingAlgorithm);
          }
        },
        undefined
      )
    );
    dispatch({
      type: ACTIONS.DAEMON_READY,
    });
  };
}
export function doClearCache() {
  return async (dispatch: Dispatch) => {
    window.persistor.pause();
    await window.persistor.flush();
    await window.persistor.purge();
    window.sessionStorage.clear();
    dispatch(doClearSupport());
    dispatch(doClearPublish());
    window.location.reload();
  };
}
export function doQuit() {
  return () => {
    window.close();
  };
}
export function doQuitAnyDaemon() {
  return (dispatch: Dispatch) => {
    dispatch(doQuit());
  };
}
export function doChangeVolume(volume: any) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.VOLUME_CHANGED,
      data: {
        volume,
      },
    });
  };
}
export function doChangeMute(muted: any) {
  return (dispatch: Dispatch) => {
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
export function doAnalyticsViewForUri(uri: string) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const claim = selectClaimForUri(state, uri);
    const { txid, nout, claim_id: claimId } = claim;
    const claimIsMine = selectClaimIsMineForUri(state, uri);
    const isUnlistedOrScheduled =
      (getClaimScheduledState(claim) as any) === 'scheduled' || isClaimUnlisted(claim) || isClaimPrivate(claim);
    const isGlobalMod = Boolean(selectUser(state)?.global_mod);
    const outpoint = `${txid}:${nout}`;

    if (claimIsMine || (isGlobalMod && isUnlistedOrScheduled)) {
      return Promise.resolve();
    }

    const position = selectContentPositionForUri(state, uri);

    return analytics.apiLog.view(uri, outpoint, claimId, position, undefined);
  };
}

export function doSyncLastPosition(uri: string, position: number) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const claim = selectClaimForUri(state, uri);
    if (!claim) return;

    const { txid, nout, claim_id: claimId } = claim;
    const claimIsMine = selectClaimIsMineForUri(state, uri);
    if (claimIsMine) return;

    const outpoint = `${txid}:${nout}`;
    analytics.apiLog.view(uri, outpoint, claimId, position, undefined);
  };
}
export function doAnalyticsBuffer(uri: string, bufferData: any) {
  return (dispatch: Dispatch, getState: GetState) => {
    const isLivestream = bufferData.isLivestream;
    const state = getState();
    const claim = selectClaimForUri(state, uri);
    const user = selectUser(state);
    const {
      value: { video, audio, source },
    } = claim;
    const timeAtBuffer = isLivestream ? 0 : parseInt(String(bufferData.currentTime * 1000));
    const bufferDuration = parseInt(String(bufferData.secondsToLoad * 1000));
    const fileDurationInSeconds = isLivestream ? 0 : (video && video.duration) || (audio && audio.duration);
    const fileSize = isLivestream ? 0 : source.size; // size in bytes

    const fileSizeInBits: number = isLivestream ? 0 : (fileSize as number) * 8;
    const bitRate = isLivestream
      ? bufferData.bitrateAsBitsPerSecond
      : parseInt(String(fileSizeInBits / fileDurationInSeconds));
    const userId = user && user.id.toString();

    // if there's a logged in user, send buffer event data to watchman
    if (userId) {
      analytics.video.videoBufferEvent(claim, {
        isLivestream,
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
export function doAnaltyicsPurchaseEvent(fileInfo: any) {
  return (dispatch: Dispatch) => {
    let purchasePrice = fileInfo.purchase_receipt && fileInfo.purchase_receipt.amount;

    if (purchasePrice) {
      const purchaseInt = Number(Number(purchasePrice).toFixed(0));
      analytics.event.purchase(purchaseInt);
    }
  };
}
export function doSignIn() {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const user = selectUser(state);

    if (pushNotifs.ready) {
      pushNotifs.ready
        .then(() => {
          if (pushNotifs.supported && user) {
            pushNotifs.reconnect(user.id);
            pushNotifs.validate(user.id);
          }
        })
        .catch(() => {});
    }

    dispatch(doNotificationSocketConnect(true));
    dispatch(doNotificationList(null, false));
    dispatch(doCheckPendingClaims(() => {}));
    dispatch(doBalanceSubscribe());
    dispatch(doFetchChannelListMine());
    dispatch(doFetchCollectionListMine());
    dispatch(doMembershipMine());
    dispatch(doTipAccountStatus());
    dispatch(doFetchPersonalRecommendations());
    dispatch(doFetchViewHistory());
  };
}

function clearBeforeUnloadListeners() {
  const beforeUnloads = Object.values(window.beforeUnloadMap || {});
  beforeUnloads.forEach((x) => {
    window.removeEventListener('beforeunload', x.cb);
  });
}

function doSignOutAction() {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const user = selectUser(state);

    try {
      if (pushNotifs.ready) {
        await pushNotifs.ready;
        if (pushNotifs.supported && user) {
          await pushNotifs.disconnect(user.id);
        }
      }
    } finally {
      LocalStorage.setItem('AR_ADDRESS_IN_USE', 'false');
      Lbryio.call('user', 'signout')
        .then(doSignOutCleanup)
        .then(async () => {
          window.persistor.pause();
          await window.persistor.flush();
          await window.persistor.purge();
        })
        .catch((err) => {
          analytics.error(`\`doSignOut\`: ${err.message || err}`);
        })
        .finally(() => location.reload());
    }
  };
}

export function doSignOut() {
  return async (dispatch: Dispatch, getState: GetState) => {
    const pendingActions = Object.values(window.beforeUnloadMap || {});

    if (pendingActions.length > 0) {
      dispatch(
        doOpenModal(MODALS.SIGN_OUT, {
          pendingActions: pendingActions.map((x) => x.msg),
          onConfirm: () => {
            clearBeforeUnloadListeners();
            dispatch(doSignOutAction());
          },
        })
      );
    } else {
      dispatch(doSignOutAction());
    }
  };
}
export function doSetWelcomeVersion(version: any) {
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
export function doToggle3PAnalytics(allowParam: any, doNotDispatch: any) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const allowState = selectAllowAnalytics(state);
    const allow = allowParam !== undefined && allowParam !== null ? allowParam : allowState;
    (analytics as any).toggleThirdParty(allow);

    if (!doNotDispatch) {
      return dispatch({
        type: ACTIONS.SET_ALLOW_ANALYTICS,
        data: allow,
      });
    }
  };
}
export function doGetAndPopulatePreferences(syncId?: number) {
  const { SDK_SYNC_KEYS } = SHARED_PREFERENCES;
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const syncEnabled = selectClientSetting(state, SETTINGS.ENABLE_SYNC);
    const hasVerifiedEmail = selectUserVerifiedEmail(state);
    let preferenceKey;
    // TODO: the logic should match `runPreferences`, but since this function is
    // only hit as a successful sync callback, it doesn't matter for now.
    preferenceKey = 'shared';

    function successCb(savedPreferences) {
      const successState = getState();
      const daemonSettings = selectDaemonSettings(successState);

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
export function doHandleSyncComplete(error: any, hasNewData: any, syncId: any) {
  return (dispatch: Dispatch, getState: GetState) => {
    if (!error) {
      if (hasNewData) {
        if (syncInvalidated(getState, syncId)) {
          return;
        }

        dispatch(doGetAndPopulatePreferences(syncId));
      }
    } else {
      // eslint-disable-next-line no-console
      console.error('Error in doHandleSyncComplete', error);
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
export function doSetActiveChannel(claimId: ClaimId, override?: boolean) {
  return (dispatch: Dispatch, getState: GetState) => {
    if (claimId || override) {
      return dispatch({
        type: ACTIONS.SET_ACTIVE_CHANNEL,
        data: {
          claimId,
        },
      });
    }
  };
}
export function doSetIncognito(incognitoEnabled: boolean) {
  return {
    type: ACTIONS.SET_INCOGNITO,
    data: {
      enabled: incognitoEnabled,
    },
  };
}
export function doSetAdBlockerFound(found: boolean) {
  return {
    type: ACTIONS.SET_AD_BLOCKER_FOUND,
    data: found,
  };
}
export function doSetGdprConsentList(rawList: string = '') {
  // https://community.cookiepro.com/s/article/UUID-66bcaaf1-c7ca-5f32-6760-c75a1337c226?language=en_US
  const list = rawList.split(',').filter(Boolean);
  return {
    type: ACTIONS.SET_GDPR_CONSENT_LIST,
    data: list,
  };
}
export function doToggleAppDrawer(type: any) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const openDrawer = selectAppDrawerOpen(state);
    const isOpen = openDrawer && openDrawer === type;

    if (isOpen) {
      dispatch({
        type: ACTIONS.DRAWER_CLOSED,
      });
    } else {
      dispatch({
        type: ACTIONS.DRAWER_OPENED,
        data: type,
      });
    }
  };
}
export const doSetMainPlayerDimension = (dimensions: any) => (dispatch: Dispatch) =>
  dispatch({
    type: ACTIONS.SET_MAIN_PLAYER_DIMENSIONS,
    data: dimensions,
  });
export const doSetVideoSourceLoaded = (uri: string) => (dispatch: Dispatch) =>
  dispatch({
    type: ACTIONS.SET_VIDEO_SOURCE_LOADED,
    data: uri,
  });
const MOMENT_LOCALE_MAP = {
  no: 'nn',
  'zh-Hans': 'zh-cn',
  'zh-Hant': 'zh-tw',
};
export function doSetChronoLocale(language: string) {
  return (dispatch: Dispatch, getState: GetState) => {
    const lang = MOMENT_LOCALE_MAP[language] || language;

    if (lang === 'en' || (lang && lang.startsWith('en-'))) {
      moment.locale('en');
    } else {
      import(/* @vite-ignore */ `moment/locale/${lang}`)
        .then(() => moment.locale(lang))
        .catch((err) => {
          assert(false, 'Failed to load locale:', err);
          moment.locale('en');
        });
    }
  };
}
export function doSetAssignedLbrynetServer(server: string) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.SET_ASSIGNED_LBRYNET_SERVER,
      data: server,
    });
  };
}
