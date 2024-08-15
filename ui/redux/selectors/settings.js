import * as SETTINGS from 'constants/settings';
import * as DAEMON_SETTINGS from 'constants/daemon_settings';
import * as STRIPE from 'constants/stripe';
import SUPPORTED_BROWSER_LANGUAGES from 'constants/supported_browser_languages';

import { createSelector } from 'reselect';
import { ENABLE_MATURE } from 'config';
import { getDefaultHomepageKey, getDefaultLanguage } from 'util/default-languages';
import { selectClaimForId } from 'redux/selectors/claims';
import { selectUserLocale } from 'redux/selectors/user';

const selectState = (state) => state.settings || {};

export const selectDaemonSettings = (state) => selectState(state).daemonSettings;
export const selectDaemonStatus = (state) => selectState(state).daemonStatus;
export const selectFfmpegStatus = createSelector(selectDaemonStatus, (status) => status.ffmpeg_status);
export const selectFindingFFmpeg = (state) => selectState(state).findingFFmpeg || false;
export const selectClientSettings = (state) => selectState(state).clientSettings || {};
export const selectLoadedLanguages = (state) => selectState(state).loadedLanguages || {};

export const selectClientSetting = (state, setting) => {
  const clientSettings = selectClientSettings(state);
  return clientSettings ? clientSettings[setting] : undefined;
};

export const selectUploadsFilteringSetting = (state) => {
  let setting = selectClientSetting(state, SETTINGS.UPLOAD_PAGE_FILTERING);

  // Default value. Needed for already logged in users not loading the default client setting changes. Can be removed after sometime.
  if (!setting) {
    setting = {
      isFilteringEnabled: false,
      sortOption: {
        key: 'updatedAt',
        value: 'asc',
      },
    };
  }

  return setting;
};

// refactor me
export const selectShowMatureContent = (state) => {
  return !ENABLE_MATURE ? false : selectClientSetting(state, SETTINGS.SHOW_MATURE);
};

export const selectTheme = (state) => {
  const theme = selectClientSetting(state, SETTINGS.THEME);
  if (theme === 'system') {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    } else {
      return 'dark';
    }
  }

  return theme;
};

export const selectIsAgeRestrictedContentAllowed = (state) => {
  return selectClientSetting(state, SETTINGS.AGE_RESTRICTED_CONTENT_ALLOWED);
};

export const selectAutomaticDarkModeEnabled = (state) =>
  selectClientSetting(state, SETTINGS.AUTOMATIC_DARK_MODE_ENABLED);
export const selectIsNight = (state) => selectState(state).isNight;
export const selectSavedWalletServers = (state) => selectState(state).customWalletServers;
export const selectSharedPreferences = (state) => selectState(state).sharedPreferences;

export const makeSelectSharedPreferencesForKey = (key) =>
  createSelector(selectSharedPreferences, (prefs) => (prefs ? prefs[key] : undefined));

export const selectHasWalletServerPrefs = createSelector(
  makeSelectSharedPreferencesForKey(DAEMON_SETTINGS.LBRYUM_SERVERS),
  (servers) => {
    return !!(servers && servers.length);
  }
);

export const selectThemePath = createSelector(
  selectTheme,
  selectAutomaticDarkModeEnabled,
  selectIsNight,
  (theme, automaticDarkModeEnabled, isNight) => {
    const dynamicTheme = automaticDarkModeEnabled && isNight ? 'dark' : theme;
    return dynamicTheme || 'light';
  }
);

export const selectHomepageCode = (state) => {
  const hp = selectClientSetting(state, SETTINGS.HOMEPAGE);
  const homepages = selectHomepageDb(state) || {};
  return homepages[hp] ? hp : getDefaultHomepageKey();
};

export const selectLanguage = (state) => {
  const lang = selectClientSetting(state, SETTINGS.LANGUAGE);
  return lang || getDefaultLanguage();
};

/**
 * Returns the full/raw homepage object that was fetched.
 */
export const selectHomepageDb = (state) => {
  return window.homepages; // TODO: find a better place than window.
};

/**
 * Returns an array of homepage codes that we currently support.
 * e.g. "['en', 'es', 'ru']"
 */
export const selectHomepageKeys = (state) => {
  const db = selectHomepageDb(state) || {};
  return Object.keys(db);
};

/**
 * Returns the data for the currently-selected homepage.
 */
export const selectHomepageData = (state) => {
  const homepageCode = selectHomepageCode(state);
  const homepages = selectHomepageDb(state);
  return homepages ? homepages[homepageCode] || homepages['en'] || {} : undefined;
};

export const selectHomepageCategoryChannelIds = createSelector(selectHomepageData, (homepage) => {
  let channels = [];
  if (homepage && homepage.categories) {
    for (let category in homepage.categories) {
      if (homepage.categories[category].channelIds) {
        for (let channel of homepage.categories[category].channelIds) {
          if (!channels.includes(channel)) {
            channels.push(channel);
          }
        }
      }
    }
  }
  return channels;
});

export const selectHomepageMeme = (state) => {
  const homepageCode = selectHomepageCode(state);
  const homepages = selectHomepageDb(state);
  if (homepages) {
    const meme = homepages[homepageCode]?.meme;
    if (meme && meme.text && meme.url) {
      return meme;
    }
  }
  return homepages ? homepages['en']?.meme || {} : {};
};

export const selectHomepageCustomBanners = (state) => {
  const homepageCode = selectHomepageCode(state);
  const homepages = selectHomepageDb(state);
  if (homepages) {
    const customBanners = homepages[homepageCode]?.customBanners;
    if (customBanners) {
      return customBanners;
    }
  }
  return homepages ? homepages['en']?.customBanners || {} : {};
};

export const selectHomepageDiscover = (state) => {
  const homepageCode = selectHomepageCode(state);
  const homepages = selectHomepageDb(state);
  if (homepages) {
    const discover = homepages[homepageCode].discover;
    if (discover) {
      return discover;
    }
  }
  return homepages ? homepages['en'].discover || [] : [];
};

export const selectHomepageDiscoverNew = (state) => {
  const homepageCode = selectHomepageCode(state);
  const homepages = selectHomepageDb(state);
  if (homepages) {
    const discover = homepages[homepageCode]?.discoverNew;
    if (discover) {
      return discover;
    }
  }
  return homepages ? homepages['en']?.discoverNew || [] : [];
};

export const selectHomepageAnnouncement = (state) => {
  const homepageCode = selectHomepageCode(state);
  const homepages = selectHomepageDb(state);
  if (homepages) {
    const news = homepages[homepageCode]?.announcement;
    const newsFallback = homepages['en']?.announcement;
    return news || newsFallback || '';
  }
  return '';
};

export const selectInRegionByCode = (state, code) => {
  const hp = selectClientSetting(state, SETTINGS.HOMEPAGE);
  const lang = selectLanguage(state);

  return hp === code || lang === code;
};

export const selectWildWestDisabled = (state) => {
  return selectInRegionByCode(state, SUPPORTED_BROWSER_LANGUAGES.de);
};

export const selectosNotificationsEnabled = (state) => selectClientSetting(state, SETTINGS.OS_NOTIFICATIONS_ENABLED);

export const selectDefaultChannelId = (state) => selectClientSetting(state, SETTINGS.ACTIVE_CHANNEL_CLAIM);
export const selectDefaultChannelClaim = createSelector(
  (state) => selectClaimForId(state, selectDefaultChannelId(state)),
  (defaultChannelClaim) => defaultChannelClaim
);

// @flow
export const selectPreferredCurrency = (state: State) => {
  const preferredCurrencySetting = selectClientSetting(state, SETTINGS.PREFERRED_CURRENCY);
  const locale = selectUserLocale(state);

  const preferredCurrency: CurrencyOption =
    preferredCurrencySetting || (locale?.continent === 'EU' ? STRIPE.CURRENCIES.EUR : STRIPE.CURRENCIES.USD);

  return preferredCurrency;
};

export const selectAutoplayNext = (state: State) => Boolean(selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT));
