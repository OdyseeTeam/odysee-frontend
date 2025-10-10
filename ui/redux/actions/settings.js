// @flow
import Lbry from 'lbry';
import { doWalletReconnect } from 'redux/actions/wallet';
import * as SETTINGS from 'constants/settings';
import * as DAEMON_SETTINGS from 'constants/daemon_settings';
import * as ACTIONS from 'constants/action_types';
import * as MODALS from 'constants/modal_types';
import * as SHARED_PREFERENCES from 'constants/shared_preferences';
import { doToast } from 'redux/actions/notifications';
import analytics from 'analytics';
import SUPPORTED_LANGUAGES from 'constants/supported_languages';
import { launcher } from 'util/autoLaunch';
import { selectClientSetting, selectHomepageDb } from 'redux/selectors/settings';
import { doSyncLoop, doSyncUnsubscribe, doSetSyncLock } from 'redux/actions/sync';
import { doAlertWaitingForSync, doGetAndPopulatePreferences, doOpenModal, doSetChronoLocale } from 'redux/actions/app';
import { selectPrefsReady } from 'redux/selectors/sync';
import { Lbryio } from 'lbryinc';
import { getDefaultLanguage } from 'util/default-languages';
import { postProcessHomepageDb, updateHomepageDb } from 'util/homepages';
import { LocalStorage } from 'util/storage';

const { URL_DEV } = require('config');
const { SDK_SYNC_KEYS } = SHARED_PREFERENCES;

export const IS_MAC = process.platform === 'darwin';
const UPDATE_IS_NIGHT_INTERVAL = 5 * 60 * 1000;

export function doFetchDaemonSettings() {
  return (dispatch: Dispatch) => {
    Lbry.settings_get().then((settings) => {
      analytics.setState(settings.share_usage_data);
      dispatch({
        type: ACTIONS.DAEMON_SETTINGS_RECEIVED,
        data: {
          settings,
        },
      });
    });
  };
}

export function doFindFFmpeg() {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.FINDING_FFMPEG_STARTED,
    });
    return Lbry.ffmpeg_find().then((done) => {
      dispatch(doGetDaemonStatus());
      dispatch({
        type: ACTIONS.FINDING_FFMPEG_COMPLETED,
      });
    });
  };
}

export function doGetDaemonStatus() {
  return (dispatch: Dispatch) => {
    return Lbry.status().then((status) => {
      dispatch({
        type: ACTIONS.DAEMON_STATUS_RECEIVED,
        data: {
          status,
        },
      });
      return status;
    });
  };
}

export function doClearDaemonSetting(key: string) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const ready = selectPrefsReady(state);

    if (!ready) {
      return dispatch(doAlertWaitingForSync());
    }

    const clearKey = {
      key,
    };

    assert(false, 'Will not work in web');

    // not if syncLocked
    Lbry.settings_clear(clearKey).then((defaultSettings) => {
      if (SDK_SYNC_KEYS.includes(key)) {
        dispatch({
          type: ACTIONS.SHARED_PREFERENCE_SET,
          data: { key: key, value: null },
        });
      }
      if (key === DAEMON_SETTINGS.LBRYUM_SERVERS) {
        dispatch(doWalletReconnect());
      }
    });
    Lbry.settings_get().then((settings) => {
      analytics.setState(settings.share_usage_data);
      dispatch({
        type: ACTIONS.DAEMON_SETTINGS_RECEIVED,
        data: {
          settings,
        },
      });
    });
  };
}
// if doPopulate is applying settings, we don't want to cause a loop; doNotDispatch = true.
export function doSetDaemonSetting(key: string, value: any, doNotDispatch: boolean = false) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const ready = selectPrefsReady(state);

    if (!ready) {
      return dispatch(doAlertWaitingForSync());
    }

    assert(false, 'Will not work in web');

    const newSettings = {
      key,
      value: !value && value !== false ? null : value,
    };
    Lbry.settings_set(newSettings).then((newSetting) => {
      if (SDK_SYNC_KEYS.includes(key) && !doNotDispatch) {
        dispatch({
          type: ACTIONS.SHARED_PREFERENCE_SET,
          data: { key: key, value: newSetting[key] },
        });
      }
      // hardcoding this in lieu of a better solution
      if (key === DAEMON_SETTINGS.LBRYUM_SERVERS) {
        dispatch(doWalletReconnect());
        // todo: add sdk reloadsettings() (or it happens automagically?)
      }
    });
    Lbry.settings_get().then((settings) => {
      analytics.setState(settings.share_usage_data);
      dispatch({
        type: ACTIONS.DAEMON_SETTINGS_RECEIVED,
        data: {
          settings,
        },
      });
    });
  };
}

export function doSaveCustomWalletServers(servers: string) {
  return {
    type: ACTIONS.SAVE_CUSTOM_WALLET_SERVERS,
    data: servers,
  };
}

export function doSetClientSetting(key: string, value: any, pushPrefs?: boolean) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const ready = selectPrefsReady(state);

    if (!ready && pushPrefs) {
      return dispatch(doAlertWaitingForSync());
    }

    dispatch({
      type: ACTIONS.CLIENT_SETTING_CHANGED,
      data: {
        key,
        value,
      },
    });

    if (pushPrefs) {
      dispatch(doPushSettingsToPrefs());
    }
  };
}

export const doSetPreferredCurrency = (value: any) => (dispatch: Dispatch) =>
  dispatch(doSetClientSetting(SETTINGS.PREFERRED_CURRENCY, value, true));

export function doUpdateIsNight() {
  return {
    type: ACTIONS.UPDATE_IS_NIGHT,
  };
}

export function doUpdateIsNightAsync() {
  return (dispatch: Dispatch) => {
    dispatch(doUpdateIsNight());

    setInterval(() => dispatch(doUpdateIsNight()), UPDATE_IS_NIGHT_INTERVAL);
  };
}

export function doSetDarkTime(value: any, options: any) {
  const { fromTo, time } = options;
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const darkModeTimes = state.settings.clientSettings[SETTINGS.DARK_MODE_TIMES];
    const { hour, min } = darkModeTimes[fromTo];
    const newHour = time === 'hour' ? value : hour;
    const newMin = time === 'min' ? value : min;
    const modifiedTimes = {
      [fromTo]: {
        hour: newHour,
        min: newMin,
        formattedTime: newHour + ':' + newMin,
      },
    };
    const mergedTimes = { ...darkModeTimes, ...modifiedTimes };

    dispatch(doSetClientSetting(SETTINGS.DARK_MODE_TIMES, mergedTimes));
    dispatch(doUpdateIsNight());
  };
}

export function doGetWalletSyncPreference() {
  const SYNC_KEY = 'enable-sync';
  return (dispatch: Dispatch) => {
    return Lbry.preference_get({ key: SYNC_KEY }).then((result) => {
      const enabled = result && result[SYNC_KEY];
      if (enabled !== null) {
        dispatch(doSetClientSetting(SETTINGS.ENABLE_SYNC, enabled));
      }
      return enabled;
    });
  };
}

export function doSetWalletSyncPreference(pref: any) {
  const SYNC_KEY = 'enable-sync';
  return (dispatch: Dispatch) => {
    return Lbry.preference_set({ key: SYNC_KEY, value: pref }).then((result) => {
      const enabled = result && result[SYNC_KEY];
      if (enabled !== null) {
        dispatch(doSetClientSetting(SETTINGS.ENABLE_SYNC, enabled));
      }
      return enabled;
    });
  };
}

export function doPushSettingsToPrefs() {
  return (dispatch: Dispatch) => {
    // $FlowFixMe please
    return new Promise((resolve, reject) => {
      dispatch({
        type: ACTIONS.SYNC_CLIENT_SETTINGS,
      });
      resolve();
    });
  };
}

export function doEnterSettingsPage() {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const syncEnabled = selectClientSetting(state, SETTINGS.ENABLE_SYNC);
    const hasVerifiedEmail = state.user && state.user.user && state.user.user.has_verified_email;
    if (IS_WEB && !hasVerifiedEmail) {
      return;
    }
    dispatch(doSyncUnsubscribe());
    if (syncEnabled && hasVerifiedEmail) {
      await dispatch(doSyncLoop(true));
    } else {
      await dispatch(doGetAndPopulatePreferences());
    }
    dispatch(doSetSyncLock(true));
  };
}

export function doExitSettingsPage() {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const hasVerifiedEmail = state.user && state.user.user && state.user.user.has_verified_email;
    if (IS_WEB && !hasVerifiedEmail) {
      return;
    }
    dispatch(doSetSyncLock(false));
    dispatch(doPushSettingsToPrefs());
    // syncLoop is restarted in store.js sharedStateCB if necessary
  };
}

async function fetchAndStoreLanguage(language: string) {
  // this should match the behavior/logic in index-web.html
  const url = `https://odysee.com/app-strings/${language}.json`;
  return fetch(url)
    .then((r) => r.json())
    .then((j) => {
      window.i18n_messages[language] = j;
    })
    .catch((err) => {
      assert(false, `Failed: "${language}" from (${url})`, err);
      throw err;
    });
}

export function doFetchLanguage(language: string) {
  return (dispatch: Dispatch, getState: GetState) => {
    const { settings } = getState();

    if (settings.language !== language || (settings.loadedLanguages && !settings.loadedLanguages.includes(language))) {
      return fetchAndStoreLanguage(language)
        .then(() => {
          dispatch(doSetChronoLocale(language));
          dispatch({ type: ACTIONS.DOWNLOAD_LANGUAGE_SUCCESS, data: { language } });
        })
        .catch((e) => {
          dispatch({ type: ACTIONS.DOWNLOAD_LANGUAGE_FAILURE });
        });
    }
  };
}

export function doFetchDevStrings() {
  return (dispatch: Dispatch, getState: GetState) => {
    // @if process.env.NODE_ENV!='production'
    if (!window.app_strings) {
      fetch(`${URL_DEV}/app-strings.json`)
        .then((r) => r.json())
        .then((j) => (window.app_strings = j))
        .catch(() => {});
    }
    // @endif
  };
}

function populateCategoryTitles(categories) {
  if (categories) {
    window.CATEGORY_PAGE_TITLE = {};
    Object.values(categories).forEach((x) => {
      // $FlowIgnore mixed bug
      window.CATEGORY_PAGE_TITLE[x.name] = x.label;
    });
  }
}

export function doLoadBuiltInHomepageData() {
  return (dispatch: Dispatch) => {
    // We always fetch fresh homepages on load, but the baked in data is
    // required for
    // (1) some homepages need English as fallback (e.g. empty portals).
    // (2) perceived faster startup
    //
    // As a compromise between the above needs vs. wanting a smaller ui.js,
    // we'll just bake in the English version.

    // @if process.env.CUSTOM_HOMEPAGE='true'

    // $FlowIgnore
    const enHp = require('homepages/odysee-en');
    if (enHp) {
      window.homepages = {};
      const keys = ['en', 'fr', 'es', 'de', 'it', 'hi', 'zh', 'ru', 'pt-BR']; // TODO: must come from hp repo
      keys.forEach((hp) => (window.homepages[hp] = undefined));
      window.homepages['en'] = enHp;
      populateCategoryTitles(window.homepages?.en?.categories);
      dispatch({ type: ACTIONS.FETCH_HOMEPAGES_DONE });
    }

    // @endif
  };
}

export function doOpenAnnouncements() {
  return (dispatch: Dispatch) => {
    // There is a weird useEffect in modalRouter that closes all modals on
    // initial mount. Not sure what scenario that covers, so just delay a bit
    // until it is mounted.
    setTimeout(() => {
      dispatch(doOpenModal(MODALS.ANNOUNCEMENTS, { isAutoInvoked: true }));
    }, 1000);
  };
}

export function doFetchHomepages(hp?: string) {
  return (dispatch: Dispatch) => {
    const param = hp ? `?hp=${hp}` : '';

    return fetch(`https://odysee.com/$/api/content/v2/get${param}`)
      .then((response) => response.json())
      .then((json) => {
        if (json?.status === 'success' && json?.data) {
          window.homepages = updateHomepageDb(window.homepages, json.data, hp);
          window.homepages = postProcessHomepageDb(window.homepages);
          populateCategoryTitles(window.homepages?.en?.categories);
          dispatch({ type: ACTIONS.FETCH_HOMEPAGES_DONE });
        } else {
          dispatch({ type: ACTIONS.FETCH_HOMEPAGES_FAILED });
        }
      })
      .catch((e) => {
        console.log('doFetchHomepages:', e); // eslint-disable-line no-console
        dispatch({ type: ACTIONS.FETCH_HOMEPAGES_FAILED });
      });
  };
}

export function doSetHomepage(code: string) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const homepages = selectHomepageDb(state);

    if (code && !homepages[code]) {
      await dispatch(doFetchHomepages(code));
    }

    // bc3c56b8: Why reset to null -- makes it look like homepage was deleted.
    const languageCode = code === getDefaultLanguage() ? null : code;

    dispatch(doSetClientSetting(SETTINGS.HOMEPAGE, languageCode));
  };
}

export function doSetLanguage(language: string) {
  return (dispatch: Dispatch, getState: GetState) => {
    const { settings } = getState();
    const { daemonSettings } = settings;
    const { share_usage_data: shareSetting } = daemonSettings;
    const isSharingData = shareSetting || IS_WEB;

    let languageSetting = language;
    // @if TARGET='DISABLED_FOR_NOW'
    if (language === getDefaultLanguage()) {
      languageSetting = null;
    }
    // @endif

    if (
      settings.language !== languageSetting ||
      (settings.loadedLanguages && !settings.loadedLanguages.includes(language))
    ) {
      return fetchAndStoreLanguage(language)
        .then(() => {
          dispatch(doSetChronoLocale(language));
          dispatch({ type: ACTIONS.DOWNLOAD_LANGUAGE_SUCCESS, data: { language } });
        })
        .then(() => {
          dispatch(doSetClientSetting(SETTINGS.LANGUAGE, languageSetting));
          if (isSharingData) {
            Lbryio.call('user', 'language', { language: language }).catch(() => {});
          }
        })
        .catch((e) => {
          dispatch(doSetClientSetting(SETTINGS.LANGUAGE, languageSetting));

          const languageName = SUPPORTED_LANGUAGES[language] ? SUPPORTED_LANGUAGES[language] : language;
          const fetched = Boolean(window.i18n_messages && window.i18n_messages[language]);

          const log = `doSetLanguage-${fetched ? 'load' : 'fetch'}`;
          analytics.log(e, { fingerprint: [log], tags: { language } }, log);

          dispatch(
            doToast({
              message: fetched
                ? __('Failed to load %language% translations.', { language: languageName })
                : __('Failed to fetch %language% translations.', { language: languageName }),
              isError: true,
            })
          );
        });
    } else {
      return Promise.resolve();
    }
  };
}

export function doSetAutoLaunch(value: any) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const autoLaunch = selectClientSetting(state, SETTINGS.AUTO_LAUNCH);

    if (IS_MAC || process.env.NODE_ENV !== 'production') {
      return;
    }

    if (value === undefined) {
      launcher.isEnabled().then((isEnabled) => {
        if (isEnabled) {
          if (!autoLaunch) {
            launcher.disable().then(() => {
              dispatch(doSetClientSetting(SETTINGS.AUTO_LAUNCH, false));
            });
          }
        } else {
          if (autoLaunch || autoLaunch === null || autoLaunch === undefined) {
            launcher.enable().then(() => {
              dispatch(doSetClientSetting(SETTINGS.AUTO_LAUNCH, true));
            });
          }
        }
      });
    } else if (value === true) {
      launcher.isEnabled().then(function (isEnabled) {
        if (!isEnabled) {
          launcher.enable().then(() => {
            dispatch(doSetClientSetting(SETTINGS.AUTO_LAUNCH, true));
          });
        } else {
          dispatch(doSetClientSetting(SETTINGS.AUTO_LAUNCH, true));
        }
      });
    } else {
      // value = false
      launcher.isEnabled().then(function (isEnabled) {
        if (isEnabled) {
          launcher.disable().then(() => {
            dispatch(doSetClientSetting(SETTINGS.AUTO_LAUNCH, false));
          });
        } else {
          dispatch(doSetClientSetting(SETTINGS.AUTO_LAUNCH, false));
        }
      });
    }
  };
}

export function doSetAppToTrayWhenClosed(value: any) {
  return (dispatch: Dispatch) => {
    LocalStorage.setItem(SETTINGS.TO_TRAY_WHEN_CLOSED, value);
    dispatch(doSetClientSetting(SETTINGS.TO_TRAY_WHEN_CLOSED, value));
  };
}

export function toggleVideoTheaterMode() {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const videoTheaterMode = selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE);

    dispatch(doSetClientSetting(SETTINGS.VIDEO_THEATER_MODE, !videoTheaterMode));
  };
}

export function toggleAutoplayNext() {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const ready = selectPrefsReady(state);
    const autoplayNext = selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT);

    dispatch(doSetClientSetting(SETTINGS.AUTOPLAY_NEXT, !autoplayNext, ready));

    dispatch(
      doToast({
        message: autoplayNext ? __('Autoplay Next is off.') : __('Autoplay Next is on.'),
      })
    );
  };
}

export function toggleAutoplayNextShort() {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const ready = selectPrefsReady(state);
    const autoplayNextShort = selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT_SHORTS);

    dispatch(doSetClientSetting(SETTINGS.AUTOPLAY_NEXT_SHORTS, !autoplayNextShort, ready));

    dispatch(
      doToast({
        message: autoplayNextShort ? __('Autoplay Next short is off.') : __('Autoplay Next short is on.'),
      })
    );
  };
}

export const doSetDefaultVideoQuality = (value: any) => (dispatch: Dispatch) =>
  dispatch(doSetClientSetting(SETTINGS.DEFAULT_VIDEO_QUALITY, value, true));

export const doSetDefaultChannel = (claimId: ClaimId) => (dispatch: Dispatch) =>
  dispatch(doSetClientSetting(SETTINGS.ACTIVE_CHANNEL_CLAIM, claimId, true));
